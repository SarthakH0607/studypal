/**
 * Layout — Main app shell wrapping sidebar + header + content area.
 */
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useStore from '../../store/useStore';
import './Layout.css';

export default function Layout() {
  const { sidebarOpen } = useStore();

  return (
    <div className="layout">
      <Sidebar />
      <main
        className="layout-main"
        style={{
          marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)',
        }}
      >
        <div className="layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
