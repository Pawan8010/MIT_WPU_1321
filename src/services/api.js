/**
 * API Service — connects frontend to ML service and Firebase Functions.
 *
 * Each function first attempts the real ML API (FastAPI / emergency_triage_ml),
 * and falls back to the built-in demo logic if the service is unreachable.
 */
import { buildFeatures } from './featureBuilder.js';

// ─── Configuration ───────────────────────────────────────────
const ML_SERVICE_URL =
  import.meta.env.VITE_ML_SERVICE_URL || "http://localhost:8000";
const FUNCTIONS_URL =
  import.meta.env.VITE_FUNCTIONS_URL || "http://localhost:5001/ignisia-57522/us-central1";

const TOMTOM_API_KEY = '7j9r3QW5FgwRbDzy4nbfWM5O0tyvxP6R';

/**
 * Real-time Hospital Search using TomTom API
 * Finds actual hospitals near the user's coordinates.
 */
export async function fetchNearbyHospitals(lat, lng) {
  try {
      const radius = 25000; // 25km radius
      const url = `https://api.tomtom.com/search/2/poiSearch/hospital.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lng}&radius=${radius}&limit=8`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('TomTom Search failed');
      const data = await res.json();
      
      // Map TomTom results to our application's Hospital schema
      return data.results.map((poi, index) => {
          const dist = (poi.dist / 1000).toFixed(1);
          return {
              id: poi.id || `h-${index}`,
              name: poi.poi.name,
              address: poi.address.freeformAddress,
              lat: poi.position.lat,
              lng: poi.position.lon,
              distance: parseFloat(dist),
              eta: Math.round((dist * 3) + 5), // dynamic ETA based on distance
              load: Math.floor(Math.random() * 60) + 20, 
              icuAvailable: Math.floor(Math.random() * 8),
              icuTotal: 20,
              ventilatorAvailable: Math.floor(Math.random() * 5),
              ventilatorTotal: 10,
              specialties: poi.poi.classifications[0]?.code === 'HOSPITAL' ? ["Emergency", "Trauma", "General Care"] : ["Clinic", "Emergency"],
              rating: (4.0 + (Math.random() * 1.0)).toFixed(1),
              hasHelipad: Math.random() > 0.8,
              traumaLevel: Math.floor(Math.random() * 3) + 1
          };
      });
  } catch (error) {
      console.error("Real-time hospital search failed:", error);
      return []; 
  }
}

const DELAY = () => new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

// ─── Severity helpers (used by fallback) ─────────────────────
const severityLabels = ['GREEN', 'YELLOW', 'ORANGE', 'RED', 'BLACK'];
const severityNames = ['Minor', 'Delayed', 'Urgent', 'Immediate', 'Deceased'];

export function calculateSeverityFromVitals(vitals) {
  let score = 0;
  const { heartRate, spo2, respiratoryRate, systolicBP, gcs, pain, temperature, glucose } = vitals;

  if (heartRate > 120 || heartRate < 50) score += 25;
  else if (heartRate > 100 || heartRate < 60) score += 12;

  if (spo2 < 88) score += 30;
  else if (spo2 < 92) score += 20;
  else if (spo2 < 95) score += 10;

  if (respiratoryRate > 30 || respiratoryRate < 8) score += 25;
  else if (respiratoryRate > 24 || respiratoryRate < 12) score += 12;

  if (systolicBP < 80 || systolicBP > 200) score += 25;
  else if (systolicBP < 90 || systolicBP > 180) score += 15;

  if (gcs <= 8) score += 30;
  else if (gcs <= 12) score += 15;
  else if (gcs <= 14) score += 5;

  if (pain >= 8) score += 15;
  else if (pain >= 5) score += 8;

  if (temperature > 39.5 || temperature < 35) score += 12;
  if (glucose > 300 || glucose < 60) score += 15;

  return Math.min(score, 100);
}

export function getSeverityLevel(score) {
  if (score >= 80) return { level: 4, label: 'BLACK', name: 'Deceased/Expectant', color: '#1F2937' };
  if (score >= 60) return { level: 3, label: 'RED', name: 'Immediate', color: '#DC2626' };
  if (score >= 40) return { level: 2, label: 'ORANGE', name: 'Urgent', color: '#D97706' };
  if (score >= 20) return { level: 1, label: 'YELLOW', name: 'Delayed', color: '#EAB308' };
  return { level: 0, label: 'GREEN', name: 'Minor', color: '#059669' };
}

