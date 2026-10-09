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
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unknown',
        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS pings (
        id SERIAL PRIMARY KEY,
        service_id INTEGER REFERENCES services(id),
        url TEXT,
        status VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS services_name_unique_idx
      ON services (LOWER(BTRIM(name)))
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS services_url_unique_idx
      ON services (LOWER(BTRIM(url)))
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
  console.log("Checking service statuses...");
  const res = await pool.query("SELECT id, name, url FROM services");
  for (const service of res.rows) {
    const status = await pingService(service.url);
    await pool.query(
      "UPDATE services SET status = $1, last_checked = CURRENT_TIMESTAMP WHERE id = $2",
      [status, service.id],
    );
    await pool.query(
      "INSERT INTO pings (service_id, url, status) VALUES ($1, $2, $3)",
      [service.id, service.url, status],
    );
  }
  console.log("Status check complete.");
}, 60000); // Every 60 seconds

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
    const result = await pool.query("SELECT * FROM services ORDER BY id ASC");
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
        EXISTS (SELECT 1 FROM services WHERE LOWER(BTRIM(name)) = LOWER($1)) AS duplicate_name,
        EXISTS (SELECT 1 FROM services WHERE LOWER(BTRIM(url)) = LOWER($2)) AS duplicate_url`,
      [normalizedName, normalizedUrl],
    );
    if (duplicate.rows[0].duplicate_name || duplicate.rows[0].duplicate_url) {
      return res.status(409).json({
        error: "A service with this name or URL already exists.",
      });
    }

    const result = await pool.query(
      "INSERT INTO services (name, url, status) VALUES ($1, $2, 'unknown') RETURNING *",
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

app.get("/services/:id/pings", async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: "Service ID must be a positive integer." });
  }

  try {
    const result = await pool.query(
      `SELECT id, service_id, url, status, timestamp
       FROM pings
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

app.get("/services/:id", async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: "Service ID must be a positive integer." });
  }

  try {
    const result = await pool.query("SELECT * FROM services WHERE id = $1", [serviceId]);
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
      FROM pings p 
      JOIN services s ON p.service_id = s.id 
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
