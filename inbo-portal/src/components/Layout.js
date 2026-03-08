import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const COLORS = ['#C84B31','#2E86AB','#A23B72','#3B7A57','#7B4F9E','#B05A2C'];
function getColor(s) { if (!s) return COLORS[0]; let h = 0; for (let c of s) h = c.charCodeAt(0) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length]; }
function initials(n) { if (!n) return '?'; return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase(); }

// Nav icon SVGs matching Fyxer style
const Icons = {
  dashboard: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
  categorization: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="4" cy="12" r="2"/><path d="M8 12h5M10 10l2 2-2 2"/></svg>,
  inbox: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><rect x="1" y="3" width="14" height="11" rx="1.5"/><path d="M1 7h4l2 2 2-2h4"/></svg>,
  drafts: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h3M5 8h6M5 11h4"/></svg>,
  notetaker: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><rect x="2" y="1" width="12" height="14" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>,
  scheduling: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><rect x="1" y="3" width="14" height="12" rx="1.5"/><path d="M1 7h14M5 1v4M11 1v4"/></svg>,
  chat: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><path d="M14 10c0 1-.9 2-2 2H4l-3 3V4c0-1 .9-2 2-2h9c1.1 0 2 .9 2 2v6z"/></svg>,
  settings: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>,
  admin: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  bell: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M8 1a5 5 0 015 5v3l1.5 2h-13L3 9V6a5 5 0 015-5z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>,
};

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

export default function Layout({ children, title, topbarRight }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailStats, setEmailStats] = useState({ unread: 0, drafts: 0 });
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/settings') || location.pathname === '/billing');

  useEffect(() => {
    api.get('/stats').then(s => setEmailStats(s)).catch(() => {});
    api.get('/notifications').then(n => setUnreadCount(n.filter(x => !x.read).length)).catch(() => {});
    const iv = setInterval(() => {
      api.get('/stats').then(s => setEmailStats(s)).catch(() => {});
      api.get('/notifications').then(n => setUnreadCount(n.filter(x => !x.read).length)).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, [location]);

  useEffect(() => {
    if (location.pathname.startsWith('/settings') || location.pathname === '/billing') setSettingsOpen(true);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">in<em>bo</em></div>
          <div style={{ position: 'relative' }}>
            <button className="notif-btn" onClick={() => setShowNotifs(v => !v)}>
              {Icons.bell}
              {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
            </button>
            {showNotifs && <NotifDropdown onClose={() => setShowNotifs(false)} />}
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icons.dashboard}<span>Dashboard</span>
          </NavLink>
          <NavLink to="/categorization" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icons.categorization}<span>Categorization</span>
          </NavLink>
          <NavLink to="/inbox" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icons.inbox}<span>Inbox</span>
            {emailStats.unread > 0 && <span className="nav-badge">{emailStats.unread}</span>}
          </NavLink>
          <NavLink to="/drafts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icons.drafts}<span>Drafts</span>
            {emailStats.drafts > 0 && <span className="nav-badge">{emailStats.drafts}</span>}
          </NavLink>
          <NavLink to="/notetaker" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icons.notetaker}<span>Notetaker</span>
          </NavLink>
          <NavLink to="/scheduling" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icons.scheduling}<span>Scheduling</span>
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {Icons.chat}<span>Chat</span>
          </NavLink>

          {/* Settings with sub-nav like Fyxer */}
          <div
            className={`nav-item ${settingsOpen ? 'active' : ''}`}
            onClick={() => { setSettingsOpen(v => !v); if (!location.pathname.startsWith('/settings')) navigate('/settings/organization'); }}
          >
            {Icons.settings}<span>Settings</span>
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
              <div className="divider" style={{ margin: '8px 4px' }} />
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                {Icons.admin}<span>Admin</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Account switcher at bottom — like Fyxer */}
        <div className="sidebar-footer">
          {user?.company && (
            <div className="account-item">
              <div className="acct-avatar" style={{ background: getColor(user.company), borderRadius: 6 }}>
                {user.company.substring(0, 2).toUpperCase()}
              </div>
              <div className="acct-info">
                <div className="acct-name">{user.company}</div>
                <div className="acct-meta" style={{ textTransform: 'uppercase', fontSize: 10, color: 'var(--amber)', fontWeight: 700 }}>
                  {user.plan}
                </div>
              </div>
              <span className="acct-chevron">⌄</span>
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
            <span className="acct-chevron">⌄</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">{topbarRight}</div>
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
