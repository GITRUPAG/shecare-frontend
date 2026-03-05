import "./theme.css";
import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CycleTrackerPage from "./pages/CycleTrackerPage";
import PCOSPage from "./pages/PCOSPage";
import CommunityPage from "./pages/CommunityPage";
import HealthTipsPage from "./pages/HealthTipsPage";
import ProfilePage from "./pages/ProfilePage";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Routes>

        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Protected pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <CycleTrackerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pcos"
          element={
            <ProtectedRoute>
              <PCOSPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tips"
          element={
            <ProtectedRoute>
              <HealthTipsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </div>
  );
}