import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { getProfile, updateProfile } from "../services/api";
import { AxiosResponse } from "axios";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

interface ProfileResponse {
  message: string;
  user: User;
}

interface ProfilePageProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { email } = useParams<{ email: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (email) {
          const response: AxiosResponse<ProfileResponse> = await getProfile(
            email
          );
          setProfile(response.data.user);
          setUsername(response.data.user.username);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch profile");
      }
    };
    fetchProfile();
  }, [email]);

  if (!user) {
    return <Navigate to="/" />;
  }

  if (user.email !== email) {
    return <Navigate to="/options" />;
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Validation checks
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (password && password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      const updatedData: { username: string; password?: string } = { username };
      if (password) {
        updatedData.password = password;
      }

      const response: AxiosResponse<ProfileResponse> = await updateProfile(
        user.email,
        updatedData
      );
      console.log("Update profile response:", response);
      setProfile(response.data.user);
      setUser(response.data.user);
      setMessage("Profile updated successfully");
      setPassword("");
    } catch (err: any) {
      console.error("Update profile error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to update profile");
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
      <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          Profile - {profile?.username}
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

        {error && (
          <p
            style={{
              marginBottom: "1rem",
              textAlign: "center",
              color: "red",
            }}
          >
            {error}
          </p>
        )}
        {message && (
          <p
            style={{
              marginBottom: "1rem",
              textAlign: "center",
              color: "green",
            }}
          >
            {message}
          </p>
        )}

        {profile ? (
          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "1rem",
              }}
            >
              User Details
            </h3>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Email:</strong> {profile.email}
            </p>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Username:</strong> {profile.username}
            </p>
            <p style={{ marginBottom: "1.5rem" }}>
              <strong>Role:</strong> {profile.role}
            </p>

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "1rem",
              }}
            >
              Update Profile
            </h3>
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="username"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.25rem",
                  }}
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                  }}
                />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.25rem",
                  }}
                >
                  New Password (leave blank to keep unchanged)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Update Profile
              </button>
            </form>
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#666" }}>
            Loading profile...
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