// ─── Feature importance builder ──────────────────────────────
function buildFeatureImportance(patientData) {
  const vitals = {
    heartRate: patientData.heartRate || 80,
    spo2: patientData.spo2 || 98,
    respiratoryRate: patientData.respiratoryRate || 16,
    systolicBP: patientData.systolicBP || 120,
    gcs: patientData.gcs || 15,
    pain: patientData.pain || 3,
    temperature: patientData.temperature || 37,
    glucose: patientData.glucose || 100,
  };

  const featureImportance = [
    { feature: 'SpO2 Level', importance: vitals.spo2 < 95 ? 35 : 10, value: vitals.spo2 },
    { feature: 'Heart Rate', importance: (vitals.heartRate > 100 || vitals.heartRate < 60) ? 25 : 8, value: vitals.heartRate },
    { feature: 'Blood Pressure', importance: (vitals.systolicBP < 90 || vitals.systolicBP > 180) ? 30 : 10, value: vitals.systolicBP },
    { feature: 'GCS Score', importance: vitals.gcs < 12 ? 35 : 5, value: vitals.gcs },
    { feature: 'Pain Level', importance: vitals.pain >= 7 ? 20 : 5, value: vitals.pain },
    { feature: 'Respiratory Rate', importance: (vitals.respiratoryRate > 25 || vitals.respiratoryRate < 10) ? 25 : 8, value: vitals.respiratoryRate },
    { feature: 'Temperature', importance: (vitals.temperature > 39 || vitals.temperature < 35.5) ? 15 : 3, value: vitals.temperature },
    { feature: 'Glucose', importance: (vitals.glucose > 250 || vitals.glucose < 70) ? 15 : 3, value: vitals.glucose },
  ].sort((a, b) => b.importance - a.importance);

  const totalImportance = featureImportance.reduce((s, f) => s + f.importance, 0);
  return featureImportance.map((f) => ({
    ...f,
    importance: Math.round((f.importance / totalImportance) * 100),
  }));
}

// ─── severity color → level mapping (used by routing logic) ─────────────
const COLOR_TO_LEVEL = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3, BLACK: 4 };
const COLOR_DETAILS = {
  GREEN:  { level: 0, label: 'GREEN',  name: 'Minor',             color: '#059669' },
  YELLOW: { level: 1, label: 'YELLOW', name: 'Delayed',            color: '#EAB308' },
  ORANGE: { level: 2, label: 'ORANGE', name: 'Urgent',             color: '#D97706' },
  RED:    { level: 3, label: 'RED',    name: 'Immediate',          color: '#DC2626' },
  BLACK:  { level: 4, label: 'BLACK',  name: 'Deceased/Expectant', color: '#1F2937' },
};

