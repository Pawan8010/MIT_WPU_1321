/**
 * routePatient — Hospital routing engine.
 *
 * Accepts patient prediction data + available hospitals,
 * scores each hospital based on distance, load, ICU/vent availability,
 * and returns the ranked list with the best match.
 */
const { getHospitals } = require("../services/hospitalService");
const { ROUTING_WEIGHTS, THRESHOLDS } = require("../utils/constraints");

/**
 * Score a single hospital against patient requirements.
 */
function scoreHospital(hospital, prediction) {
  let score = 0;

  // Distance score — closer is better
  const distScore = Math.max(0, ROUTING_WEIGHTS.DISTANCE - hospital.distance * 3);
  score += distScore;

  // Load score — lower load is better
  const loadScore = Math.max(0, ROUTING_WEIGHTS.LOAD - hospital.load * 0.25);
  score += loadScore;

  // ICU availability
  if (prediction.needs_icu) {
    score += hospital.icuAvailable > 0 ? ROUTING_WEIGHTS.ICU : -30;
  }

  // Ventilator availability
  if (prediction.needs_ventilator) {
    score += hospital.ventilatorAvailable > 0 ? ROUTING_WEIGHTS.VENTILATOR : -25;
  }

  // Specialist availability
  if (prediction.needs_specialist) {
    const hasCardio = hospital.specialties.includes("Cardiology");
    const hasNeuro = hospital.specialties.includes("Neurology");
    score += (hasCardio ? ROUTING_WEIGHTS.SPECIALIST : 0);
    score += (hasNeuro ? ROUTING_WEIGHTS.SPECIALIST : 0);
  }

  // Trauma level bonus (Level 1 is best)
  score += (4 - (hospital.traumaLevel || 3)) * ROUTING_WEIGHTS.TRAUMA_LEVEL;

  return Math.max(0, score);
}

/**
 * Generate an explanation for why a hospital was selected.
 */
function generateExplanation(hospital, prediction) {
  const reasons = [];

  if (prediction.priority === "CRITICAL" || prediction.priority === "EMERGENCY") {
    reasons.push("Patient classified as high-severity requiring immediate intervention");
  }
  if (prediction.needs_icu && hospital.icuAvailable > 0) {
    reasons.push(`ICU bed available (${hospital.icuAvailable}/${hospital.icuTotal})`);
  }
  if (prediction.needs_ventilator && hospital.ventilatorAvailable > 0) {
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
      specialistAvailable: (hospital.specialties || []).length > 2,
      traumaLevel: hospital.traumaLevel,
    },
  };
}

/**
 * Main routing handler.
 *
 * @param {object} req.body - { patient, prediction }
 *   prediction: { needs_icu, needs_ventilator, needs_specialist, priority }
 */
async function handleRoutePatient(req, res) {
  try {
    const { prediction } = req.body;

    if (!prediction) {
      return res.status(400).json({ error: "Missing prediction data" });
    }

    // Fetch hospitals
    const hospitals = await getHospitals();

    // Score each hospital
    const scored = hospitals.map((h) => ({
      ...h,
      routingScore: scoreHospital(h, prediction),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.routingScore - a.routingScore);

    // Rank them
    const ranked = scored.map((h, i) => ({
      ...h,
      isRecommended: i === 0,
      rank: i + 1,
    }));

    const recommended = ranked[0];

    // Find rejected hospitals
    const rejected = ranked
      .filter((h) => h.routingScore < THRESHOLDS.MIN_ROUTING_SCORE)
      .map((h) => ({
        name: h.name,
        reasons: [
          h.icuAvailable === 0 && prediction.needs_icu ? "No ICU beds available" : null,
          h.ventilatorAvailable === 0 && prediction.needs_ventilator ? "No ventilators available" : null,
          h.load > THRESHOLDS.HIGH_LOAD_PERCENT ? "Hospital at high capacity" : null,
        ].filter(Boolean),
      }));

    const explanation = generateExplanation(recommended, prediction);

    return res.status(200).json({
      hospitals: ranked,
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
    });
  } catch (error) {
    console.error("Routing error:", error);
    return res.status(500).json({ error: "Routing failed: " + error.message });
  }
}

module.exports = { handleRoutePatient, scoreHospital };
