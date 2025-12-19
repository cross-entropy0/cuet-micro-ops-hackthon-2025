import { useState } from "react";
import { Download, CheckCircle, XCircle } from "lucide-react";
import { apiClient } from "../lib/api";
import { trackUserAction } from "../lib/telemetry";

interface DownloadResult {
  fileId: number;
  status: "completed" | "failed";
  message: string;
  processingTimeMs?: number;
  downloadUrl?: string | null;
}

export function DownloadManager() {
  const [fileId, setFileId] = useState("70000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleDownload = async () => {
    setLoading(true);
    setResult(null);
    setElapsedTime(0);

    const startTime = Date.now();
    console.log(`[Download] Starting download for file ID: ${fileId} at ${new Date().toISOString()}`);

    // Update elapsed time every second
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    try {
      const id = parseInt(fileId);
      const response = await apiClient.startDownload(id);

      clearInterval(timerInterval);
      const finalElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(finalElapsed);

      console.log(`[Download] Response received after ${finalElapsed}s:`, response.data);
      
      if (response.data.downloadUrl) {
        console.log(`[Download] Download URL: ${response.data.downloadUrl}`);
      }

      // Track user action with Sentry v8 API
      trackUserAction("download.initiate", {
        fileId: id,
        timestamp: new Date().toISOString(),
        processingTimeMs: response.data.processingTimeMs,
        status: "success",
        elapsedTime: finalElapsed,
      });

      setResult({
        fileId: id,
        status: response.data.status,
        message: response.data.message,
        processingTimeMs: response.data.processingTimeMs,
        downloadUrl: response.data.downloadUrl,
      });
    } catch (error: any) {
      clearInterval(timerInterval);
      const finalElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(finalElapsed);

      console.error(`[Download] Error after ${finalElapsed}s:`, error.message);

      // Track error with Sentry v8 API
      trackUserAction("download.initiate", {
        fileId: parseInt(fileId),
        timestamp: new Date().toISOString(),
        status: "error",
        error: error.message,
        elapsedTime: finalElapsed,
      });

      setResult({
        fileId: parseInt(fileId),
        status: "failed",
        message: error.message || "Download failed",
      });
    } finally {
      clearInterval(timerInterval);
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input
          type="number"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          placeholder="Enter File ID"
          style={{
            flex: 1,
            padding: "0.875rem 1rem",
            fontSize: "0.875rem",
            border: "2px solid #e5e7eb",
            borderRadius: "10px",
            outline: "none",
            transition: "all 0.2s ease",
            background: "white",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
        <button
          onClick={handleDownload}
          disabled={loading}
          style={{
            padding: "0.875rem 1.5rem",
            background: loading
              ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "transform 0.2s ease",
            boxShadow: loading ? "none" : "0 4px 12px rgba(99, 102, 241, 0.3)",
          }}
          onMouseEnter={(e) =>
            !loading && (e.currentTarget.style.transform = "translateY(-2px)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          <Download size={16} />
          {loading ? "Processing..." : "Start Download"}
        </button>
      </div>

      {loading && (
        <div style={{ marginBottom: "1rem" }}>
          {/* Loading State with Elapsed Time */}
          <div
            style={{
              padding: "1.25rem",
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderRadius: "12px",
              border: "2px solid #fcd34d",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              className="spinner"
              style={{
                width: "24px",
                height: "24px",
                borderWidth: "3px",
                borderColor: "#f59e0b transparent transparent transparent",
                flexShrink: 0,
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: "700",
                  color: "#92400e",
                  marginBottom: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                Processing Download...
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#78350f",
                  marginBottom: "0.5rem",
                }}
              >
                This may take 10-200 seconds. Please wait...
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#92400e",
                }}
              >
                ⏱️ Elapsed: {elapsedTime}s
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div
          style={{
            padding: "1.25rem",
            background:
              result.status === "completed"
                ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
            borderRadius: "12px",
            border:
              result.status === "completed"
                ? "2px solid #6ee7b7"
                : "2px solid #fca5a5",
            animation: "slideDown 0.3s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            {result.status === "completed" ? (
              <CheckCircle
                color="#059669"
                size={24}
                style={{ flexShrink: 0, marginTop: "0.125rem" }}
              />
            ) : (
              <XCircle
                color="#dc2626"
                size={24}
                style={{ flexShrink: 0, marginTop: "0.125rem" }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: result.status === "completed" ? "#065f46" : "#991b1b",
                  marginBottom: "0.5rem",
                }}
              >
                {result.status === "completed"
                  ? "Download Completed"
                  : "Download Failed"}
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: result.status === "completed" ? "#047857" : "#b91c1c",
                  marginBottom: "0.75rem",
                }}
              >
                {result.message}
              </div>
              {result.processingTimeMs && (
                <div
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    color: "#065f46",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    display: "inline-block",
                  }}
                >
                  ⚡ Processing time:{" "}
                  {(result.processingTimeMs / 1000).toFixed(1)}s
                </div>
              )}
              {result.downloadUrl && (
                <a
                  href={result.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "white",
                    color: "#6366f1",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    border: "2px solid #6366f1",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#6366f1";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.color = "#6366f1";
                  }}
                >
                  <Download size={16} />
                  Download File
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
