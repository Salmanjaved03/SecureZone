import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  getAdminDashboard,
  banUser,
  deleteUser,
  promoteToModerator,
} from "../services/api";
import { AxiosResponse } from "axios";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
  status?: string;
}

interface AdminDashboardProps {
  user: User | null;
  setUser: (user: User | null) => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>("");
  const [usernameToBan, setUsernameToBan] = useState<string>("");
  const [usernameToDelete, setUsernameToDelete] = useState<string>("");
  const [usernameToPromote, setUsernameToPromote] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        await getAdminDashboard(user.email);
      } catch (error: any) {
        setMessage(
          error.response?.data?.message || "Failed to load admin dashboard"
        );
      }
    };
    fetchData();
  }, [user]);

  const handleBanUser = async () => {
    if (!usernameToBan.trim()) {
      setMessage("Please enter a username to ban");
      return;
    }
    try {
      console.log(
        `Banning user: adminEmail=${user?.email}, username=${usernameToBan}`
      );
      const response = await banUser(user!.email, usernameToBan);
      console.log("Ban user response:", response.data);
      setMessage(response.data.message);
      setUsernameToBan("");
    } catch (error: any) {
      console.error("Ban user error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Failed to ban user");
    }
  };

  const handleDeleteUser = async () => {
    if (!usernameToDelete.trim()) {
      setMessage("Please enter a username to delete");
      return;
    }
    try {
      console.log(
        `Deleting user: adminEmail=${user?.email}, username=${usernameToDelete}`
      );
      const response = await deleteUser(user!.email, usernameToDelete);
      console.log("Delete user response:", response.data);
      setMessage(response.data.message);
      setUsernameToDelete("");
    } catch (error: any) {
      console.error(
        "Delete user error:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handlePromoteToModerator = async () => {
    if (!usernameToPromote.trim()) {
      setMessage("Please enter a username to promote");
      return;
    }
    try {
      console.log(
        `Promoting user: adminEmail=${user?.email}, username=${usernameToPromote}`
      );
      const response = await promoteToModerator(user!.email, usernameToPromote);
      console.log("Promote user response:", response.data);
      setMessage(response.data.message);
      setUsernameToPromote("");
    } catch (error: any) {
      console.error(
        "Promote user error:",
        error.response?.data || error.message
      );
      setMessage(
        error.response?.data?.message || "Failed to promote user to moderator"
      );
    }
  };

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/options" />;
  }

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
      <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          Admin Dashboard - Welcome, {user.username}
        </h2>
        <button
          onClick={() => navigate("/options")}
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
          Back to User Options
        </button>
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
            Admin Actions
          </h3>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Username to ban"
              value={usernameToBan}
              onChange={(e) => setUsernameToBan(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginBottom: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <button
              onClick={handleBanUser}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Ban User
            </button>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Username to delete"
              value={usernameToDelete}
              onChange={(e) => setUsernameToDelete(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginBottom: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <button
              onClick={handleDeleteUser}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete User
            </button>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Username to promote to moderator"
              value={usernameToPromote}
              onChange={(e) => setUsernameToPromote(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginBottom: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <button
              onClick={handlePromoteToModerator}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Promote to Moderator
            </button>
          </div>
          {message && (
            <p
              style={{
                marginTop: "1rem",
                color: message.includes("success") ? "green" : "red",
                textAlign: "center",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
