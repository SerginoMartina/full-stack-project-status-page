import React, { useState, useEffect } from 'react';

export default function Pings() {
  const [pings, setPings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pings`)
      .then(res => res.json())
      .then(data => {
        setPings(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading ping logs...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f4f49', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>📡 Ping Logs</h1>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
        {pings.map((ping, index) => (
          <div 
            key={index} 
            style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              border: '1px solid #eee'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ color: '#333' }}>{ping.name}</strong>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '10px', 
                fontSize: '0.75rem', 
                backgroundColor: ping.status === 'online' ? '#e8f5e9' : '#ffebee',
                color: ping.status === 'online' ? '#2e7d32' : '#c62828'
              }}>
                {ping.status.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0' }}>{ping.url}</p>
            <small style={{ color: '#999' }}>{new Date(ping.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
