import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import UserOptionsPage from "./pages/UserOptionsPage";
import AdminDashboard from "./pages/AdminDashboard";

// Define the User type for better reusability
interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

interface AuthResponse {
  message: string;
  user?: User;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null); // Explicitly type the state

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage user={user} setUser={setUser} />} />
        <Route
          path="/options"
          element={<UserOptionsPage user={user} setUser={setUser} />}
        />
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard user={user} setUser={setUser} />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
