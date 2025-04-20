import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getIncidentReports,
  IncidentReport,
  upvoteReport,
  downvoteReport,
  VoteResponse,
} from "../services/api";
import { AxiosResponse } from "axios";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

interface ReportsTimelineProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const ReportsTimeline: React.FC<ReportsTimelineProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [message, setMessage] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [votedReports, setVotedReports] = useState<{
    [key: string]: "upvote" | "downvote" | null;
  }>({});

  // Base URL for the backend server
  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const fetchReports = async () => {
      try {
        const response: AxiosResponse<{ reports: IncidentReport[] }> =
          await getIncidentReports(user.email);
        setReports(response.data.reports || []);
      } catch (error: any) {
        setMessage("Failed to fetch reports");
      }
    };

    fetchReports();
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setUser(null);
    navigate("/", { replace: true });
  };

  const handleBack = () => {
    navigate("/options");
  };

  const handleUpvote = async (reportId: string) => {
    if (!user) {
      setMessage("User not authenticated");
      return;
    }
    try {
      const response: AxiosResponse<VoteResponse> = await upvoteReport(
        user.email,
        reportId
      );
      console.log("Upvote response:", response);
      const updatedReport = response.data.report;
      const responseMessage = response.data.message;

      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                upvotes: updatedReport.upvotes,
                downvotes: updatedReport.downvotes,
              }
            : report
        )
      );

      if (responseMessage === "Upvote removed") {
        setVotedReports((prev) => ({ ...prev, [reportId]: null }));
        setMessage("Upvote removed");
      } else {
        setVotedReports((prev) => ({ ...prev, [reportId]: "upvote" }));
        setMessage(responseMessage);
      }
    } catch (error: any) {
      console.error("Upvote error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Failed to upvote report");
    }
  };

  const handleDownvote = async (reportId: string) => {
    if (!user) {
      setMessage("User not authenticated");
      return;
    }
    try {
      const response: AxiosResponse<VoteResponse> = await downvoteReport(
        user.email,
        reportId
      );
      console.log("Downvote response:", response);
      const updatedReport = response.data.report;
      const responseMessage = response.data.message;

      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                upvotes: updatedReport.upvotes,
                downvotes: updatedReport.downvotes,
              }
            : report
        )
      );

      if (responseMessage === "Downvote removed") {
        setVotedReports((prev) => ({ ...prev, [reportId]: null }));
        setMessage("Downvote removed");
      } else {
        setVotedReports((prev) => ({ ...prev, [reportId]: "downvote" }));
        setMessage(responseMessage);
      }
    } catch (error: any) {
      console.error("Downvote error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Failed to downvote report");
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
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
          textAlign: "center",
          color: "#333",
        }}
      >
        Reports Timeline
      </h2>
      {message && (
        <p style={{ color: "red", marginBottom: "1rem", textAlign: "center" }}>
          {message}
        </p>
      )}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <button
          onClick={handleBack}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Back
        </button>
        <Link
          to="/reports-timeline/create"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "white",
            borderRadius: "4px",
            textDecoration: "none",
            fontSize: "1rem",
            textAlign: "center",
            display: "inline-block",
          }}
        >
          Create Incident Report
        </Link>
        <button
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Logout
        </button>
      </div>
      <div>
        {reports.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            No reports available.
          </p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                borderLeft: "4px solid #007bff",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: "0.5rem",
                }}
              >
                {report.title}
              </h3>
              <p
                style={{
                  color: "#555",
                  marginBottom: "0.5rem",
                  lineHeight: "1.5",
                }}
              >
                {report.description}
              </p>
              <p
                style={{
                  color: "#777",
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                }}
              >
                <em>Location: {report.location || "Not specified"}</em>
              </p>
              <p
                style={{
                  color: "#777",
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                }}
              >
                <em>
                  Created on: {new Date(report.createdAt).toLocaleString()}
                </em>
              </p>
              <p
                style={{
                  color: "#777",
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                }}
              >
                <em>
                  Created by:{" "}
                  {report.isAnonymous ? "Anonymous" : report.user.username}
                </em>
              </p>
              {report.imageUrl && (
                <div style={{ marginTop: "1rem" }}>
                  <img
                    src={
                      report.imageUrl.startsWith("http")
                        ? report.imageUrl
                        : `${BASE_URL}${report.imageUrl}`
                    }
                    alt="Incident"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={() => openImageModal(report.imageUrl!)}
                  />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  onClick={() => handleUpvote(report.id)}
                  disabled={votedReports[report.id] === "downvote"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor:
                      votedReports[report.id] === "downvote"
                        ? "not-allowed"
                        : "pointer",
                    padding: "0.25rem",
                  }}
                  title="Upvote"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={
                      votedReports[report.id] === "upvote" ? "#FF4500" : "#777"
                    } // Orange for upvote
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5l-7 7h5v7h4v-7h5l-7-7z" />
                  </svg>
                </button>
                <span style={{ color: "#777", fontSize: "0.875rem" }}>
                  {report.upvotes - report.downvotes}
                </span>
                <button
                  onClick={() => handleDownvote(report.id)}
                  disabled={votedReports[report.id] === "upvote"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor:
                      votedReports[report.id] === "upvote"
                        ? "not-allowed"
                        : "pointer",
                    padding: "0.25rem",
                  }}
                  title="Downvote"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={
                      votedReports[report.id] === "downvote"
                        ? "#1E90FF"
                        : "#777"
                    } // Blue for downvote
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19l7-7h-5v-7h-4v7h-5l7 7z" />
                  </svg>
                </button>
              </div>
              {report.isFlagged && (
                <p
                  style={{
                    color: "red",
                    fontSize: "0.875rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <em>Flagged: Yes</em>
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal for Enlarged Image */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeImageModal}
        >
          <img
            src={selectedImage}
            alt="Enlarged Incident"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: "8px",
            }}
          />
          <button
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
            onClick={closeImageModal}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsTimeline;