export async function predictPatient(payload) {
    try {
        const res = await fetch(`${ML_SERVICE_URL}/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ payload }),
            // Give it a 3-second timeout before falling back
            signal: AbortSignal.timeout(3000)
        });

        if (res.ok) {
            return await res.json();
        }
        
        const err = await res.json().catch(() => ({}));
        console.warn("ML API Error, using fallback:", err.detail || "Unknown error");
    } catch (error) {
        console.warn("ML Service unreachable, using clinical fallback logic.");
    }

    // Call the clinical rules-based fallback
    return await fallbackPredict(payload);
}

/** Build a human-readable recommendation string. */
function _buildRecommendation(level, icu, vent) {
  if (level >= 4) return 'CRITICAL: Immediate life-saving intervention required. Notify receiving hospital NOW.';
  if (level >= 3) return 'EMERGENCY: Immediate intervention required.' + (icu ? ' ICU bed must be pre-booked.' : '');
  if (level >= 2) return 'URGENT: Close monitoring required.' + (vent ? ' Prepare ventilator support.' : '');
  if (level >= 1) return 'DELAYED: Patient stable. Standard care pathway. Monitor vitals.';
  return 'LOW: Patient stable. Routine assessment and care.';
}

/** Build hospital capability tags from ML response. */
function _buildCapabilities(ml) {
  const caps = ['emergency_department'];
  if (ml.needs_icu         || ml.needs_cardiac_icu) caps.push('icu');
  if (ml.needs_ventilator)                          caps.push('ventilator_support');
  if (ml.needs_ct)                                  caps.push('ct_scan');
  if (ml.needs_mri)                                 caps.push('mri');
  if (ml.needs_emergency_ot)                        caps.push('operating_theatre');
  if (ml.needs_blood_bank)                          caps.push('blood_bank');
  if (ml.needs_neurosurgeon)                        caps.push('neurosurgery');
  if (ml.needs_cardiologist)                        caps.push('cardiology');
  return caps;
}

async function fallbackPredict(patientData) {
  await DELAY();

  const vitals = {
    heartRate:       patientData.heartRate       || 80,
    spo2:            patientData.spo2            || 98,
    respiratoryRate: patientData.respiratoryRate || 16,
    systolicBP:      patientData.systolicBP      || 120,
    gcs:             patientData.gcs             || 15,
    pain:            patientData.pain            || 3,
    temperature:     patientData.temperature     || 37,
    glucose:         patientData.glucose         || 100,
  };

  const score    = calculateSeverityFromVitals(vitals);
  const severity = getSeverityLevel(score);

  // derive resource flags from vitals
  const icuNeeded        = score >= 55;
  const ventilatorNeeded = vitals.spo2 < 90 || vitals.respiratoryRate > 28;
  const severityLabel    = severity.name;
  const colorKey         = severity.label;

  return {
    score:                score,
    severity,
    needs_icu:            icuNeeded,
    needs_ventilator:     ventilatorNeeded,
    specialistNeeded:     score >= 45,
    confidence:           Math.round(72 + Math.random() * 18),
    featureImportance:    buildFeatureImportance(patientData),
    timestamp:            new Date().toISOString(),
    modelVersion:         'v3.0.0-fallback',
    source:               'fallback',
    // additional medical metadata
    severityLabel:        severity.name,
    priority:             score >= 60 ? 'EMERGENCY' : score >= 40 ? 'HIGH' : score >= 20 ? 'MODERATE' : 'LOW',
    priorityLevel:        score >= 60 ? 'P1' : score >= 40 ? 'P2' : score >= 20 ? 'P3' : 'P4',
    recommendation:       score >= 60
                            ? 'Immediate life-saving intervention. Pre-notify ICU.'
                            : score >= 40
                                ? 'Stable but high-risk. Continuous monitoring required.'
                                : 'Stable. Standard care pathway.',
    hospitalCapabilities: icuNeeded ? ['icu', 'emergency'] : ['emergency'],
  };
}

// ─── DEMO HOSPITALS ──────────────────────────────────────────
const DEMO_HOSPITALS = [
  {
    id: 'h1', name: 'City General Hospital', distance: 2.3, load: 45,
    icuAvailable: 5, icuTotal: 12, ventilatorAvailable: 3, ventilatorTotal: 8,
    specialties: ['Cardiology', 'Neurology', 'Trauma'], rating: 4.5,
    lat: 18.5275, lng: 73.8570, address: '123 Medical Center Drive',
    eta: 8, hasHelipad: true, traumaLevel: 1
  },
  {
    id: 'h2', name: "St. Mary's Medical Center", distance: 4.1, load: 72,
    icuAvailable: 2, icuTotal: 8, ventilatorAvailable: 1, ventilatorTotal: 6,
    specialties: ['Orthopedics', 'General Surgery'], rating: 4.2,
    lat: 18.5350, lng: 73.8650, address: '456 Healthcare Blvd',
    eta: 14, hasHelipad: false, traumaLevel: 2
  },
  {
    id: 'h3', name: 'Apollo Emergency Care', distance: 5.8, load: 35,
    icuAvailable: 8, icuTotal: 15, ventilatorAvailable: 6, ventilatorTotal: 10,
    specialties: ['Cardiology', 'Neurology', 'Pulmonology', 'Trauma'], rating: 4.8,
    lat: 18.5400, lng: 73.8500, address: '789 Emergency Lane',
    eta: 18, hasHelipad: true, traumaLevel: 1
  },
  {
    id: 'h4', name: 'Metro District Hospital', distance: 3.5, load: 88,
    icuAvailable: 0, icuTotal: 6, ventilatorAvailable: 0, ventilatorTotal: 4,
    specialties: ['General Medicine'], rating: 3.8,
    lat: 18.5200, lng: 73.8700, address: '321 District Road',
    eta: 12, hasHelipad: false, traumaLevel: 3
  },
  {
    id: 'h5', name: 'National Institute of Emergency Medicine', distance: 7.2, load: 52,
    icuAvailable: 10, icuTotal: 20, ventilatorAvailable: 8, ventilatorTotal: 15,
    specialties: ['Cardiology', 'Neurology', 'Trauma', 'Burns', 'Pediatrics'], rating: 4.9,
    lat: 18.5500, lng: 73.8400, address: '100 National Medical Complex',
    eta: 22, hasHelipad: true, traumaLevel: 1
  },
];

// ─── routePatient ────────────────────────────────────────────
export async function routePatient(predictionResult) {
  try {
    const response = await fetch(`${FUNCTIONS_URL}/routePatient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prediction: predictionResult }),
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const result = await response.json();
      return { ...result, source: "firebase-functions" };
    }
  } catch (err) {
    console.warn("Firebase Functions unavailable, using fallback:", err.message);
  }
  return fallbackRoute(predictionResult);
}

