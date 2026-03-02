import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  SmilePlus,
  MessageCircleHeart,
  BookOpen,
  BarChart3,
  CalendarHeart,
  User,
  Settings,
  Heart,
  X,
  Calendar,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/mood", icon: SmilePlus, label: "Mood Tracker" },
  { to: "/chat", icon: MessageCircleHeart, label: "AI Support Chat" },
  { to: "/resources", icon: BookOpen, label: "Resources" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/counselor", icon: CalendarHeart, label: "Counselor Booking" },
  { to: "/planner", icon: Calendar, label: "Study Planner" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-surface-card/95 backdrop-blur-sm
          flex flex-col
          transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              Mind Harbor
            </h1>
            <p className="text-[10px] text-text-muted -mt-0.5">
              Your safe space
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-surface-hover lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "text-emerald-300 bg-forest-800/30"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover/50"
                }`
              }
            >
              <item.icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
