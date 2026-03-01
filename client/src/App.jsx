import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import MoodTracker from "./pages/MoodTracker";
import AIChat from "./pages/AIChat";
import Resources from "./pages/Resources";
import Analytics from "./pages/Analytics";
import CounselorBooking from "./pages/CounselorBooking";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mood" element={<MoodTracker />} />
          <Route path="/api/chat" element={<AIChat />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/counselor" element={<CounselorBooking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
