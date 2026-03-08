import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';

const COLORS = ['#C84B31','#2E86AB','#A23B72','#3B7A57','#7B4F9E','#B05A2C'];
function getColor(s) { if (!s) return COLORS[0]; let h = 0; for (let c of s) h = c.charCodeAt(0) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length]; }
function initials(n) { if (!n) return '?'; return n.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase(); }

// ── SVG icon set ──────────────────────────────────────────────────────────────
export const Icon = {
  dashboard: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  ),
  categorization: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h4M2 8h8M2 12h6"/><circle cx="13" cy="4" r="1.5"/><circle cx="13" cy="12" r="1.5"/>
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="11" rx="1.5"/>
      <path d="M1 9h3.5l1.5 2 1.5-2H11"/>
    </svg>
  ),
  drafts: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/>
      <path d="M9 2v4h4M5 8h6M5 11h4"/>
    </svg>
  ),
  notetaker: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1" width="12" height="14" rx="1.5"/>
      <path d="M5 5h6M5 8h6M5 11h3"/>
    </svg>
  ),
  scheduling: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="12" rx="1.5"/>
      <path d="M1 7h14M5 1v4M11 1v4"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 10c0 1-.9 2-2 2H4l-3 3V4c0-1 .9-2 2-2h9c1.1 0 2 .9 2 2v6z"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M3.1 12.9l1.1-1.1M11.8 4.2l1.1-1.1"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3"/>
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1a5 5 0 015 5v3l1.5 2.5h-13L3 9V6a5 5 0 015-5z"/>
      <path d="M6.5 13.5a1.5 1.5 0 003 0"/>
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/>
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 10A6 6 0 016 2.5a6 6 0 100 11 6 6 0 007.5-3.5z"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="6.5" r="4.5"/><path d="M14 14l-3-3"/>
    </svg>
  ),
  compose: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2 2-8 8H4v-2L12 2z"/><path d="M2 14h12"/>
    </svg>
  ),
  send: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2L7 9M14 2L9 14l-2-5-5-2 12-5z"/>
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="1" width="6" height="9" rx="3"/>
      <path d="M2 8a6 6 0 0012 0M8 14v2M5 16h6"/>
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="11" rx="1.5"/>
      <path d="M1 4l7 5 7-5"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5"/><path d="M1 13c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
      <circle cx="12" cy="5" r="2"/><path d="M14 13c0-2-1.3-3.7-3-4.4"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="12" rx="1.5"/>
      <path d="M1 7h14M5 1v4M11 1v4"/>
    </svg>
  ),
  video: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="10" height="9" rx="1.5"/>
      <path d="M11 7l4-2v6l-4-2V7z"/>
    </svg>
  ),
  link: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10a4 4 0 005.7 0l2-2A4 4 0 008 2.3L6.8 3.5"/>
      <path d="M10 6a4 4 0 00-5.7 0l-2 2A4 4 0 008 13.7l1.2-1.2"/>
    </svg>
  ),
  record: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="7"/><circle cx="8" cy="8" r="3" fill="currentColor" stroke="none"/>
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1" width="12" height="14" rx="1.5"/>
      <path d="M5 5h6M5 8h6M5 11h3"/>
      <path d="M10 11l2 2" strokeDasharray="1 1"/>
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1l1.5 5H15l-4.5 3 1.5 5L8 11l-4 3 1.5-5L1 6h5.5L8 1z"/>
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4"/>
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4"/>
    </svg>
  ),
  arrowUp: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13V3M4 7l4-4 4 4"/>
    </svg>
  ),
  dots: (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3A6 6 0 102 8"/><path d="M2 3v5h5"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6"/>
    </svg>
  ),
};

