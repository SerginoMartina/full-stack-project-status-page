CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unknown',
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS services_name_unique_idx
    ON services (LOWER(BTRIM(name)));

CREATE UNIQUE INDEX IF NOT EXISTS services_url_unique_idx
    ON services (LOWER(BTRIM(url)));
