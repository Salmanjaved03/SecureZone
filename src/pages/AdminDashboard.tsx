import React from "react";
import { useNavigate, Navigate } from "react-router-dom";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

interface AdminDashboardProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, setUser }) => {
  const navigate = useNavigate();

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/" />;
  }

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        padding: "2rem",
      }}
    >
      <div style={{ position: "absolute", top: "1rem", left: "1rem" }}>
        <button
          onClick={() => navigate("/options")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Back to Options
        </button>
      </div>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
        }}
      >
        Admin Dashboard
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        Welcome, {user.username}! This is the admin dashboard.
      </p>
      <button
        onClick={handleLogout}
        style={{
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
    </div>
  );
};

export default AdminDashboard;
