import React from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
  status?: string;
}

interface UserOptionsPageProps {
  user: User | null;
  setUser: (user: User | null) => Promise<void>;
}

const UserOptionsPage: React.FC<UserOptionsPageProps> = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem("userEmail");
    await setUser(null);
    navigate("/");
  };

  const handleViewProfile = () => {
    console.log("UserOptionsPage.tsx: Navigating to profile, user:", user);
    if (user) {
      navigate(`/profile/${user.email}`);
    }
  };

  const handleCreateIncidentReport = () => {
    console.log(
      "UserOptionsPage.tsx: Navigating to create incident report, user:",
      user
    );
    if (user) {
      navigate("/reports-timeline/create");
    } else {
      navigate("/");
    }
  };

  const handleViewReportsTimeline = () => {
    console.log(
      "UserOptionsPage.tsx: Navigating to reports timeline, user:",
      user
    );
    if (user) {
      navigate("/reports-timeline");
    } else {
      navigate("/");
    }
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            marginBottom: "1.5rem",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          User Options - Welcome, {user.username}
        </h2>
        <button
          onClick={handleViewProfile}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          View Profile
        </button>
        <button
          onClick={handleCreateIncidentReport}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Create Incident Report
        </button>
        <button
          onClick={handleViewReportsTimeline}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          View Reports Timeline
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserOptionsPage;
