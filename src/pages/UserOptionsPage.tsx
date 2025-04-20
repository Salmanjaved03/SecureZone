import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { createIncidentReport, getIncidentReports } from "../services/api";

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
}

interface UserOptionsPageProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserOptionsPage: React.FC<UserOptionsPageProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await getIncidentReports();
        setReports(response.data.reports);
      } catch (error: any) {
        setMessage("Failed to fetch incident reports");
      }
    };
    fetchReports();
  }, []);

  if (!user) {
    return <Navigate to="/" />;
  }

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createIncidentReport({
        title,
        description,
        location,
        userId: user.id,
      });
      setReports([{ ...response.data.report, user }, ...reports]); // Add new report to the top
      setMessage("Incident report created successfully");
      setTitle("");
      setDescription("");
      setLocation("");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Failed to create incident report"
      );
    }
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
      {user.role === "ADMIN" && (
        <div style={{ position: "absolute", top: "1rem", left: "1rem" }}>
          <button
            onClick={() => navigate("/admin-dashboard")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Admin Dashboard
          </button>
        </div>
      )}
      <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          Welcome, {user.username} ({user.role})
        </h2>
        <button
          onClick={handleLogout}
          style={{
            display: "block",
            margin: "0 auto 2rem",
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

        {/* Form to create incident report */}
        <div
          style={{
            backgroundColor: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            Create Incident Report
          </h3>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label
                htmlFor="title"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.25rem",
                }}
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="description"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.25rem",
                }}
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  minHeight: "100px",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="location"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.25rem",
                }}
              >
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "0.75rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Submit Report
            </button>
          </form>
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

        {/* Timeline of incident reports */}
        <div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            Incident Reports Timeline
          </h3>
          {reports.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666" }}>
              No incident reports yet.
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
                  Reported by {report.user.username} on{" "}
                  {new Date(report.createdAt).toLocaleString()}
                </p>
                <p style={{ marginBottom: "0.5rem" }}>
                  <strong>Location:</strong> {report.location}
                </p>
                <p>{report.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserOptionsPage;
