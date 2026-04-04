import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { 
  Navigation as NavIcon, MapPin, Clock, ArrowRight, 
  AlertCircle, Shield, LocateFixed, Zap, TrendingUp,
  RotateCcw, Compass, PhoneCall, Building2
} from 'lucide-react';
import './Navigation.css';

const TOMTOM_API_KEY = '7j9r3QW5FgwRbDzy4nbfWM5O0tyvxP6R';

export default function Navigation() {
  const navigate = useNavigate();
  const { booking, routing, setBooking } = useStore();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [betterHospitalFound, setBetterHospitalFound] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        const map = L.map(mapRef.current, { center: [18.5204, 73.8567], zoom: 15, zoomControl: false });
        L.tileLayer(`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`).addTo(map);
        mapInstanceRef.current = map;

        // Start GPS Watch
        navigator.geolocation.watchPosition((pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          map.panTo([coords.lat, coords.lng]);
        });
      } catch (err) { console.error(err); }
    };
    initMap();
  }, []);

  // ROUTE DRAWING
  const drawRoute = useCallback(async (origin, dest) => {
    if (!mapInstanceRef.current) return;
    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${dest.lat},${dest.lng}/json?key=${TOMTOM_API_KEY}&traffic=true`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.routes && data.routes[0]) {
        const L = await import('leaflet');
        const points = data.routes[0].legs[0].points.map(p => [p.latitude, p.longitude]);
        
        if (routeLayerRef.current) mapInstanceRef.current.removeLayer(routeLayerRef.current);
        
        routeLayerRef.current = L.polyline(points, { color: '#2563EB', weight: 8, opacity: 0.8 }).addTo(mapInstanceRef.current);
        mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
        setEta(Math.round(data.routes[0].summary.travelTimeInSeconds / 60));
      }
    } catch (e) { console.error(e); }
  }, []);

  // POLLING FOR BETTER HOSPITAL (Every 10 seconds)
  useEffect(() => {
    if (!userLocation || !booking) return;

    const checkBetterRoute = async () => {
      try {
        const res = await fetch('/api-ml/get-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_location: userLocation,
            hospitals: routing?.hospitals || [],
            severity: booking.patientSeverity || "HIGH"
          })
        });
        
        const data = await res.json();
        if (data.best_hospital && data.best_hospital.id !== booking.hospital.id) {
          setBetterHospitalFound(data.best_hospital);
          toast("Better hospital found based on traffic!", { icon: '🚑', duration: 4000 });
        }
      } catch (e) { console.error("Poll failed", e); }
    };

    const interval = setInterval(checkBetterRoute, 10000);
    return () => clearInterval(interval);
  }, [userLocation, booking, routing]);

  // Initial Route Load
  useEffect(() => {
    if (userLocation && booking?.hospital) {
      drawRoute(userLocation, { lat: booking.hospital.lat, lng: booking.hospital.lng });
    }
  }, [userLocation, booking, drawRoute]);

  const switchHospital = () => {
    if (betterHospitalFound) {
      setBooking({ ...booking, hospital: betterHospitalFound });
      setBetterHospitalFound(null);
      toast.success("Route Updated to " + betterHospitalFound.name);
    }
  };

  return (
    <div className="nav-page">
      <div id="nav-map" ref={mapRef} className="full-map"></div>

      <div className="nav-overlay top">
        <div className="nav-header glass animate-slide-down">
          <div className="ambulance-id">
            <Zap size={18} fill="currentColor" />
            <span>AMB-7023 • ALPHA RESPONSE</span>
          </div>
          <div className="eta-badge">
            <Clock size={16} />
            <span className="mono">{eta} MIN</span>
          </div>
        </div>
      </div>

      <div className="nav-overlay bottom">
        <div className="hospital-panel glass animate-slide-up">
          <div className="panel-top">
            <div className="h-info">
              <h3>{booking?.hospital?.name || "Target Hospital"}</h3>
              <p><MapPin size={12} /> {booking?.hospital?.address || "Navigation target initialized"}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-call" 
                title="Open in Google Maps"
                onClick={() => {
                  if (booking?.hospital) {
                    const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
                    const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${booking.hospital.lat},${booking.hospital.lng}&travelmode=driving`;
                    window.open(url, '_blank');
                  }
                }}
              >
                <Compass size={20} />
              </button>
              <button className="btn-call" title="Call Hospital">
                <PhoneCall size={20} />
              </button>
            </div>
          </div>

          <div className="vitals-mini-panel">
            <div className="v-stat">
              <TrendingUp size={14} className="text-primary" />
              <span>TRAFFIC: MINIMAL</span>
            </div>
            <div className="v-stat">
              <Shield size={14} className="text-success" />
              <span>CAPACITY: STABLE</span>
            </div>
          </div>
        </div>
      </div>

      {betterHospitalFound && (
        <div className="re-route-alert animate-bounce-in">
          <div className="alert-content">
            <AlertCircle className="text-warning" />
            <div>
              <h4>Faster Route Found</h4>
              <p>{betterHospitalFound.name} is {betterHospitalFound.eta} min away</p>
            </div>
          </div>
          <button className="btn btn-warning" onClick={switchHospital}>
            RE-ROUTE NOW <NavIcon size={14} />
          </button>
        </div>
      )}
      
      <button className="btn-float-locate" onClick={() => userLocation && mapInstanceRef.current?.panTo([userLocation.lat, userLocation.lng])}>
        <LocateFixed size={24} />
      </button>
    </div>
  );
}
