import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/AuthPage";
import UserOptionsPage from "./pages/UserOptionsPage";
import AdminDashboardPage from "./pages/AdminDashboard";
import ModeratorReportsPage from "./pages/ModeratorReportsPage";
import ReportsTimeline from "./pages/ReportsTimeline";
import CreateIncidentReport from "./pages/CreateIncidentReport";
import ProfilePage from "./pages/ProfilePage";
import { getProfile } from "./services/api";

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
  status?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loginTrigger, setLoginTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    console.log("App.tsx: useEffect triggered, email in localStorage:", email);
    setIsLoading(true);
    if (email) {
      const fetchProfile = async () => {
        try {
          const response = await getProfile(email);
          console.log("App.tsx: getProfile response:", response.data);
          const fetchedUser = response.data.user || null;
          setUser(fetchedUser);
          if (!fetchedUser) {
            localStorage.removeItem("userEmail");
          }
        } catch (error: any) {
          console.error("App.tsx: getProfile error:", error);
          if (error.response?.status === 401) {
            localStorage.removeItem("userEmail");
            setUser(null);
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [loginTrigger]);

  const handleSetUser = (newUser: User | null): Promise<void> => {
    return new Promise((resolve) => {
      console.log("App.tsx: handleSetUser called, newUser:", newUser);
      setUser(newUser);
      setLoginTrigger((prev) => {
        const newTrigger = prev + 1;
        console.log("App.tsx: loginTrigger updated to:", newTrigger);
        resolve();
        return newTrigger;
      });
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<HomePage user={user} setUser={handleSetUser} />}
        />
        <Route
          path="/options"
          element={
            user ? (
              <UserOptionsPage user={user} setUser={handleSetUser} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            user ? (
              <AdminDashboardPage user={user} setUser={handleSetUser} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/moderator-reports"
          element={
            user ? (
              <ModeratorReportsPage user={user} setUser={handleSetUser} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/reports-timeline">
          <Route
            index
            element={
              user ? (
                <ReportsTimeline user={user} setUser={handleSetUser} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="create"
            element={
              user ? <CreateIncidentReport user={user} /> : <Navigate to="/" />
            }
          />
        </Route>
        <Route
          path="/profile/:email"
          element={
            user ? (
              <ProfilePage user={user} setUser={handleSetUser} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
