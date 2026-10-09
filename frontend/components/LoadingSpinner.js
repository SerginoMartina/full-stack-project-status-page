import React from "react";

export default function LoadingSpinner({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "2rem",
        fontFamily: "sans-serif",
        color: "#444",
      }}
    >
      <span className="spinner" aria-hidden="true" />
      <span>{message}</span>
      <style jsx>{`
        .spinner {
          width: 1.25rem;
          height: 1.25rem;
          flex: 0 0 auto;
          border: 3px solid #d7e3f5;
          border-top-color: #0070f3;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner {
            animation-duration: 2s;
          }
        }
      `}</style>
    </div>
  );
}