async function fallbackRoute(predictionResult) {
  await DELAY();

  const hospitals = DEMO_HOSPITALS.map((h) => {
    let score = 0;
    score += Math.max(0, 30 - h.distance * 3);
    score += Math.max(0, 25 - h.load * 0.25);

    if (predictionResult?.icuNeeded) {
      score += h.icuAvailable > 0 ? 20 : -30;
    }
    if (predictionResult?.ventilatorNeeded) {
      score += h.ventilatorAvailable > 0 ? 15 : -25;
    }
    if (predictionResult?.specialistNeeded) {
      const hasCardio = h.specialties.includes("Cardiology");
      const hasNeuro = h.specialties.includes("Neurology");
      score += (hasCardio ? 10 : 0) + (hasNeuro ? 10 : 0);
    }
    score += (4 - h.traumaLevel) * 5;
    return { ...h, routingScore: Math.max(0, score) };
  });

  hospitals.sort((a, b) => b.routingScore - a.routingScore);
  const recommended = hospitals[0];

  const rejected = hospitals
    .filter((h) => h.routingScore < 20)
    .map((h) => ({
      name: h.name,
      reasons: [
        h.icuAvailable === 0 && predictionResult?.icuNeeded ? "No ICU beds available" : null,
        h.ventilatorAvailable === 0 && predictionResult?.ventilatorNeeded ? "No ventilators available" : null,
        h.load > 80 ? "Hospital at high capacity" : null,
      ].filter(Boolean),
    }));

  const reasons = [];
  if (predictionResult?.severity?.level >= 3) {
    reasons.push("Patient classified as high-severity requiring immediate intervention");
  }
  if (predictionResult?.icuNeeded && recommended.icuAvailable > 0) {
    reasons.push(`ICU bed available (${recommended.icuAvailable}/${recommended.icuTotal})`);
  }
  if (predictionResult?.ventilatorNeeded && recommended.ventilatorAvailable > 0) {
    reasons.push(`Ventilator available (${recommended.ventilatorAvailable}/${recommended.ventilatorTotal})`);
  }
  if (recommended.load < 60) {
    reasons.push(`Low hospital load (${recommended.load}%)`);
  }
  reasons.push(`Distance: ${recommended.distance} km (ETA: ${recommended.eta} min)`);
  reasons.push(`Trauma Level ${recommended.traumaLevel} facility`);

  return {
    hospitals: hospitals.map((h, i) => ({ ...h, isRecommended: i === 0, rank: i + 1 })),
    recommended,
    rejected,
    explanation: {
      summary: `Patient routed to ${recommended.name} due to optimal resource availability and proximity.`,
      reasons,
      hospitalCapabilities: {
        icuAvailable: recommended.icuAvailable > 0,
        ventilatorAvailable: recommended.ventilatorAvailable > 0,
        specialistAvailable: recommended.specialties.length > 2,
        traumaLevel: recommended.traumaLevel,
      },
    },
    routeInfo: {
      origin: { lat: 18.515, lng: 73.856 },
      destination: { lat: recommended.lat, lng: recommended.lng },
      eta: recommended.eta,
      distance: recommended.distance,
    },
    timestamp: new Date().toISOString(),
    source: "fallback",
  };
}

// ─── notifyHospital ──────────────────────────────────────────
export async function notifyHospital(hospitalId, patientData, bookingData) {
  try {
    const response = await fetch(`${FUNCTIONS_URL}/notifyHospital`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: patientData?.id || `PT-${Date.now()}`,
        hospital_id: hospitalId,
        hospital_name: bookingData?.hospitalName,
        needs_icu: patientData?.icuNeeded || false,
        eta: bookingData?.eta || 15,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const result = await response.json();
      return { ...result, source: "firebase-functions" };
    }
  } catch (err) {
    console.warn("Firebase Functions unavailable, using fallback:", err.message);
  }

  await DELAY();
  return {
    success: true,
    bookingId: "BK-" + Date.now().toString(36).toUpperCase(),
    hospitalId,
    status: "EN_ROUTE",
    estimatedArrival: new Date(Date.now() + (bookingData?.eta || 15) * 60000).toISOString(),
    notifiedAt: new Date().toISOString(),
    message: `Hospital ${bookingData?.hospitalName || "Selected"} has been notified and is preparing for patient arrival.`,
    source: "fallback",
  };
}

export { DEMO_HOSPITALS };
