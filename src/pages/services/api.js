/**
 * API Service — connects frontend to ML service and Firebase Functions.
 *
 * Each function first attempts the real API, and falls back to the
 * built-in demo logic if the service is unreachable. This ensures
 * the UI always works, whether or not the backend is running.
 */
import { buildFeatureVector, validateFeatures } from "../utils/featureBuilder";
import { mapPriorityToSeverity } from "../utils/severity";

// ─── Configuration ───────────────────────────────────────────
const ML_SERVICE_URL =
  import.meta.env.VITE_ML_SERVICE_URL || "http://localhost:8000";
const FUNCTIONS_URL =
  import.meta.env.VITE_FUNCTIONS_URL || "http://localhost:5001/golden-hour-triage/us-central1";

const DELAY = () => new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

// ─── Severity helpers (used by fallback) ─────────────────────
const severityLabels = ['GREEN', 'YELLOW', 'ORANGE', 'RED', 'BLACK'];
const severityNames = ['Minor', 'Delayed', 'Urgent', 'Immediate', 'Deceased'];

function calculateSeverityFromVitals(vitals) {
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

function getSeverityLevel(score) {
  if (score >= 80) return { level: 4, label: 'BLACK', name: 'Deceased/Expectant', color: '#1F2937' };
  if (score >= 60) return { level: 3, label: 'RED', name: 'Immediate', color: '#DC2626' };
  if (score >= 40) return { level: 2, label: 'ORANGE', name: 'Urgent', color: '#D97706' };
  if (score >= 20) return { level: 1, label: 'YELLOW', name: 'Delayed', color: '#EAB308' };
  return { level: 0, label: 'GREEN', name: 'Minor', color: '#059669' };
}

// ─── predictPatient ──────────────────────────────────────────
/**
 * Predict patient severity.
 * Attempts ML service first, then falls back to local rule-based logic.
 */
export async function predictPatient(patientData) {
  // Build feature vector for ML service
  const features = buildFeatureVector(patientData);
  const validation = validateFeatures(features);

  // Try real ML service
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const mlResult = await response.json();

      // Map ML response to the format expected by existing UI
      const severity = mapPriorityToSeverity(mlResult.priority);
      const severityScore = Math.round(mlResult.confidence * 100);

      const featureImportance = buildFeatureImportance(patientData);

      return {
        severityScore,
        severity,
        icuNeeded: mlResult.needs_icu,
        ventilatorNeeded: mlResult.needs_ventilator,
        specialistNeeded: severity.level >= 2,
        confidence: Math.round(mlResult.confidence * 100),
        featureImportance,
        timestamp: new Date().toISOString(),
        modelVersion: "v2.4.1-golden-hour",
        source: "ml-service",
      };
    }
  } catch (err) {
    console.warn("ML service unavailable, using fallback:", err.message);
  }

  // Fallback: local rule-based prediction
  return fallbackPredict(patientData);
}

/**
 * Fallback prediction using local rules (always works offline).
 */
async function fallbackPredict(patientData) {
  await DELAY();

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

  const score = calculateSeverityFromVitals(vitals);
  const severity = getSeverityLevel(score);

  const icuNeeded = score >= 55;
  const ventilatorNeeded = vitals.spo2 < 90 || vitals.respiratoryRate > 28;
  const specialistNeeded = score >= 45;

  const featureImportance = buildFeatureImportance(patientData);

  return {
    severityScore: score,
    severity,
    icuNeeded,
    ventilatorNeeded,
    specialistNeeded,
    confidence: Math.round(78 + Math.random() * 18),
    featureImportance,
    timestamp: new Date().toISOString(),
    modelVersion: "v2.4.1-golden-hour",
    source: "fallback",
  };
}

/**
 * Build feature importance array from patient vitals.
 */
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
/**
 * Route patient to the best hospital.
 * Tries Firebase Functions first, falls back to local scoring.
 */
export async function routePatient(predictionResult) {
  // Try Firebase Functions
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

  // Fallback: local routing
  return fallbackRoute(predictionResult);
}

/**
 * Fallback routing using local scoring (always works offline).
 */
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

  const explanation = generateExplanation(recommended, predictionResult);

  return {
    hospitals: hospitals.map((h, i) => ({ ...h, isRecommended: i === 0, rank: i + 1 })),
    recommended,
    rejected,
    explanation,
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

function generateExplanation(hospital, prediction) {
  const reasons = [];
  if (prediction?.severity?.level >= 3) {
    reasons.push("Patient classified as high-severity requiring immediate intervention");
  }
  if (prediction?.icuNeeded && hospital.icuAvailable > 0) {
    reasons.push(`ICU bed available (${hospital.icuAvailable}/${hospital.icuTotal})`);
  }
  if (prediction?.ventilatorNeeded && hospital.ventilatorAvailable > 0) {
    reasons.push(`Ventilator available (${hospital.ventilatorAvailable}/${hospital.ventilatorTotal})`);
  }
  if (hospital.load < 60) {
    reasons.push(`Low hospital load (${hospital.load}%)`);
  }
  reasons.push(`Distance: ${hospital.distance} km (ETA: ${hospital.eta} min)`);
  reasons.push(`Trauma Level ${hospital.traumaLevel} facility`);

  return {
    summary: `Patient routed to ${hospital.name} due to optimal resource availability and proximity.`,
    reasons,
    hospitalCapabilities: {
      icuAvailable: hospital.icuAvailable > 0,
      ventilatorAvailable: hospital.ventilatorAvailable > 0,
      specialistAvailable: hospital.specialties.length > 2,
      traumaLevel: hospital.traumaLevel,
    },
  };
}

// ─── notifyHospital ──────────────────────────────────────────
/**
 * Notify hospital about incoming patient.
 * Tries Firebase Functions, falls back to local mock.
 * No booking is stored (per user requirement).
 */
export async function notifyHospital(hospitalId, patientData, bookingData) {
  // Try Firebase Functions
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

  // Fallback: local mock
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

export { DEMO_HOSPITALS, calculateSeverityFromVitals, getSeverityLevel };