// ── Notification dropdown ─────────────────────────────────────────────────────
function NotifDropdown({ onClose }) {
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    api.get('/notifications').then(setNotifs).catch(() => {});
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const markAll = async () => {
    await api.patch('/notifications/read-all', {});
    setNotifs(p => p.map(n => ({ ...n, read: 1 })));
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="notif-dropdown" ref={ref}>
      <div className="notif-dropdown-header">
        Notifications {unread > 0 && `(${unread})`}
        {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>}
      </div>
      {notifs.length === 0
        ? <div className="notif-empty">No notifications</div>
        : notifs.slice(0, 8).map(n => (
          <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
            <div className="notif-item-title">{n.title}</div>
            {n.message && <div className="notif-item-msg">{n.message}</div>}
            <div className="notif-item-time">{new Date(n.created_at).toLocaleString()}</div>
          </div>
        ))}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function Layout({ children, title, topbarRight }) {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailStats, setEmailStats] = useState({ unread: 0, drafts: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith('/settings') || location.pathname === '/billing'
  );
  const notifBtnRef = useRef(null);

  useEffect(() => {
    api.get('/stats').then(setEmailStats).catch(() => {});
    api.get('/notifications').then(n => setUnreadCount(n.filter(x => !x.read).length)).catch(() => {});
    const iv = setInterval(() => {
      api.get('/stats').then(setEmailStats).catch(() => {});
      api.get('/notifications').then(n => setUnreadCount(n.filter(x => !x.read).length)).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, [location]);

  useEffect(() => {
    if (location.pathname.startsWith('/settings') || location.pathname === '/billing') setSettingsOpen(true);
    setSidebarOpen(false); // close on navigate
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {/* ── NOTIFICATIONS (rendered at root to avoid overflow clipping) ── */}
      {showNotifs && (
        <div style={{ position: 'fixed', top: 54, right: 12, zIndex: 500, width: 'min(320px, calc(100vw - 24px))' }}>
          <NotifDropdown onClose={() => setShowNotifs(false)} />
        </div>
      )}

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">in<em>bo</em></div>
          <div className="sidebar-top-actions">
            {/* Theme toggle */}
            <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? Icon.sun : Icon.moon}
            </button>
            {/* Notifications */}
            <div className="notif-wrap">
              <button className="icon-btn" ref={notifBtnRef} onClick={() => setShowNotifs(v => !v)}>
                {Icon.bell}
                {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
              </button>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icon.dashboard}<span>Dashboard</span>
          </NavLink>
          <NavLink to="/categorization" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icon.categorization}<span>Categorization</span>
          </NavLink>
          <NavLink to="/inbox" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icon.inbox}<span>Inbox</span>
            {emailStats.unread > 0 && <span className="nav-badge">{emailStats.unread}</span>}
          </NavLink>
          <NavLink to="/drafts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icon.drafts}<span>Drafts</span>
            {emailStats.drafts > 0 && <span className="nav-badge">{emailStats.drafts}</span>}
          </NavLink>
          <NavLink to="/notetaker" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icon.notetaker}<span>Notetaker</span>
          </NavLink>
          <NavLink to="/scheduling" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icon.scheduling}<span>Scheduling</span>
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icon.chat}<span>Chat</span>
          </NavLink>

          {/* Settings with inline sub-nav */}
          <div
            className={`nav-item ${settingsOpen ? 'active' : ''}`}
            onClick={() => {
              setSettingsOpen(v => !v);
              if (!location.pathname.startsWith('/settings')) navigate('/settings/organization');
            }}
          >
            {Icon.settings}<span>Settings</span>
            <span style={{ marginLeft: 'auto', opacity: 0.5, display: 'flex' }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"
                style={{ transform: settingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M4 6l4 4 4-4"/>
              </svg>
            </span>
          </div>
          {settingsOpen && (
            <>
              <NavLink to="/settings/organization" className={({ isActive }) => `nav-sub ${isActive ? 'active' : ''}`}>Organization</NavLink>
              <NavLink to="/settings/people" className={({ isActive }) => `nav-sub ${isActive ? 'active' : ''}`}>People</NavLink>
              <NavLink to="/billing" className={({ isActive }) => `nav-sub ${isActive ? 'active' : ''}`}>Billing</NavLink>
              <NavLink to="/settings/integrations" className={({ isActive }) => `nav-sub ${isActive ? 'active' : ''}`}>Integrations</NavLink>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="sidebar-divider" />
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                {Icon.admin}<span>Admin</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Account footer */}
        <div className="sidebar-footer">
          {user?.company && (
            <div className="account-item">
              <div className="acct-avatar" style={{ background: getColor(user.company), borderRadius: 6 }}>
                {user.company.substring(0, 2).toUpperCase()}
              </div>
              <div className="acct-info">
                <div className="acct-name">{user.company}</div>
                <div className="acct-meta" style={{ color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>
                  {user.plan}
                </div>
              </div>
              <span className="acct-chevron" style={{ display: 'flex' }}>{Icon.chevronDown}</span>
            </div>
          )}
          <div className="account-item" onClick={() => { logout(); navigate('/login'); }}>
            <div className="acct-avatar" style={{ background: getColor(user?.full_name) }}>
              {initials(user?.full_name)}
            </div>
            <div className="acct-info">
              <div className="acct-name">{user?.full_name}</div>
              <div className="acct-meta">{user?.email}</div>
            </div>
            <span style={{ display: 'flex', color: 'var(--text-muted)' }}>{Icon.logout}</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="topbar-hamburger" onClick={() => setSidebarOpen(v => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            <div className="topbar-title">{title}</div>
          </div>
          <div className="topbar-actions">{topbarRight}</div>
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
