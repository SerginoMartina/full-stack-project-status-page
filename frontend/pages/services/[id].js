import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LoadingSpinner from "../../components/LoadingSpinner";
import AnimatedWorldBackground from "../../components/AnimatedWorldBackground";
import { fetchApiJson } from "../../lib/api";

export default function ServiceDetails() {
  const router = useRouter();
  const serviceId = router.query.id;
  const [service, setService] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady || typeof serviceId !== "string") return;

    const fetchServiceDetails = async () => {
      try {
        const [serviceData, pingsData] = await Promise.all([
          fetchApiJson(`/services/${serviceId}`),
          fetchApiJson(`/services/${serviceId}/logs`),
        ]);

        setService(serviceData);
        setLogs(pingsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [router.isReady, serviceId]);

  const filteredLogs = logs.filter(
    (log) => logFilter === "all" || log.type === logFilter,
  );

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
        <h1 style={{ margin: 0 }}>{service.name}</h1>
          <a
            href="/"
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              backgroundColor: "#dededb",
              color: "#171819",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Back to dashboard
          </a>
      </div>

      <p style={{ color: "#c0c2c2", marginTop: 0 }}>
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#e0e1df", overflowWrap: "anywhere" }}
        >
          {service.url}
        </a>
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Activity Logs</h2>
        <label style={{ color: "#c0c2c2" }}>
          Filter:{" "}
          <select
            value={logFilter}
            onChange={(event) => setLogFilter(event.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #55595b",
              backgroundColor: "#202224",
              color: "#f1f1ef",
            }}
          >
            <option value="all">All activity</option>
            <option value="ping">Ping logs</option>
            <option value="service_change">Service changes</option>
          </select>
        </label>
      </div>

      {filteredLogs.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "rgba(32, 34, 36, 0.96)",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#c0c2c2" }}>Type</th>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#c0c2c2" }}>Details</th>
                <th scope="col" style={{ padding: "0.9rem 1rem", color: "#c0c2c2" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={`${log.type}-${log.id}`} style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td style={{ padding: "0.9rem 1rem" }}>
                    {log.type === "ping" ? (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "0.75rem",
                          backgroundColor:
                            log.status === "online" ? "#e8f5e9" : "#ffebee",
                          color: log.status === "online" ? "#2e7d32" : "#c62828",
                        }}
                      >
                        Ping · {log.status.toUpperCase()}
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "0.75rem",
                          backgroundColor: "#3a3d3f",
                          color: "#e2e3e1",
                        }}
                      >
                        Service change
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.9rem 1rem", color: "#d0d1d0", overflowWrap: "anywhere" }}>
                    {log.type === "ping" ? (
                      log.url
                    ) : (
                      <>
                        {log.old_name !== log.new_name && (
                          <div>Name: {log.old_name} → {log.new_name}</div>
                        )}
                        {log.old_url !== log.new_url && (
                          <div>URL: {log.old_url} → {log.new_url}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "0.9rem 1rem",
                      color: "#a2a5a6",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "#c0c2c2" }}>No logs found for this filter.</p>
      )}
      </div>
    </>
  );
}
