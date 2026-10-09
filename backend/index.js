const express = require("express");
const { Pool } = require("pg");
const redis = require("redis");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(require("cors")());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Database Initialization - Run on startup
const initDb = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query("CREATE SCHEMA IF NOT EXISTS status_page");
    await client.query(`
      DO $$
      BEGIN
        IF to_regclass('status_page.services') IS NULL
           AND to_regclass('public.services') IS NOT NULL THEN
          ALTER TABLE public.services SET SCHEMA status_page;
        END IF;
        IF to_regclass('status_page.pings') IS NULL
           AND to_regclass('public.pings') IS NOT NULL THEN
          ALTER TABLE public.pings SET SCHEMA status_page;
        END IF;
        IF to_regclass('status_page.service_changes') IS NULL
           AND to_regclass('public.service_changes') IS NOT NULL THEN
          ALTER TABLE public.service_changes SET SCHEMA status_page;
        END IF;
      END
      $$;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS status_page.services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unknown',
        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS status_page.pings (
        id SERIAL PRIMARY KEY,
        service_id INTEGER REFERENCES status_page.services(id) ON DELETE CASCADE,
        url TEXT,
        status VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS status_page.service_changes (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES status_page.services(id) ON DELETE CASCADE,
        old_name VARCHAR(255) NOT NULL,
        new_name VARCHAR(255) NOT NULL,
        old_url TEXT NOT NULL,
        new_url TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE status_page.pings DROP CONSTRAINT IF EXISTS pings_service_id_fkey;
      ALTER TABLE status_page.pings
      ADD CONSTRAINT pings_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES status_page.services(id) ON DELETE CASCADE;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS status_page.services_name_unique_idx
      ON status_page.services (LOWER(BTRIM(name)))
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS status_page.services_url_unique_idx
      ON status_page.services (LOWER(BTRIM(url)))
    `);
    console.log("Database initialized.");
  } catch (err) {
    console.error("Database initialization error:", err);
  } finally {
    client?.release();
  }
};

initDb();

