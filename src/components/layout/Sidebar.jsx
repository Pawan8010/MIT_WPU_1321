import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import {
  LayoutDashboard, ClipboardList, Brain, Building2, Map, Lightbulb,
  AlertTriangle, SettingsIcon, ChevronLeft, ChevronRight, Activity, Heart
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { id: 'dashboard', path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'emt-form', path: '/app/emt-form', label: 'EMT Form', icon: ClipboardList },
  { id: 'prediction', path: '/app/prediction', label: 'Prediction', icon: Brain },
  { id: 'hospital-routing', path: '/app/hospital-routing', label: 'Hospital Routing', icon: Building2 },
  { id: 'map', path: '/app/map', label: 'Map Dashboard', icon: Map },
  { id: 'xai', path: '/app/xai', label: 'XAI Panel', icon: Lightbulb },
  { id: 'mass-casualty', path: '/app/mass-casualty', label: 'Mass Casualty', icon: AlertTriangle },
  { id: 'settings', path: '/app/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, massCasualtyMode } = useStore();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${massCasualtyMode ? 'mci-mode' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => navigate('/app/dashboard')}>
        <div className="logo-icon">
          <Heart size={22} strokeWidth={2.5} />
          <Activity size={14} className="logo-pulse" />
        </div>
        {!sidebarCollapsed && (
          <div className="logo-text">
            <span className="logo-title">GoldenHour</span>
            <span className="logo-subtitle">Emergency Triage</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              className={`nav-item ${active ? 'active' : ''} ${item.id === 'mass-casualty' && massCasualtyMode ? 'mci-active' : ''}`}
              onClick={() => navigate(item.path)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <div className="nav-icon">
                <Icon size={20} />
              </div>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
              {active && <div className="nav-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* MCI Badge */}
      {massCasualtyMode && !sidebarCollapsed && (
        <div className="mci-badge">
          <AlertTriangle size={14} />
          <span>MCI ACTIVE</span>
        </div>
      )}

      {/* Collapse Toggle */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
