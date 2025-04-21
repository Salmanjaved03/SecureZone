import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getIncidentReports,
  IncidentReport,
  upvoteReport,
  downvoteReport,
  deleteReport,
  flagReport,
  VoteResponse,
} from "../services/api";
import { AxiosResponse } from "axios";
import CommentList from "./CommentList";
import styles from "./ReportsTimeline.module.css";

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
  const [openCommentsReportId, setOpenCommentsReportId] = useState<
    string | null
  >(null);

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
        console.error(
          "Fetch reports error:",
          error.response?.data || error.message
        );
        setMessage("Failed to fetch reports");
      }
    };

    fetchReports();
  }, [user, navigate]);

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
      console.log("Upvote response:", response.data);
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
      console.log("Downvote response:", response.data);
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

  const handleDeleteReport = async (reportId: string) => {
    if (!user) {
      setMessage("User not authenticated");
      return;
    }
    try {
      console.log(
        `Deleting report: reportId=${reportId}, adminEmail=${user.email}`
      );
      const response = await deleteReport(user.email, reportId);
      console.log("Delete report response:", response.data);
      setReports(reports.filter((report) => report.id !== reportId));
      setMessage(response.data.message);
      if (openCommentsReportId === reportId) {
        setOpenCommentsReportId(null);
      }
    } catch (error: any) {
      console.error(
        "Delete report error:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message || "Failed to delete report");
    }
  };

  const handleFlagReport = async (reportId: string) => {
    if (!user) {
      setMessage("User not authenticated");
      return;
    }
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

  const toggleComments = (reportId: string) => {
    setOpenCommentsReportId(
      openCommentsReportId === reportId ? null : reportId
    );
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
                  flexWrap: "wrap",
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
                    }
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
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19l7-7h-5v-7h-4v7h-5l7 7z" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleComments(report.id)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor:
                      openCommentsReportId === report.id
                        ? "#6c757d"
                        : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  {openCommentsReportId === report.id
                    ? "Hide Comments"
                    : "Show Comments"}
                </button>
                {user &&
                  (user.role === "ADMIN" || user.role === "MODERATOR") && (
                    <>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                        }}
                      >
                        Delete
                      </button>
                      {!report.isFlagged && (
                        <button
                          onClick={() => handleFlagReport(report.id)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            backgroundColor: "#ff9800",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          Flag
                        </button>
                      )}
                    </>
                  )}
              </div>
              {report.isFlagged && (
                <p
                  style={{
                    color: "red",
                    fontSize: "0.875rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <em>Flagged as False</em>
                </p>
              )}
              {openCommentsReportId === report.id && user && (
                <CommentList reportId={report.id} userEmail={user.email} />
              )}
            </div>
          ))
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
            backgroundColor: "rgba(0,0,0,0.8)",
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

export default ReportsTimeline;
