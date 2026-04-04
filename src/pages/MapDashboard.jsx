import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import {
  MapPin, Navigation, Clock, Activity, Building2, Truck,
  AlertTriangle, ChevronRight, Route, Compass, LocateFixed,
  ArrowUpRight, CornerUpRight, CornerDownRight, ArrowUp,
  RotateCcw, Maximize2
} from 'lucide-react';
import './MapDashboard.css';

const TOMTOM_API_KEY = '7j9r3QW5FgwRbDzy4nbfWM5O0tyvxP6R';

// Turn instruction icon mapping
const getTurnIcon = (maneuver) => {
  if (!maneuver) return <ArrowUp size={14} />;
  const m = maneuver.toLowerCase();
  if (m.includes('right')) return <CornerUpRight size={14} />;
  if (m.includes('left')) return <CornerDownRight size={14} />;
  if (m.includes('arrive') || m.includes('destination')) return <MapPin size={14} />;
  if (m.includes('roundabout') || m.includes('rotary')) return <RotateCcw size={14} />;
  return <ArrowUp size={14} />;
};

export default function MapDashboard() {
  const navigate = useNavigate();
  const { routing, booking } = useStore();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [trafficEnabled, setTrafficEnabled] = useState(true);

  const routeInfo = booking?.routeInfo || routing?.routeInfo;
  const targetHospital = booking?.hospital || routing?.recommended;
  const hospitalsToShow = routing?.hospitals || (nearbyHospitals.length > 0 ? nearbyHospitals : []);

  // Continuous Real-Time GPS Tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading // useful for rotation
        };
        setUserLocation(newCoords);
        
        // If we are "Live", update the map center automatically
        if (mapInstanceRef.current && !isNavigating) {
           mapInstanceRef.current.panTo([newCoords.lat, newCoords.lng], { animate: true });
        }
      },
      (err) => console.warn("GPS Watch Error:", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating]);

  // Auto-fetch hospitals if none exist
  useEffect(() => {
    const initHospitals = async () => {
      if (routing?.hospitals) {
        setNearbyHospitals(routing.hospitals);
        return;
      }
      
      let loc = userLocation || { lat: 18.5204, lng: 73.8567 }; // Default Pune
      try {
        const { fetchNearbyHospitals } = await import('../services/api');
        const data = await fetchNearbyHospitals(loc.lat, loc.lng);
        setNearbyHospitals(data);
      } catch (e) {
        console.error("Auto-fetch hospitals failed", e);
      }
    };
    initHospitals();
  }, [routing, userLocation]);

  // ETA Countdown
  useEffect(() => {
    if (!routeSummary?.travelTimeInSeconds && !targetHospital?.eta && !selectedHospital?.eta) return;
    let remaining = routeSummary?.travelTimeInSeconds || (targetHospital?.eta * 60) || (selectedHospital?.eta * 60);
    setEtaCountdown(remaining);
    const interval = setInterval(() => {
      setEtaCountdown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [routeSummary, targetHospital, selectedHospital]);

  // Simulation state
  const [simPos, setSimPos] = useState(0);
  const simIntervalRef = useRef(null);

  // Fetch route from TomTom Routing API
  const fetchRoute = useCallback(async (origin, destination) => {
    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json?key=${TOMTOM_API_KEY}&travelMode=car&traffic=true&instructionsType=text&language=en-US&sectionType=traffic`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Routing API failed');
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const legs = route.legs || [];
        const points = legs.flatMap(leg =>
          leg.points.map(p => ({ lat: p.latitude, lng: p.longitude }))
        );

        const summary = route.summary;
        setRouteSummary(summary);
        setRouteData(points);

        // Extract turn-by-turn directions
        const allInstructions = legs.flatMap(leg =>
          (leg.instructions || []).map(inst => ({
            text: inst.message || inst.street || 'Continue',
            distance: inst.routeOffsetInMeters,
            maneuver: inst.maneuver || inst.drivingSide || '',
            street: inst.street || '',
            travelTime: inst.travelTimeInSeconds || 0,
            point: inst.point ? { lat: inst.point.latitude, lng: inst.point.longitude } : null,
          }))
        );
        setDirections(allInstructions);
        return { points, summary, instructions: allInstructions };
      }
    } catch (err) {
      console.error('TomTom Routing error:', err);
      return null;
    }
  }, []);

  // START SIMULATION
  const startSimulation = useCallback(() => {
    if (!routeData || routeData.length === 0) return;
    setIsNavigating(true);
    setSimPos(0);
    setActiveDirection(0);

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    
    let step = 0;
    simIntervalRef.current = setInterval(() => {
      step += 1;
      if (step >= routeData.length) {
        clearInterval(simIntervalRef.current);
        setIsNavigating(false);
        return;
      }
      setSimPos(step);
      
      // Update directions sync
      const currentPt = routeData[step];
      const nextDirIndex = directions.findIndex((d, idx) => {
        if (!d.point || idx <= activeDirection) return false;
        // Check proximity (~50m)
        const dist = Math.sqrt(Math.pow(d.point.lat - currentPt.lat, 2) + Math.pow(d.point.lng - currentPt.lng, 2));
        return dist < 0.0005; 
      });
      if (nextDirIndex !== -1) setActiveDirection(nextDirIndex);
      
    }, 200); // simulation speed
  }, [routeData, directions, activeDirection]);

  // Initialize TomTom Map with Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loadMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        const origin = routeInfo?.origin || userLocation || { lat: 18.5204, lng: 73.8567 };
        const map = L.map(mapRef.current, {
          center: [origin.lat, origin.lng],
          zoom: 14,
          zoomControl: false,
        });

        // TomTom Vector Tile Layer
        L.tileLayer(
          `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}&tileSize=512`,
          {
            attribution: '© TomTom',
            maxZoom: 22,
            tileSize: 512,
            zoomOffset: -1,
          }
        ).addTo(map);
        // Traffic Layer
        if (trafficEnabled) {
          L.tileLayer(
            `https://api.tomtom.com/traffic/map/4/tile/flow/relative0-dark/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`,
            { maxZoom: 22, opacity: 0.7 }
          ).addTo(map);
        }

        L.control.zoom({ position: 'topright' }).addTo(map);

        // Ambulance marker 
        const ambulanceIcon = L.divIcon({
          html: `<div class="map-marker ambulance-marker">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/>
              <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
            </svg>
          </div>`,
          className: 'custom-div-icon',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const currentCoords = (isNavigating && routeData?.[simPos]) ? routeData[simPos] : origin;
        const ambulanceMarker = L.marker([currentCoords.lat, currentCoords.lng], { icon: ambulanceIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup('<b>🚑 Ambulance</b><br>Live Tracking Active');
        markersRef.current.push(ambulanceMarker);

        // Hospital markers
        hospitalsToShow.forEach(h => {
          const isTarget = h.id === targetHospital?.id || selectedHospital?.id === h.id;
          const hospitalIcon = L.divIcon({
            html: `<div class="map-marker hospital-marker ${isTarget ? 'recommended' : ''}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/>
                <path d="M12 6v4M10 8h4"/>
              </svg>
            </div>`,
            className: 'custom-div-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const marker = L.marker([h.lat, h.lng], { icon: hospitalIcon })
            .addTo(map)
            .on('click', () => {
              setSelectedHospital(h);
              fetchRoute(currentCoords, { lat: h.lat, lng: h.lng });
            });
            
          marker.bindTooltip(`<b>${h.name}</b>`, { permanent: false, direction: 'top' });
          markersRef.current.push(marker);
        });

        // Auto-select target if no route exists
        if (!routeData && (targetHospital || hospitalsToShow[0])) {
           const target = targetHospital || hospitalsToShow[0];
           fetchRoute(origin, { lat: target.lat, lng: target.lng });
        }

        // Draw Route
        if (routeData && routeData.length > 0) {
           const polylineData = routeData.map(p => [p.lat, p.lng]);
           const routeLine = L.polyline(polylineData, {
             color: '#2563EB',
             weight: 5,
             opacity: 0.9,
             lineCap: 'round',
             lineJoin: 'round',
           }).addTo(map);

           // Glowing tracer
           L.polyline(polylineData, {
             color: '#60A5FA',
             weight: 8,
             opacity: 0.2,
             lineCap: 'round',
             lineJoin: 'round',
           }).addTo(map);

           routeLayerRef.current = routeLine;
           
           // If we just started, fit bounds
           if (simPos === 0) {
             map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });
           }
           
           // If navigating, follow the ambulance
           if (isNavigating) {
             map.panTo([currentCoords.lat, currentCoords.lng], { animate: true });
           }
        }

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (err) {
        console.error('Map load failed:', err);
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        routeLayerRef.current = null;
        markersRef.current = [];
      }
    };
  }, [routing, userLocation, fetchRoute, isNavigating, routeData, simPos]);

  const formatCountdown = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    // If navigating, reduce ETA based on simPos
    const totalSteps = routeData?.length || 1;
    const progress = simPos / totalSteps;
    const currentSeconds = Math.max(0, Math.round(seconds * (1 - progress)));
    
    const m = Math.floor(currentSeconds / 60);
    const s = currentSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (!meters && meters !== 0) return '--';
    const totalSteps = routeData?.length || 1;
    const remainingMeters = Math.max(0, Math.round(meters * (1 - (simPos / totalSteps))));
    
    if (remainingMeters < 1000) return `${remainingMeters} m`;
    return `${(remainingMeters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const totalSteps = routeData?.length || 1;
    const currentSeconds = Math.max(0, Math.round(seconds * (1 - (simPos / totalSteps))));
    
    if (currentSeconds < 60) return `${currentSeconds}s`;
    const mins = Math.floor(currentSeconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const handleStartNavigation = () => {
    startSimulation();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && routeLayerRef.current) {
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] });
    }
  };

  return (
    <div className="map-page">
      <div className="page-header">
        <div>
          <h2>
            <Navigation size={22} className="header-icon" />
            Navigation Dashboard
          </h2>
          <p className="page-subtitle">Real-time ambulance tracking & turn-by-turn routing • Powered by TomTom</p>
        </div>
        <div className="map-header-actions">
          {!isNavigating && directions.length > 0 && (
            <button className="btn btn-primary btn-glow" onClick={handleStartNavigation}>
              <Navigation size={16} /> Start Navigation
            </button>
          )}
          <button className="btn btn-outline btn-icon" onClick={handleRecenter} title="Re-center map">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div className="map-layout">
        {/* Map Container */}
        <div className="map-container card">
          <div ref={mapRef} className="map-element" />
          {!mapLoaded && (
            <div className="map-loading">
              <div className="loading-animation">
                <div className="loading-ring" />
                <MapPin size={28} className="loading-icon" />
              </div>
              <p>Loading TomTom Map...</p>
            </div>
          )}

          {/* Map Overlay Stats */}
          <div className="map-overlay-stats">
            <div className="map-stat-card glass">
              <Truck size={16} />
              <div>
                <span className="map-stat-val mono">
                  {routeSummary ? formatDistance(routeSummary.lengthInMeters) : (recommended?.distance ? `${recommended.distance} km` : '--')}
                </span>
                <span className="map-stat-lbl">Distance</span>
              </div>
            </div>
            <div className="map-stat-card glass">
              <Clock size={16} />
              <div>
                <span className="map-stat-val mono">
                  {routeSummary ? formatDuration(routeSummary.travelTimeInSeconds) : formatCountdown(etaCountdown)}
                </span>
                <span className="map-stat-lbl">Travel Time</span>
              </div>
            </div>
            <div className="map-stat-card glass">
              <Activity size={16} />
              <div>
                <span className="map-stat-val">{booking ? 'Active' : routeData ? 'Routed' : 'Idle'}</span>
                <span className="map-stat-lbl">Status</span>
              </div>
            </div>
            {routeSummary?.trafficDelayInSeconds > 0 && (
              <div className="map-stat-card glass traffic-delay">
                <AlertTriangle size={16} />
                <div>
                  <span className="map-stat-val mono danger-text">
                    +{formatDuration(routeSummary.trafficDelayInSeconds)}
                  </span>
                  <span className="map-stat-lbl">Traffic Delay</span>
                </div>
              </div>
            )}
          </div>

          {/* TomTom Attribution Badge */}
          <div className="tomtom-badge">
            <Compass size={12} />
            <span>TomTom</span>
          </div>
        </div>

        {/* Map Sidebar */}
        <div className="map-sidebar">
          {/* Navigation Directions Panel */}
          {isNavigating && directions.length > 0 && (
            <div className="card nav-directions-card">
              <div className="card-header nav-header">
                <h3><Navigation size={16} /> Turn-by-Turn</h3>
                <button className="btn btn-sm btn-ghost" onClick={() => setIsNavigating(false)}>
                  End
                </button>
              </div>
              <div className="card-body nav-directions-list">
                {directions.map((d, i) => (
                  <div
                    key={i}
                    className={`nav-direction-item ${i === activeDirection ? 'active' : ''} ${i < activeDirection ? 'passed' : ''}`}
                    onClick={() => setActiveDirection(i)}
                  >
                    <div className="nav-dir-icon">
                      {getTurnIcon(d.maneuver)}
                    </div>
                    <div className="nav-dir-content">
                      <span className="nav-dir-text">{d.text}</span>
                      {d.street && <span className="nav-dir-street">{d.street}</span>}
                    </div>
                    <span className="nav-dir-dist mono">
                      {d.distance ? formatDistance(d.distance) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Info */}
          <div className="card map-info-card">
            <div className="card-header">
              <h3><Route size={16} /> Route Information</h3>
            </div>
            <div className="card-body">
              {routing || routeData ? (
                <div className="route-details">
                  <div className="route-point">
                    <div className="route-dot origin" />
                    <div>
                      <span className="route-point-label">Origin</span>
                      <span className="route-point-value">Ambulance Current Location</span>
                    </div>
                  </div>
                  <div className="route-line-v" />
                  <div className="route-point">
                    <div className="route-dot destination" />
                    <div>
                      <span className="route-point-label">Destination</span>
                      <span className="route-point-value">{recommended?.name || 'Not Selected'}</span>
                    </div>
                  </div>
                  {routeSummary && (
                    <div className="route-summary-stats">
                      <div className="rs-item">
                        <span className="rs-label">Total Distance</span>
                        <span className="rs-value mono">{formatDistance(routeSummary.lengthInMeters)}</span>
                      </div>
                      <div className="rs-item">
                        <span className="rs-label">Travel Time</span>
                        <span className="rs-value mono">{formatDuration(routeSummary.travelTimeInSeconds)}</span>
                      </div>
                      {routeSummary.trafficDelayInSeconds > 0 && (
                        <div className="rs-item traffic">
                          <span className="rs-label">Traffic Delay</span>
                          <span className="rs-value mono danger-text">+{formatDuration(routeSummary.trafficDelayInSeconds)}</span>
                        </div>
                      )}
                      <div className="rs-item">
                        <span className="rs-label">Departure</span>
                        <span className="rs-value mono">
                          {new Date(routeSummary.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="rs-item">
                        <span className="rs-label">Arrival</span>
                        <span className="rs-value mono">
                          {new Date(routeSummary.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rp-empty">No route available. Run hospital routing first.</p>
              )}
            </div>
          </div>

          {/* ETA Card */}
          <div className="card map-eta-card">
            <div className="eta-display">
              <Clock size={20} />
              <div className="eta-time mono">{formatCountdown(etaCountdown)}</div>
              <span className="eta-label">Estimated Arrival</span>
            </div>
            {booking && (
              <div className="eta-status">
                <span className="status-dot-active" />
                <span>Ambulance En Route</span>
              </div>
            )}
          </div>

          {/* Hospitals Mini List */}
          <div className="card map-hospitals-card">
            <div className="card-header">
              <h3><Building2 size={16} /> Nearby Hospitals</h3>
            </div>
            <div className="card-body mini-hospital-list">
              {(routing?.hospitals || []).slice(0, 4).map(h => (
                <div key={h.id} className={`mini-hospital ${h.isRecommended ? 'rec' : ''}`}>
                  <div className="mh-info">
                    <span className="mh-name">{h.name}</span>
                    <span className="mh-dist mono">{h.distance} km</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div className="progress-fill" style={{
                      width: `${h.load}%`,
                      background: h.load > 80 ? 'var(--danger)' : h.load > 60 ? 'var(--warning)' : 'var(--success)'
                    }} />
                  </div>
                </div>
              ))}
              {!routing && <p className="rp-empty">Run routing to see hospitals</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
