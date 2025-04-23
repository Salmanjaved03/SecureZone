import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getIncidentReports,
  searchIncidentReports,
  IncidentReport,
  upvoteReport,
  downvoteReport,
  deleteReport,
  flagReport,
  updateReportTags,
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [votedReports, setVotedReports] = useState<{
    [key: string]: "upvote" | "downvote" | null;
  }>({});
  const [openCommentsReportId, setOpenCommentsReportId] = useState<
    string | null
  >(null);
  const [editingTagsReportId, setEditingTagsReportId] = useState<string | null>(
    null
  );
  const [newTags, setNewTags] = useState<string>("");
  const [tagError, setTagError] = useState<string>("");

  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const fetchReports = async () => {
      try {
        let response: AxiosResponse<{ reports: IncidentReport[] }>;
        if (searchQuery.trim()) {
          response = await searchIncidentReports(user.email, searchQuery);
        } else {
          response = await getIncidentReports(user.email);
        }
        setReports(response.data.reports || []);
        setMessage(
          response.data.reports.length === 0 ? "No reports found." : ""
        );
      } catch (error: any) {
        console.error(
          "Fetch reports error:",
          error.response?.data || error.message
        );
        setMessage(error.response?.data?.message || "Failed to fetch reports");
      }
    };

    fetchReports();
  }, [user, navigate, searchQuery]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
      if (editingTagsReportId === reportId) {
        setEditingTagsReportId(null);
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

  const handleEditTags = (reportId: string, currentTags: string[]) => {
    setEditingTagsReportId(reportId);
    setNewTags(currentTags.join(", "));
    setTagError("");
  };

  const handleSaveTags = async (reportId: string) => {
    if (!user) {
      setMessage("User not authenticated");
      return;
    }

    // Validate tags
    const tagsArray = newTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    if (newTags.trim() && tagsArray.length === 0) {
      setTagError("Tags cannot be empty or only commas");
      return;
    }

    try {
      const tagsString = newTags.trim(); // Send as is, empty string clears tags
      const response = await updateReportTags(user.email, reportId, tagsString);
      setReports(
        reports.map((report) =>
          report.id === reportId ? response.data.report : report
        )
      );
      setEditingTagsReportId(null);
      setNewTags("");
      setTagError("");
      setMessage("Tags updated successfully");
    } catch (error: any) {
      console.error(
        "Update tags error:",
        error.response?.data || error.message
      );
      setTagError(error.response?.data?.message || "Failed to update tags");
    }
  };

  const handleCancelTags = () => {
    setEditingTagsReportId(null);
    setNewTags("");
    setTagError("");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Reports Timeline</h2>
      {message && <p className={styles.message}>{message}</p>}
      <div className={styles.actions}>
        <button onClick={handleBack} className={styles.backButton}>
          Back
        </button>
        <Link to="/reports-timeline/create" className={styles.createLink}>
          Create Incident Report
        </Link>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
      <div className={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by title, tags, or location..."
          className={styles.searchInput}
        />
      </div>
      <div>
        {reports.length === 0 ? (
          <p className={styles.noReports}>
            {searchQuery
              ? "No reports match your search."
              : "No reports available."}
          </p>
        ) : (
          reports.map((report) => (
            <div key={report.id} className={styles.reportCard}>
              <h3 className={styles.reportTitle}>{report.title}</h3>
              <p className={styles.reportDescription}>{report.description}</p>
              <p className={styles.reportMeta}>
                <em>Location: {report.location || "Not specified"}</em>
              </p>
              <p className={styles.reportMeta}>
                <em>
                  Created on: {new Date(report.createdAt).toLocaleString()}
                </em>
              </p>
              <p className={styles.reportMeta}>
                <em>
                  Created by:{" "}
                  {report.isAnonymous ? "Anonymous" : report.user.username}
                </em>
              </p>
              {report.tags.length > 0 && (
                <div className={styles.tagsContainer}>
                  {report.tags.map((tag) => (
                    <span key={tag.id} className={styles.tag}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              {user &&
                (report.user.id === user.id ||
                  user.role === "ADMIN" ||
                  user.role === "MODERATOR") && (
                  <div className={styles.tagEditContainer}>
                    {editingTagsReportId === report.id ? (
                      <>
                        <input
                          type="text"
                          value={newTags}
                          onChange={(e) => {
                            setNewTags(e.target.value);
                            setTagError("");
                          }}
                          placeholder="Enter tags (comma-separated)"
                          className={styles.tagInput}
                        />
                        {tagError && (
                          <p className={styles.tagError}>{tagError}</p>
                        )}
                        <button
                          onClick={() => handleSaveTags(report.id)}
                          className={styles.saveTagsButton}
                        >
                          Save Tags
                        </button>
                        <button
                          onClick={handleCancelTags}
                          className={styles.cancelTagsButton}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          handleEditTags(
                            report.id,
                            report.tags.map((tag) => tag.name)
                          )
                        }
                        className={styles.editTagsButton}
                      >
                        Edit Tags
                      </button>
                    )}
                  </div>
                )}
              {report.imageUrl && (
                <div className={styles.imageContainer}>
                  <img
                    src={
                      report.imageUrl.startsWith("http")
                        ? report.imageUrl
                        : `${BASE_URL}${report.imageUrl}`
                    }
                    alt="Incident"
                    className={styles.reportImage}
                    onClick={() => openImageModal(report.imageUrl!)}
                  />
                </div>
              )}
              <div className={styles.reportActions}>
                <button
                  onClick={() => handleUpvote(report.id)}
                  disabled={votedReports[report.id] === "downvote"}
                  className={styles.voteButton}
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
                <span className={styles.voteCount}>
                  {report.upvotes - report.downvotes}
                </span>
                <button
                  onClick={() => handleDownvote(report.id)}
                  disabled={votedReports[report.id] === "upvote"}
                  className={styles.voteButton}
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
                  className={
                    openCommentsReportId === report.id
                      ? styles.hideCommentsButton
                      : styles.showCommentsButton
                  }
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
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                      {!report.isFlagged && (
                        <button
                          onClick={() => handleFlagReport(report.id)}
                          className={styles.flagButton}
                        >
                          Flag
                        </button>
                      )}
                    </>
                  )}
              </div>
              {report.isFlagged && (
                <p className={styles.flaggedText}>
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
        <div className={styles.imageModal} onClick={closeImageModal}>
          <div
            className={styles.imageModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeModalButton}
              onClick={closeImageModal}
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Enlarged incident report"
              className={styles.modalImage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTimeline;
