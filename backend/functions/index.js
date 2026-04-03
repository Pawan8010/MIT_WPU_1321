/**
 * Firebase Cloud Functions — Entry Point
 *
 * Exposes HTTP endpoints for:
 *   - POST /routePatient  → hospital routing engine
 *   - POST /notifyHospital → hospital notification
 *   - GET  /hospitals      → list hospitals
 *   - POST /seedHospitals  → seed default hospital data
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Firebase Admin
admin.initializeApp();

const corsHandler = cors({ origin: true });

// Import route handlers
const { handleRoutePatient } = require("./routes/routePatient");
const { handleNotifyHospital } = require("./routes/notifyHospital");
const { getHospitals, seedHospitals } = require("./services/hospitalService");

// ──────────────────────────────────────────────────────────────
// Route Patient — POST /routePatient
// ──────────────────────────────────────────────────────────────
exports.routePatient = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    return handleRoutePatient(req, res);
  });
});

// ──────────────────────────────────────────────────────────────
// Notify Hospital — POST /notifyHospital
// ──────────────────────────────────────────────────────────────
exports.notifyHospital = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    return handleNotifyHospital(req, res);
  });
});

// ──────────────────────────────────────────────────────────────
// List Hospitals — GET /hospitals
// ──────────────────────────────────────────────────────────────
exports.hospitals = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    try {
      const hospitals = await getHospitals();
      return res.status(200).json({ hospitals });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Seed Hospitals — POST /seedHospitals
// ──────────────────────────────────────────────────────────────
exports.seedHospitals = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    try {
      const result = await seedHospitals();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});
