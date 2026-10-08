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
