import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  getModeratorReports,
  getIncidentReports,
  deleteReport,
  flagReport,
} from "../services/api";

const BASE_URL = "http://localhost:5000";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  userId: string;
  createdAt: string;
  user: User;
  imageUrl?: string;
  isAnonymous?: boolean;
  isFlagged?: boolean;
}

interface ModeratorReportsPageProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const ModeratorReportsPage: React.FC<ModeratorReportsPageProps> = ({
  user,
  setUser,
}) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          console.log(
            `Fetching reports for user: ${user.email}, role: ${user.role}`
          );
          await getModeratorReports(user.email);
          const response = await getIncidentReports(user.email);
          console.log("Fetched reports:", response.data.reports);
          setReports(
            (response.data.reports || []).map((report: any) => ({
              id: report.id,
              title: report.title,
              description: report.description,
              location: report.location,
              userId: report.userId || "",
              createdAt: report.createdAt,
              user: report.user,
              imageUrl: report.imageUrl,
              isAnonymous: report.isAnonymous,
              isFlagged: report.isFlagged,
            }))
          );
        }
      } catch (error: any) {
        console.error("Fetch error:", error.response?.data || error.message);
        setMessage(error.response?.data?.message || "Failed to fetch reports");
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage]);

  if (!user) {
    return <Navigate to="/" />;
  }

  if (user.role !== "MODERATOR" && user.role !== "ADMIN") {
    return <Navigate to="/options" />;
  }

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      console.log(
        `Deleting report: reportId=${reportId}, adminEmail=${user.email}`
      );
      const response = await deleteReport(user.email, reportId);
      console.log("Delete report response:", response.data);
      setReports(reports.filter((report) => report.id !== reportId));
      setMessage(response.data.message);
    } catch (error: any) {
      console.error(
        "Delete report error:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message || "Failed to delete report");
    }
  };

  const handleFlagReport = async (reportId: string) => {
    try {
      console.log(
        `Flagging report: reportId=${reportId}, adminEmail=${user.email}`
      );
      const response = await flagReport(user.email, reportId);
      console.log("Flag report response:", response.data);
      setReports(
        reports.map((report) =>
          report.id === reportId ? { ...report, isFlagged: true } : report
        )
      );
      setMessage(response.data.message);
    } catch (error: any) {
      console.error(
        "Flag report error:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message || "Failed to flag report");
    }
  };

  const openImageModal = (imageUrl: string) => {
    const fullImageUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `${BASE_URL}${imageUrl}`;
    setSelectedImage(fullImageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f0f0f0",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          Moderator Dashboard - Welcome, {user.username}
        </h2>
        <button
          onClick={handleLogout}
          style={{
            display: "block",
            margin: "0 auto 1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
        <button
          onClick={() => navigate("/options")}
          style={{
            display: "block",
            margin: "0 auto 2rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Back to User Options
        </button>

        <div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            Incident Reports
          </h3>
          {reports.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666" }}>
              No incident reports available.
            </p>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                style={{
                  backgroundColor: "white",
                  padding: "1rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  marginBottom: "1rem",
                }}
              >
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  {report.title}
                </h4>
                <p
                  style={{
                    color: "#666",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Reported by{" "}
                  {report.isAnonymous ? "Anonymous" : report.user.username} on{" "}
                  {new Date(report.createdAt).toLocaleString()}
                </p>
                <p style={{ marginBottom: "0.5rem" }}>
                  <strong>Location:</strong>{" "}
                  {report.location || "Not specified"}
                </p>
                <p style={{ marginBottom: "0.5rem" }}>{report.description}</p>
                {report.isFlagged && (
                  <p
                    style={{
                      color: "red",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Flagged as False Information
                  </p>
                )}
                {report.imageUrl && (
                  <div>
                    <p style={{ marginBottom: "0.5rem" }}>
                      <strong>Image:</strong>
                    </p>
                    <img
                      src={
                        report.imageUrl.startsWith("http")
                          ? report.imageUrl
                          : `${BASE_URL}${report.imageUrl}`
                      }
                      alt="Incident report"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => openImageModal(report.imageUrl!)}
                    />
                  </div>
                )}
                <div
                  style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}
                >
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete Report
                  </button>
                  {!report.isFlagged && (
                    <button
                      onClick={() => handleFlagReport(report.id)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#ff9800",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Flag as False
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {message && (
          <p
            style={{
              marginTop: "1rem",
              textAlign: "center",
              color: message.includes("success") ? "green" : "red",
            }}
          >
            {message}
          </p>
        )}
      </div>

      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeImageModal}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90%",
              maxHeight: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: "absolute",
                top: "-30px",
                right: "-30px",
                background: "none",
                border: "none",
                color: "white",
                fontSize: "2rem",
                cursor: "pointer",
              }}
              onClick={closeImageModal}
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Enlarged incident report"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorReportsPage;
