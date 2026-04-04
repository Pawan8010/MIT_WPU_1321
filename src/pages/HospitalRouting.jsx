import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import {
  Building2, MapPin, Activity, Heart, Wind, Star, Clock,
  CheckCircle, ArrowRight, Zap, AlertTriangle, ChevronRight, Plane, Loader2
} from 'lucide-react';
import './HospitalRouting.css';

import { filterHospitals } from '../utils/filterHospitals';

export default function HospitalRouting() {
  const navigate = useNavigate();
  const { routing, routingLoading, runRouting, confirmBooking, bookingLoading, booking, patientData, setIsNavigating } = useStore();
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Determine severity correctly, unwrapping objects if they exist
  const rawSeverity = patientData?.aiSeverity || patientData?.severity || 'UNKNOWN';
  const severityStr = typeof rawSeverity === 'object' ? rawSeverity.label : rawSeverity;
  
  const hospitalsToShow = routing?.hospitals ? filterHospitals(routing.hospitals, severityStr) : [];

  useEffect(() => {
    // Auto-run routing if there's no data and not loading right now
    if (!routing && !routingLoading) {
      handleRunRouting();
    }
  }, []);

  const handleRunRouting = async () => {
    try { 
      await runRouting(); 
    } catch (e) { 
      toast.error('Routing failed: ' + (e?.message || 'Unknown error')); 
    }
  };

  const handleConfirm = async () => {
    if (!selectedHospital) {
      toast.error('Select a hospital first');
      return;
    }
    try {
      const result = await confirmBooking(selectedHospital);
      toast.success(`🚑 ${selectedHospital.name} notified successfully!`);
    } catch {
      toast.error('Failed to notify hospital');
    }
  };

  if (!routing && !routingLoading) {
    return (
      <div className="routing-page">
        <div className="page-header">
          <div>
            <h2>Hospital Routing</h2>
            <p className="page-subtitle">AI-optimized hospital selection based on patient needs</p>
          </div>
        </div>
        <div className="routing-empty card">
          <AlertTriangle size={48} className="empty-icon warning-icon" />
          <h3>No Routing Data Found</h3>
          <p>We couldn't automatically locate nearby hospitals right now.</p>
          <div className="empty-actions">
            <button className="btn btn-outline" onClick={() => navigate('/app/triage')}>Go to Triage</button>
            <button className="btn btn-primary" onClick={handleRunRouting}>
              <Zap size={16} /> Retry Routing
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (routingLoading) {
    return (
      <div className="routing-page">
        <div className="page-header">
          <div>
            <h2>Hospital Routing</h2>
            <p className="page-subtitle">Scanning local grids...</p>
          </div>
        </div>
        <div className="routing-loading card glass-card">
          <div className="loading-animation">
            <Loader2 size={40} className="loading-icon spin-icon" />
          </div>
          <h3 className="gradient-text">Finding Optimal Hospital...</h3>
          <p>Analyzing distance, capacity, and resource availability in real-time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="routing-page">
      <div className="page-header">
        <div>
          <h2>Hospital Routing</h2>
          <p className="page-subtitle">{routing.hospitals.length} hospitals analyzed — Best match found</p>
        </div>
        {!booking && (
          <button className="btn btn-primary btn-lg" onClick={handleConfirm} disabled={bookingLoading || !selectedHospital}>
            {bookingLoading ? (
              <><span className="btn-spinner" /> Notifying...</>
            ) : (
              <><CheckCircle size={16} /> Confirm & Notify Hospital</>
            )}
          </button>
        )}
      </div>

      {/* Booking Confirmation */}
      {booking && (
        <div className="booking-confirmation card animate-scale">
          <div className="booking-icon">
            <CheckCircle size={32} />
          </div>
          <div className="booking-details">
            <h3>🚑 Hospital Notified Successfully</h3>
            <div className="booking-meta">
              <div className="booking-field">
                <span className="bf-label">Booking ID</span>
                <span className="bf-value mono">{booking.bookingId}</span>
              </div>
              <div className="booking-field">
                <span className="bf-label">Hospital</span>
                <span className="bf-value">{booking.hospital?.name}</span>
              </div>
              <div className="booking-field">
                <span className="bf-label">Status</span>
                <span className="bf-value status-tag">
                  <span className="status-dot-active" />{booking.status}
                </span>
              </div>
              <div className="booking-field">
                <span className="bf-label">ETA</span>
                <span className="bf-value mono">{booking.hospital?.eta} min</span>
              </div>
            </div>
          </div>
          <div className="booking-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={() => { setIsNavigating(true); navigate('/app/navigation'); }} style={{ flex: 1 }}>
              <MapPin size={16} /> Track internally <ArrowRight size={14} />
            </button>
            <button className="btn btn-outline" onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${booking.hospital.lat},${booking.hospital.lng}&travelmode=driving`;
              window.open(url, '_blank');
            }} style={{ flex: 1 }}>
              <MapPin size={16} /> Google Maps
            </button>
          </div>
        </div>
      )}

      {/* Hospital Cards */}
      <div className="hospital-grid">
        {hospitalsToShow.map((h, i) => (
          <div
            key={h.id}
            className={`hospital-card card ${h.isRecommended ? 'recommended' : ''} ${selectedHospital?.id === h.id ? 'selected' : ''}`}
            onClick={() => !booking && setSelectedHospital(h)}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {h.isRecommended && (
              <div className="recommended-badge">
                <Star size={12} /> Recommended
              </div>
            )}
            <div className="hospital-rank mono">#{h.rank}</div>
            <div className="hospital-info">
              <h3 className="hospital-name">{h.name}</h3>
              <span className="hospital-address">{h.address}</span>
            </div>

            <div className="hospital-stats-grid">
              <div className="h-stat">
                <MapPin size={14} />
                <div>
                  <span className="h-stat-value mono">{h.distance} km</span>
                  <span className="h-stat-label">Distance</span>
                </div>
              </div>
              <div className="h-stat">
                <Clock size={14} />
                <div>
                  <span className="h-stat-value mono">{h.eta} min</span>
                  <span className="h-stat-label">ETA</span>
                </div>
              </div>
              <div className="h-stat">
                <Star size={14} />
                <div>
                  <span className="h-stat-value mono">{h.rating}</span>
                  <span className="h-stat-label">Rating</span>
                </div>
              </div>
              {h.hasHelipad && (
                <div className="h-stat helipad">
                  <Plane size={14} />
                  <div>
                    <span className="h-stat-value">Yes</span>
                    <span className="h-stat-label">Helipad</span>
                  </div>
                </div>
              )}
            </div>

            <div className="hospital-load-section">
              <div className="load-header">
                <span>Hospital Load</span>
                <span className={`load-pct mono ${h.load > 80 ? 'danger' : h.load > 60 ? 'warning' : 'good'}`}>{h.load}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${h.load}%`,
                  background: h.load > 80 ? 'var(--danger)' : h.load > 60 ? 'var(--warning)' : 'var(--success)'
                }} />
              </div>
            </div>

            <div className="hospital-resources">
              <div className={`resource-item ${h.icuAvailable > 0 ? 'available' : 'unavailable'}`}>
                <Heart size={12} />
                <span>ICU: <strong className="mono">{h.icuAvailable}/{h.icuTotal}</strong></span>
              </div>
              <div className={`resource-item ${h.ventilatorAvailable > 0 ? 'available' : 'unavailable'}`}>
                <Wind size={12} />
                <span>Vent: <strong className="mono">{h.ventilatorAvailable}/{h.ventilatorTotal}</strong></span>
              </div>
            </div>

            <div className="hospital-specialties">
              {h.specialties.map(s => (
                <span key={s} className="specialty-tag">{s}</span>
              ))}
            </div>

            {!booking && (
              <div className="hospital-select-indicator">
                {selectedHospital?.id === h.id ? (
                  <CheckCircle size={18} className="selected-icon" />
                ) : (
                  <span className="select-text">Select</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
