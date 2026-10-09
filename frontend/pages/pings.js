import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchApiJson } from '../lib/api';

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
          fetchApiJson('/pings'),
          fetchApiJson('/services'),
        ]);

        setPings(pingsRes);
        setServices(servicesRes);
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

  if (loading) {
    return (
      <LoadingSpinner message="Loading data... The backend may take up to a minute to wake after inactivity." />
    );
  }
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

      {filteredPings.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "white",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#666" }}>Service</th>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#666" }}>Status</th>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#666" }}>URL</th>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#666" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredPings.map((ping, index) => (
                <tr key={`${ping.service_id}-${ping.timestamp}-${index}`} style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td style={{ padding: "0.9rem 1rem", color: "#333", fontWeight: "bold" }}>{ping.name}</td>
                  <td style={{ padding: "0.9rem 1rem" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      backgroundColor: ping.status === "online" ? "#e8f5e9" : "#ffebee",
                      color: ping.status === "online" ? "#2e7d32" : "#c62828",
                    }}>
                      {ping.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "0.9rem 1rem", color: "#666" }}>{ping.url}</td>
                  <td style={{ padding: "0.9rem 1rem", color: "#999", whiteSpace: "nowrap" }}>
                    {new Date(ping.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "#666" }}>No logs found for the selected service.</p>
      )}
    </div>
  );
}
