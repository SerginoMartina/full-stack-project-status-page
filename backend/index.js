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
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unknown',
        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT INTO services (name, url, status) VALUES 
      ('Google', 'https://www.google.com', 'unknown'),
      ('GitHub', 'https://github.com', 'unknown'),
      ('Next.js', 'https://nextjs.org', 'unknown')
      ON CONFLICT DO NOTHING;
    `);
    console.log("Database initialized.");
    client.release();
  } catch (err) {
    console.error("Database initialization error:", err);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
