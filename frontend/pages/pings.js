import React, { useState, useEffect } from 'react';

export default function Pings() {
  const [pings, setPings] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pingsRes, servicesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/pings`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/services`),
        ]);

        const pingsData = await pingsRes.json();
        const servicesData = await servicesRes.json();

        setPings(pingsData);
        setServices(servicesData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPings = 
    selectedServiceId === '' 
      ? pings 
      : pings.filter(ping => ping.service_id === parseInt(selectedServiceId));

  if (loading) return <div style={{ padding: '2rem' }}>Loading data...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h1 style={{ margin: 0 }}>📡 Ping Logs</h1>
        <nav>
          <a
            href="/"
            style={{
              marginRight: "1.5rem",
              textDecoration: "none",
              color: "#666",
              fontWeight: "bold",
            }}
          >
            Back to Dashboard
          </a>
        </nav>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ fontWeight: 'bold' }}>Filter by Service:</label>
        <select
          style={{
            padding: '0.8rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: '1px solid #ccc',
            width: '100%',
            maxWidth: '400px',
          }}
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
        >
          <option value="">All Services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
        }}
      >
        {filteredPings.length > 0 ? (
          filteredPings.map((ping, index) => (
            <div
              key={index}
              style={{
                padding: "1rem",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                border: "1px solid #eee",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong style={{ color: "#333" }}>{ping.name}</strong>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  backgroundColor: ping.status === "online" ? "#e8f5e9" : "#ffebee",
                  color: ping.status === "online" ? "#2e7d32" : "#c62828",
                }}>
                  {ping.status.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.5rem 0" }}>{ping.url}</p>
              <small style={{ color: "#999" }}>{new Date(ping.timestamp).toLocaleString()}</small>
            </div>
          ))
        ) : (
          <p style={{ color: '#666' }}>No logs found for the selected service.</p>
        )}
      </div>
    </div>
  );
}
