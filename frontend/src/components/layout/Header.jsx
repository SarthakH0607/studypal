/**
 * Header — Top bar with pill search bar, streak/XP stats, notification bell, help icon, and avatar.
 */
import { Menu, User, Search, Bell, HelpCircle, Flame, Sparkles } from 'lucide-react';
import useStore from '../../store/useStore';
import './Header.css';

export default function Header({ title = '' }) {
  const { user, profile, toggleSidebar } = useStore();

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <h1 className="header-title">{title}</h1>
      </div>

      {/* Pill Search Bar */}
      <div className="header-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search subjects, lessons, exams..."
          className="search-input"
        />
      </div>

      <div className="header-right">
        {/* Gamification chips */}
        <div className="header-stats">
          <div className="streak-chip" title="Active Study Streak">
            <Flame size={16} color="#E11D48" />
            <span>3 Days</span>
          </div>
          <div className="xp-chip" title="Earned XP Points">
            <Sparkles size={16} color="#F5A623" />
            <span>450 XP</span>
          </div>
        </div>

        {/* Action icons */}
        <button className="header-icon-btn" title="Help & Guides">
          <HelpCircle size={20} />
        </button>
        <button className="header-icon-btn" title="Notifications">
          <Bell size={20} />
          <span className="notification-badge" />
        </button>

        {/* Profile pill */}
        <div className="header-user">
          <div className="header-avatar">
            <User size={16} />
          </div>
          <span className="header-user-name">
            {profile?.full_name || user?.email?.split('@')[0] || 'Student'}
          </span>
        </div>
      </div>
    </header>
  );
}
