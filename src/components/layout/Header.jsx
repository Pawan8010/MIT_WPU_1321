import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { useAuthContext } from '../../context/AuthContext';
import { Search, Bell, User, Save, CheckCircle, Menu, AlertTriangle, LogOut } from 'lucide-react';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { lastSaved, autoSaveEnabled, triggerAutoSave, massCasualtyMode, notifications, alerts } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');

  // Get display name from Firebase user or demo session
  const demoUser = sessionStorage.getItem("gh_demo_user");
  const displayName = user?.displayName || (demoUser ? JSON.parse(demoUser).displayName : "EMT User");
  const displayEmail = user?.email || (demoUser ? JSON.parse(demoUser).email : "");

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("gh_demo_user");
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  // Auto-save simulation
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const interval = setInterval(() => {
      triggerAutoSave();
      setSaveStatus('saving');
      setTimeout(() => setSaveStatus('saved'), 800);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSaveEnabled, triggerAutoSave]);

  const unreadCount = alerts.filter(a => a.type === 'critical').length;

  return (
    <header className={`app-header ${massCasualtyMode ? 'mci-header' : ''}`}>
      <div className="header-left">
        <div className="header-title-group">
          <h1 className="header-title">
            {massCasualtyMode && <AlertTriangle size={18} className="mci-icon" />}
            Golden-Hour Dispatch
          </h1>
          <div className={`save-indicator ${saveStatus}`}>
            {saveStatus === 'saving' && <><Save size={12} className="spin-icon" /> Saving...</>}
            {saveStatus === 'saved' && <><CheckCircle size={12} /> Saved</>}
            {saveStatus === 'idle' && lastSaved && <><CheckCircle size={12} /> Auto-save on</>}
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search patients, hospitals, records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button
            className={`header-btn notification-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>

          <div className="header-divider" />

          <button className="header-profile">
            <div className="profile-avatar">
              <User size={16} />
            </div>
            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              <span className="profile-role">EMT Lead</span>
            </div>
          </button>

          <button
            className="header-btn"
            onClick={handleLogout}
            title="Sign Out"
            style={{ color: '#64748B' }}
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="notification-dropdown animate-scale">
            <div className="dropdown-header">
              <span>Notifications</span>
              <button className="mark-read">Mark all read</button>
            </div>
            <div className="dropdown-list">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`dropdown-item ${alert.type}`}>
                  <span className="dropdown-icon">{alert.icon}</span>
                  <div className="dropdown-content">
                    <p>{alert.message}</p>
                    <span className="dropdown-time">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
