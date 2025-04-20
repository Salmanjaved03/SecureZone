import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../services/api";
import { AxiosResponse } from "axios";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

interface HomePageProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

interface AuthResponse {
  message: string;
  user: User;
}

const HomePage: React.FC<HomePageProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: AxiosResponse<AuthResponse> = await login(
        email,
        password
      );
      setUser(response.data.user);
      localStorage.setItem("userEmail", email);
      navigate("/options");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: AxiosResponse<AuthResponse> = await signup(
        email,
        password,
        username
      );
      setUser(response.data.user);
      localStorage.setItem("userEmail", email);
      navigate("/options");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Signup failed");
    }
  };

  const toggleForm = () => {
    setIsSignup(!isSignup);
    setMessage("");
    setEmail("");
    setPassword("");
    setUsername("");
  };

  if (user) {
    return null; // Will be redirected by the Routes in App.tsx
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
      <div style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          {isSignup ? "Sign Up for SecureZone" : "Login to SecureZone"}
        </h2>
        {message && (
          <p
            style={{
              marginBottom: "1rem",
              textAlign: "center",
              color: "red",
            }}
          >
            {message}
          </p>
        )}
        <div
          style={{
            backgroundColor: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <form onSubmit={isSignup ? handleSignup : handleLogin}>
            {isSignup && (
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
                  }}
                />
              </div>
            )}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.25rem",
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
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
                Password
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
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: isSignup ? "#28a745" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {isSignup ? "Sign Up" : "Login"}
            </button>
          </form>
          <p
            style={{
              marginTop: "1rem",
              textAlign: "center",
              fontSize: "0.875rem",
              cursor: "pointer",
              color: "#007bff",
            }}
            onClick={toggleForm}
          >
            {isSignup
              ? "Already have an account? Log In"
              : "Don’t have an account? Sign Up"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
