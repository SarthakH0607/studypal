/**
 * Sidebar — Main navigation with animated icons and collapsible sections.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, BookOpen, ClipboardCheck,
  FileText, Camera, GraduationCap, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react';
import useStore from '../../store/useStore';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tutor', icon: MessageSquare, label: 'AI Tutor' },
  { path: '/learning', icon: BookOpen, label: 'Learning Paths' },
  { path: '/exams', icon: ClipboardCheck, label: 'Exams' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/snap-learn', icon: Camera, label: 'Snap & Learn' },
  { path: '/scholarships', icon: GraduationCap, label: 'Scholarships' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Sparkles size={22} />
        </div>
        {sidebarOpen && <span className="sidebar-brand-text">StudyPal</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            title={item.label}
          >
            <item.icon size={20} />
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <NavLink to="/settings" className="sidebar-link" title="Settings">
          <Settings size={20} />
          {sidebarOpen && <span>Settings</span>}
        </NavLink>
        <button className="sidebar-link sidebar-logout" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}
