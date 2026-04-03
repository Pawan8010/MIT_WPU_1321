/**
 * Booking Service — simplified, no Firestore persistence.
 * Returns a confirmation response for the notification flow only.
 */
const { BOOKING_STATUS } = require("../utils/constraints");

/**
 * Generate a booking confirmation (in-memory only, no storage).
 */
function createBookingConfirmation(data) {
  return {
    success: true,
    bookingId: "BK-" + Date.now().toString(36).toUpperCase(),
    patient_id: data.patient_id || `PT-${Date.now()}`,
    hospital_id: data.hospital_id || "",
    hospital_name: data.hospital_name || "",
    needs_icu: data.needs_icu || false,
    status: BOOKING_STATUS.EN_ROUTE,
    eta: data.eta || 15,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { createBookingConfirmation };
