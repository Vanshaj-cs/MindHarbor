import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AIChat from "./pages/AIChat";
import MoodTracker from "./pages/MoodTracker";
import Resources from "./pages/Resources";
import Analytics from "./pages/Analytics";
import StudyPlanner from "./pages/StudyPlanner";
// Placeholder pages (replace with real ones as you build them)
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-96">
    <p className="text-text-muted text-sm">{title} — coming soon</p>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public auth routes ────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Protected app routes ──────────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/mood" element={<MoodTracker />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="resources" element={<Resources />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route
              path="counselor"
              element={<ComingSoon title="Counselor Booking" />}
            />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* ── Fallback ──────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
