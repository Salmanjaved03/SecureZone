import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  login,
  signup,
  getProfile,
  getAdminDashboard,
  getModeratorReports,
} from "../services/api";
import { AxiosResponse } from "axios";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
  status?: string;
}

interface AuthFormData {
  email: string;
  password: string;
  username?: string;
}

interface AuthResponse {
  message: string;
  user?: User;
}

interface AuthPageProps {
  user: User | null;
  setUser: (user: User | null) => Promise<void>;
}

const AuthPage: React.FC<AuthPageProps> = ({ user, setUser }) => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [message, setMessage] = React.useState<string>("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>();

  const onSubmit: SubmitHandler<AuthFormData> = async (data) => {
    try {
      const response: AxiosResponse<AuthResponse> = isLogin
        ? await login(data.email, data.password)
        : await signup(data.email, data.password, data.username ?? "");

      const responseData = response.data as AuthResponse;
      console.log("AuthPage.tsx: API response:", responseData);
      await setUser(responseData.user ?? null);
      console.log("AuthPage.tsx: User set to:", responseData.user);
      setMessage(
        responseData.message || `${isLogin ? "Login" : "Signup"} successful!`
      );
      reset();

      if (responseData.user) {
        localStorage.setItem("userEmail", data.email);
        console.log("AuthPage.tsx: localStorage userEmail set to:", data.email);
        navigate("/options");
      }
    } catch (error: any) {
      console.error("AuthPage.tsx: Auth error:", error);
      setMessage(error.response?.data?.message || "An error occurred");
    }
  };

  const handleProfile = async () => {
    if (!user) return;
    try {
      const response: AxiosResponse<AuthResponse> = await getProfile(
        user.email
      );
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to fetch profile");
    }
  };

  const handleAdminDashboard = async () => {
    if (!user) return;
    try {
      const response: AxiosResponse<AuthResponse> = await getAdminDashboard(
        user.email
      );
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Failed to access admin dashboard"
      );
    }
  };

  const handleModeratorReports = async () => {
    if (!user) return;
    try {
      const response: AxiosResponse<AuthResponse> = await getModeratorReports(
        user.email
      );
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Failed to access moderator reports"
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
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
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          {isLogin ? "Login to SecureZone" : "Sign Up for SecureZone"}
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: isLogin ? "#007bff" : "#e0e0e0",
              color: isLogin ? "white" : "black",
              border: "none",
              borderRadius: "4px 0 0 4px",
            }}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: !isLogin ? "#007bff" : "#e0e0e0",
              color: !isLogin ? "white" : "black",
              border: "none",
              borderRadius: "0 4px 4px 0",
            }}
            onClick={() => setIsLogin(false)}
          >
            Signup
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {!isLogin && (
            <div>
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
                {...register("username", {
                  required: !isLogin ? "Username is required" : false,
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters",
                  },
                })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              {errors.username && (
                <p
                  style={{
                    color: "red",
                    fontSize: "0.75rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {errors.username.message}
                </p>
              )}
            </div>
          )}
          <div>
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
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email format",
                },
              })}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.email && (
              <p
                style={{
                  color: "red",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
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
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.password && (
              <p
                style={{
                  color: "red",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#666",
            marginTop: "1rem",
          }}
        >
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            style={{
              color: "#007bff",
              background: "none",
              border: "none",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
        {user && (
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <p>
              Logged in as: {user.username} ({user.role})
            </p>
            <button
              onClick={handleProfile}
              style={{
                margin: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
              }}
            >
              View Profile
            </button>
            <button
              onClick={handleAdminDashboard}
              style={{
                margin: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
              }}
            >
              Admin Dashboard
            </button>
            <button
              onClick={handleModeratorReports}
              style={{
                margin: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#ffc107",
                color: "black",
                border: "none",
                borderRadius: "4px",
              }}
            >
              Moderator Reports
            </button>
            <p style={{ marginTop: "0.5rem" }}>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
