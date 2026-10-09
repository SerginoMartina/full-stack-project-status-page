import React, { useState, useEffect } from "react";
import Head from "next/head";
import LoadingSpinner from "../components/LoadingSpinner";
import AnimatedWorldBackground from "../components/AnimatedWorldBackground";
import { fetchApiJson } from "../lib/api";

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    fetchApiJson("/services")
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <>
        <Head>
          <title>Status page</title>
        </Head>
        <LoadingSpinner message="Loading status... The backend may take up to a minute to wake after inactivity." />
      </>
    );
  if (error)
    return (
      <>
        <Head>
          <title>Status page</title>
        </Head>
        <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>
      </>
    );

  const handleSaveService = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const url = e.target.url.value;
    try {
      const savedService = await fetchApiJson(
        editingService ? `/services/${editingService.id}` : "/services",
        {
          method: editingService ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, url }),
        },
      );
      if (editingService) {
        setServices((prev) =>
          prev.map((service) =>
            service.id === savedService.id ? savedService : service,
          ),
        );
      } else {
        setServices((prev) => [...prev, savedService]);
      }
      setIsModalOpen(false);
      setEditingService(null);
      e.target.reset();
    } catch (err) {
      alert(err.message || `Failed to ${editingService ? "update" : "add"} service`);
    }
  };

  const handleDeleteService = async (service) => {
    if (
      !window.confirm(
        `Delete "${service.name}" and all of its ping and change logs? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await fetchApiJson(`/services/${service.id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((item) => item.id !== service.id));
    } catch (err) {
      alert(err.message || "Failed to delete service");
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  return (
    <>
      <Head>
        <title>Status page</title>
      </Head>
      <AnimatedWorldBackground />
      <div
        style={{
          padding: "2rem",
          fontFamily: "sans-serif",
          backgroundColor: "rgba(16, 17, 18, 0.7)",
          color: "#f1f1ef",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #3b3d3f",
        }}
      >
        <h1 style={{ margin: 0 }}>🚀 Service Status Dashboard</h1>
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
          onClick={openAddModal}
          style={{
            padding: "0.6rem 1.2rem",
            backgroundColor: "#e1e1de",
            color: "#171819",
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
          <article
            key={service.id}
            style={{
              padding: "1.5rem",
              backgroundColor: "rgba(32, 34, 36, 0.94)",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              color: "inherit",
              borderLeft:
                service.status === "online"
                  ? "8px solid #4caf50"
                  : service.status === "offline"
                    ? "8px solid #f44336"
                    : "8px solid #ffeb3b",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0" }}>
              <a
                href={`/services/${service.id}`}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {service.name}
              </a>
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#b7b9ba",
                marginBottom: "1rem",
              }}
            >
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#d5d7d8",
                  overflowWrap: "anywhere",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {service.url}
              </a>
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
              <small style={{ color: "#a2a5a6" }}>
                {new Date(service.last_checked).toLocaleTimeString()}
              </small>
            </div>
            <a
              href={`/services/${service.id}`}
              style={{
                display: "inline-block",
                marginTop: "1rem",
                padding: "0.5rem 0.8rem",
                borderRadius: "6px",
                backgroundColor: "#dededb",
                color: "#171819",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              Read logs
            </a>
            <button
              type="button"
              onClick={() => openEditModal(service)}
              style={{
                marginTop: "1rem",
                marginLeft: "0.5rem",
                padding: "0.5rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #777b7d",
                backgroundColor: "transparent",
                color: "#e3e4e2",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDeleteService(service)}
              style={{
                marginTop: "1rem",
                marginLeft: "0.5rem",
                padding: "0.5rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #c62828",
                backgroundColor: "#202224",
                color: "#c62828",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              Delete
            </button>
          </article>
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
              backgroundColor: "#202224",
              color: "#f1f1ef",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              maxWidth: "400px",
              width: "90%",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "1rem" }}>
              {editingService ? "Edit Service" : "Add New Service"}
            </h2>
            <form
              onSubmit={handleSaveService}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  Name:
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingService?.name || ""}
                  style={{
                    padding: "0.5rem",
                    width: "100%",
                    borderRadius: "4px",
                    border: "1px solid #55595b",
                    backgroundColor: "#151617",
                    color: "#f1f1ef",
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
                  defaultValue={editingService?.url || ""}
                  style={{
                    padding: "0.5rem",
                    width: "100%",
                    borderRadius: "4px",
                    border: "1px solid #55595b",
                    backgroundColor: "#151617",
                    color: "#f1f1ef",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#3a3c3e",
                    color: "#f1f1ef",
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
                    backgroundColor: "#dededb",
                    color: "#171819",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {editingService ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