// Helper: Ping a URL
const pingService = async (url) => {
  try {
    const response = await fetch(url, {
      mode: "no-cors",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? "online" : "offline";
  } catch (e) {
    return "offline";
  }
};

// Update status in background
setInterval(async () => {
  try {
    console.log("Checking service statuses...");
    const res = await pool.query("SELECT id FROM status_page.services");
    for (const service of res.rows) {
      let client;
      try {
        client = await pool.connect();
        await client.query("BEGIN");
        const currentResult = await client.query(
          "SELECT url FROM status_page.services WHERE id = $1 FOR UPDATE",
          [service.id],
        );
        if (currentResult.rowCount === 0) {
          await client.query("COMMIT");
          continue;
        }

        const url = currentResult.rows[0].url;
        const status = await pingService(url);
        await client.query(
          "UPDATE status_page.services SET status = $1, last_checked = CURRENT_TIMESTAMP WHERE id = $2",
          [status, service.id],
        );
        await client.query(
          "INSERT INTO status_page.pings (service_id, url, status) VALUES ($1, $2, $3)",
          [service.id, url, status],
        );
        await client.query("COMMIT");
      } catch (err) {
        if (client) {
          try {
            await client.query("ROLLBACK");
          } catch (rollbackError) {
            console.error("Failed to roll back service status check:", rollbackError);
          }
        }
        console.error(`Failed to check service ${service.id}:`, err);
      } finally {
        client?.release();
      }
    }
    console.log("Status check complete.");
  } catch (err) {
    console.error("Service status check failed:", err);
  }
}, 60 * 60 * 1000); // Every hour

// Routes
app.get("/health", async (req, res) => {
  try {
    const dbRes = await pool.query("SELECT NOW()");
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    const redisRes = await redisClient.get("health_check");
    res.json({
      status: "healthy",
      database: dbRes.rows[0],
      redis: redisRes,
    });
  } catch (err) {
    res.status(500).json({ status: "unhealthy", error: err.message });
  }
});

app.get("/services", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM status_page.services ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/services", async (req, res) => {
  const { name, url } = req.body;
  if (typeof name !== "string" || typeof url !== "string" || !name.trim() || !url.trim()) {
    return res.status(400).json({ error: "Name and URL are required" });
  }

  const normalizedName = name.trim();
  const normalizedUrl = url.trim();

  try {
    const duplicate = await pool.query(
      `SELECT
        EXISTS (SELECT 1 FROM status_page.services WHERE LOWER(BTRIM(name)) = LOWER($1)) AS duplicate_name,
        EXISTS (SELECT 1 FROM status_page.services WHERE LOWER(BTRIM(url)) = LOWER($2)) AS duplicate_url`,
      [normalizedName, normalizedUrl],
    );
    if (duplicate.rows[0].duplicate_name || duplicate.rows[0].duplicate_url) {
      return res.status(409).json({
        error: "A service with this name or URL already exists.",
      });
    }

    const result = await pool.query(
      "INSERT INTO status_page.services (name, url, status) VALUES ($1, $2, 'unknown') RETURNING *",
      [normalizedName, normalizedUrl],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "A service with this name or URL already exists.",
      });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put("/services/:id", async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: "Service ID must be a positive integer." });
  }

  const { name, url } = req.body;
  if (typeof name !== "string" || typeof url !== "string" || !name.trim() || !url.trim()) {
    return res.status(400).json({ error: "Name and URL are required" });
  }

  const normalizedName = name.trim();
  const normalizedUrl = url.trim();
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const currentResult = await client.query(
      "SELECT * FROM status_page.services WHERE id = $1 FOR UPDATE",
      [serviceId],
    );
    if (currentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Service not found." });
    }

    const duplicate = await client.query(
      `SELECT
        EXISTS (SELECT 1 FROM status_page.services WHERE id <> $3 AND LOWER(BTRIM(name)) = LOWER($1)) AS duplicate_name,
        EXISTS (SELECT 1 FROM status_page.services WHERE id <> $3 AND LOWER(BTRIM(url)) = LOWER($2)) AS duplicate_url`,
      [normalizedName, normalizedUrl, serviceId],
    );
    if (duplicate.rows[0].duplicate_name || duplicate.rows[0].duplicate_url) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "A service with this name or URL already exists.",
      });
    }

    const current = currentResult.rows[0];
    const updatedResult = await client.query(
      "UPDATE status_page.services SET name = $1, url = $2 WHERE id = $3 RETURNING *",
      [normalizedName, normalizedUrl, serviceId],
    );

    if (current.name !== normalizedName || current.url !== normalizedUrl) {
      await client.query(
        `INSERT INTO status_page.service_changes (service_id, old_name, new_name, old_url, new_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [serviceId, current.name, normalizedName, current.url, normalizedUrl],
      );
    }

    await client.query("COMMIT");
    res.json(updatedResult.rows[0]);
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Failed to roll back service update:", rollbackError);
      }
    }
    if (err.code === "23505") {
      return res.status(409).json({
        error: "A service with this name or URL already exists.",
      });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client?.release();
  }
});

app.delete("/services/:id", async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: "Service ID must be a positive integer." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM status_page.services WHERE id = $1 RETURNING id",
      [serviceId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Service not found." });
    }
    res.json({ message: "Service and its logs deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/services/:id/pings", async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: "Service ID must be a positive integer." });
  }

  try {
    const result = await pool.query(
      `SELECT id, service_id, url, status, timestamp
       FROM status_page.pings
       WHERE service_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`,
      [serviceId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/services/:id/logs", async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: "Service ID must be a positive integer." });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM (
        SELECT id, 'ping' AS type, status, url,
               NULL::VARCHAR(255) AS old_name, NULL::VARCHAR(255) AS new_name,
               NULL::TEXT AS old_url, NULL::TEXT AS new_url, timestamp
        FROM status_page.pings
        WHERE service_id = $1
        UNION ALL
        SELECT id, 'service_change' AS type, NULL::VARCHAR(50) AS status, NULL::TEXT AS url,
               old_name, new_name, old_url, new_url, timestamp
        FROM status_page.service_changes
        WHERE service_id = $1
      ) AS activity
      ORDER BY timestamp DESC
      LIMIT 100`,
      [serviceId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/services/:id", async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: "Service ID must be a positive integer." });
  }

  try {
    const result = await pool.query("SELECT * FROM status_page.services WHERE id = $1", [serviceId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Service not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/pings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.name 
      FROM status_page.pings p
      JOIN status_page.services s ON p.service_id = s.id
      ORDER BY p.timestamp DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
