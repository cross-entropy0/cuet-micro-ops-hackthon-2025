import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface FileItem {
  key: string;
  fileName: string;
  fileId: number | null;
  size: number;
  lastModified: string;
  extension: string;
}

interface FileListResponse {
  files: FileItem[];
  total: number;
}

export default function FileList({
  onFileSelect,
}: {
  onFileSelect: (fileId: number) => void;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<FileListResponse>("/v1/files");
        setFiles(response.data.files);
      } catch (err) {
        console.error("Failed to fetch files:", err);
        setError("Failed to load file list");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (isoDate: string): string => {
    return new Date(isoDate).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Available Files</h2>
        <p className="text-gray-500">Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Available Files</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        Available Files ({files.length})
      </h2>
      <div className="space-y-2">
        {files.length === 0 ? (
          <p className="text-gray-500">No files available</p>
        ) : (
          files.map((file) => (
            <div
              key={file.key}
              onClick={() => file.fileId && onFileSelect(file.fileId)}
              className={`border rounded-lg p-4 ${
                file.fileId
                  ? "hover:bg-gray-50 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {file.extension === ".zip"
                        ? "📦"
                        : file.extension === ".pdf"
                          ? "📄"
                          : file.extension === ".txt"
                            ? "📝"
                            : file.extension === ".jpg" ||
                                file.extension === ".png"
                              ? "🖼️"
                              : "📁"}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {file.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} •{" "}
                        {formatDate(file.lastModified)}
                        {file.fileId && (
                          <span className="ml-2 text-blue-600">
                            ID: {file.fileId}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                {file.fileId && (
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileSelect(file.fileId!);
                    }}
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
