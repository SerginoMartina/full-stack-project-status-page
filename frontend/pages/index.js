import React, { useState, useEffect } from 'react';

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/services`)
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading status...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>🚀 Service Status Dashboard</h1>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {services.map(service => (
          <div 
            key={service.id} 
            style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderLeft: service.status === 'online' ? '8px solid #4caf50' : service.status === 'offline' ? '8px solid #f44336' : '8px solid #ffeb3b',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{service.name}</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>{service.url}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                backgroundColor: service.status === 'online' ? '#e8f5e9' : service.status === 'offline' ? '#ffebee' : '#fff9c4',
                color: service.status === 'online' ? '#2e7d32' : service.status === 'offline' ? '#c62828' : '#f9a825'
              }}>
                {service.status.toUpperCase()}
              </span>
              <small style={{ color: '#999' }}>
                {new Date(service.last_checked).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
