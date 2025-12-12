import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

export function TraceDisplay() {
  const [traceId, setTraceId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = sessionStorage.getItem("current-trace-id");
      setTraceId(id);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!traceId) return null;

  const jaegerUrl = `http://localhost:16686/trace/${traceId}`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        padding: "0.5rem 1rem",
        backgroundColor: "#333",
        color: "white",
        borderRadius: "4px",
        fontSize: "0.8rem",
        fontFamily: "monospace",
      }}
    >
      <Activity
        size={14}
        style={{ marginRight: "0.5rem", display: "inline" }}
      />
      Trace: {traceId.substring(0, 8)}...
      <button
        onClick={() => navigator.clipboard.writeText(traceId)}
        style={{
          marginLeft: "0.5rem",
          padding: "0.2rem 0.5rem",
          cursor: "pointer",
        }}
      >
        Copy
      </button>
      <a
        href={jaegerUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginLeft: "0.5rem",
          color: "#4fc3f7",
          textDecoration: "none",
        }}
      >
        View in Jaeger →
      </a>
    </div>
  );
}
