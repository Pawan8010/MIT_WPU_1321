/**
 * notifyHospital — Notification endpoint.
 *
 * Generates a confirmation that the hospital has been notified.
 * No booking is persisted to Firestore (per user requirement).
 */
const { createBookingConfirmation } = require("../services/bookingService");

/**
 * Handle hospital notification.
 *
 * @param {object} req.body - {
 *   patient_id, hospital_id, hospital_name, needs_icu, eta
 * }
 */
async function handleNotifyHospital(req, res) {
  try {
    const { patient_id, hospital_id, hospital_name, needs_icu, eta } = req.body;

    if (!hospital_id && !hospital_name) {
      return res.status(400).json({ error: "Missing hospital information" });
    }

    // Generate confirmation (in-memory, no Firestore storage)
    const confirmation = createBookingConfirmation({
      patient_id,
      hospital_id,
      hospital_name,
      needs_icu: needs_icu || false,
      eta: eta || 15,
    });

    return res.status(200).json({
      success: true,
      bookingId: confirmation.bookingId,
      hospitalId: hospital_id,
      status: confirmation.status,
      estimatedArrival: new Date(
        Date.now() + (eta || 15) * 60000
      ).toISOString(),
      notifiedAt: new Date().toISOString(),
      message: `Hospital ${hospital_name || "Selected"} has been notified and is preparing for patient arrival.`,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return res.status(500).json({
      error: "Failed to notify hospital: " + error.message,
    });
  }
}

module.exports = { handleNotifyHospital };
