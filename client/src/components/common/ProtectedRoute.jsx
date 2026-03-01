import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";
import { Heart } from "lucide-react";

const Loader = () => (
  <div className="flex h-screen items-center justify-center bg-surface">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
        <Heart size={20} className="text-white" />
      </div>
      <p className="text-sm text-text-muted">Loading your space…</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

export default ProtectedRoute;
