import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LoadingSpinner from "../../components/LoadingSpinner";
import { fetchApiJson } from "../../lib/api";

export default function ServiceDetails() {
  const router = useRouter();
  const serviceId = router.query.id;
  const [service, setService] = useState(null);
  const [pings, setPings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady || typeof serviceId !== "string") return;

    const fetchServiceDetails = async () => {
      try {
        const [serviceData, pingsData] = await Promise.all([
          fetchApiJson(`/services/${serviceId}`),
          fetchApiJson(`/services/${serviceId}/pings`),
        ]);

        setService(serviceData);
        setPings(pingsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [router.isReady, serviceId]);

  if (loading) {
    return (
      <LoadingSpinner message="Loading service... The backend may take up to a minute to wake after inactivity." />
    );
  }
  if (error) {
    return <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>;
  }

  return (
    <>
      <Head>
        <title>{service.name}</title>
      </Head>
      <div
        style={{
          padding: "2rem",
          fontFamily: "sans-serif",
          backgroundColor: "#f4f4f9",
          minHeight: "100vh",
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
        <h1 style={{ margin: 0 }}>{service.name}</h1>
          <a
            href="/"
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              backgroundColor: "#0070f3",
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Back to dashboard
          </a>
      </div>

      <p style={{ color: "#666", marginTop: 0 }}>
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#0070f3", overflowWrap: "anywhere" }}
        >
          {service.url}
        </a>
      </p>
      <h2 style={{ marginBottom: "1rem" }}>Ping Logs</h2>

      {pings.length > 0 ? (
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
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#666" }}>Status</th>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#666" }}>URL</th>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#666" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {pings.map((ping) => (
                <tr key={ping.id} style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td style={{ padding: "0.9rem 1rem" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "0.75rem",
                        backgroundColor:
                          ping.status === "online" ? "#e8f5e9" : "#ffebee",
                        color: ping.status === "online" ? "#2e7d32" : "#c62828",
                      }}
                    >
                      {ping.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "0.9rem 1rem", color: "#666" }}>{ping.url}</td>
                  <td
                    style={{
                      padding: "0.9rem 1rem",
                      color: "#999",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(ping.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "#666" }}>No ping logs found for this service yet.</p>
      )}
      </div>
    </>
  );
}
