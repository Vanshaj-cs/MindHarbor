import { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import Avatar from '../common/Avatar';

const moodEmojis = ['😊', '😌', '😐', '😔', '😢'];

const Topbar = ({ onMenuClick }) => {
  const [currentMood] = useState(0);

  return (
    <header className="sticky top-0 z-30 bg-surface/60 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-3 lg:px-8">
        {/* Left: mobile menu + mood */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-text-secondary" />
          </button>
          <div className="flex items-center gap-1.5 text-sm" title="Your current mood">
            <span className="text-lg">{moodEmojis[currentMood]}</span>
            <span className="text-xs text-text-muted hidden sm:inline">Feeling good</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
            aria-label="Search"
          >
            <Search size={18} className="text-text-muted" />
          </button>
          <button
            className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-text-muted" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
          </button>
          <Avatar name="Vatsal Sharma" size="sm" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
