import { useEffect, useState } from "react";
import { Activity, AlertCircle } from "lucide-react";
import { apiClient } from "../lib/api";

interface HealthData {
  status: "healthy" | "unhealthy";
  checks: {
    storage: "ok" | "error";
  };
}

export function HealthStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiClient.getHealth();
        setHealth(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch health status");
        console.error("Health check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
        <div className="spinner" style={{ margin: "0 auto 0.5rem" }}></div>
        Loading health status...
      </div>
    );

  if (error)
    return (
      <div style={{ padding: "2rem", color: "#ef4444", textAlign: "center" }}>
        <AlertCircle size={32} style={{ marginBottom: "0.5rem" }} />
        <div>{error}</div>
      </div>
    );

  const isHealthy = health?.status === "healthy";
  const storageOk = health?.checks.storage === "ok";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: isHealthy
                ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isHealthy ? "2px solid #6ee7b7" : "2px solid #fca5a5",
            }}
          >
            {isHealthy ? (
              <Activity color="#059669" size={24} />
            ) : (
              <AlertCircle color="#dc2626" size={24} />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.25rem",
              }}
            >
              API Status
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: isHealthy ? "#059669" : "#dc2626",
              }}
            >
              {health?.status.toUpperCase()}
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            background: isHealthy ? "#d1fae5" : "#fee2e2",
            border: isHealthy ? "1px solid #6ee7b7" : "1px solid #fca5a5",
            fontSize: "0.75rem",
            fontWeight: "600",
            color: isHealthy ? "#065f46" : "#991b1b",
          }}
        >
          {isHealthy ? "✓ Operational" : "✗ Down"}
        </div>
      </div>

      <div
        style={{
          padding: "1rem",
          background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              fontWeight: "500",
            }}
          >
            Storage Service
          </span>
          <span
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.75rem",
              fontWeight: "600",
              background: storageOk ? "#d1fae5" : "#fee2e2",
              color: storageOk ? "#065f46" : "#991b1b",
              border: storageOk ? "1px solid #6ee7b7" : "1px solid #fca5a5",
            }}
          >
            {storageOk ? "✓ OK" : "✗ Error"}
          </span>
        </div>
      </div>

      <div
        style={{
          fontSize: "0.75rem",
          color: "#9ca3af",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            background: "#22c55e",
            borderRadius: "50%",
            animation: "blink 2s ease-in-out infinite",
          }}
        ></span>
        Auto-refreshes every 5 seconds
      </div>
    </div>
  );
}
