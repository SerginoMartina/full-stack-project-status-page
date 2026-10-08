import React, { useState, useEffect } from "react";

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/services`)
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "2rem" }}>Loading status...</div>;
  if (error)
    return <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>;

  const handleAddService = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const url = e.target.url.value;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/services`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, url }),
        },
      );
      const newData = await res.json();
      if (res.ok) {
        setServices((prev) => [...prev, newData]);
        setIsModalOpen(false);
        e.target.reset();
      } else {
        alert(newData.error);
      }
    } catch (err) {
      alert("Failed to add service");
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        backgroundColor: "#f4f4f9",
        minHeight: "100vh",
        position: "relative",
      }}
    >
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
        <h1 style={{ margin: 0 }}>🚀 Service Status Dashboard</h1>
        <nav>
          <a
            href="/"
            style={{
              marginRight: "1.5rem",
              textDecoration: "none",
              color: "#0070f3",
              fontWeight: "bold",
            }}
          >
            Dashboard
          </a>
          <a
            href="/pings"
            style={{
              textDecoration: "none",
              color: "#666",
              fontWeight: "bold",
            }}
          >
            Ping Logs
          </a>
        </nav>
      </div>

      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Active Services</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: "0.6rem 1.2rem",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Add New Service
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {services.map((service) => (
          <div
            key={service.id}
            style={{
              padding: "1.5rem",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              borderLeft:
                service.status === "online"
                  ? "8px solid #4caf50"
                  : service.status === "offline"
                    ? "8px solid #f44336"
                    : "8px solid #ffeb3b",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0" }}>{service.name}</h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginBottom: "1rem",
              }}
            >
              {service.url}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  backgroundColor:
                    service.status === "online"
                      ? "#e8f5e9"
                      : service.status === "offline"
                        ? "#ffebee"
                        : "#fff9c4",
                  color:
                    service.status === "online"
                      ? "#2e7d32"
                      : service.status === "offline"
                        ? "#c62828"
                        : "#f9a825",
                }}
              >
                {service.status.toUpperCase()}
              </span>
              <small style={{ color: "#999" }}>
                {new Date(service.last_checked).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              maxWidth: "400px",
              width: "90%",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "1rem" }}>Add New Service</h2>
            <form
              onSubmit={handleAddService}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  Name:
                </label>
                <input
                  name="name"
                  required
                  style={{
                    padding: "0.5rem",
                    width: "100%",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  URL:
                </label>
                <input
                  name="url"
                  type="url"
                  required
                  style={{
                    padding: "0.5rem",
                    width: "100%",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#eee",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#0070f3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
