CREATE SCHEMA IF NOT EXISTS status_page;

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

ALTER TABLE status_page.pings DROP CONSTRAINT IF EXISTS pings_service_id_fkey;
ALTER TABLE status_page.pings
    ADD CONSTRAINT pings_service_id_fkey
    FOREIGN KEY (service_id) REFERENCES status_page.services(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS status_page.service_changes (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES status_page.services(id) ON DELETE CASCADE,
    old_name VARCHAR(255) NOT NULL,
    new_name VARCHAR(255) NOT NULL,
    old_url TEXT NOT NULL,
    new_url TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS services_name_unique_idx
    ON status_page.services (LOWER(BTRIM(name)));

CREATE UNIQUE INDEX IF NOT EXISTS services_url_unique_idx
    ON status_page.services (LOWER(BTRIM(url)));
