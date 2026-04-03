/**
 * featureBuilder — transforms patient form data into the 5-element
 * feature vector expected by the ML /predict endpoint.
 *
 * Feature order: [heart_rate, spo2, respiratory_rate, systolic_bp, gcs]
 */

/**
 * Build a 5-element feature array from patient form data.
 *
 * @param {object} patientData - full patient form state from the store
 * @returns {number[]} 5-element feature vector
 */
export function buildFeatureVector(patientData) {
  return [
    parseFloat(patientData.heartRate) || 80,
    parseFloat(patientData.spo2) || 98,
    parseFloat(patientData.respiratoryRate) || 16,
    parseFloat(patientData.systolicBP) || 120,
    parseFloat(patientData.gcs) || 15,
  ];
}

/**
 * Validate that the feature vector has reasonable values.
 *
 * @param {number[]} features - 5-element feature array
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFeatures(features) {
  const errors = [];
  const [hr, spo2, rr, sbp, gcs] = features;

  if (hr < 20 || hr > 300) errors.push("Heart rate out of range (20-300)");
  if (spo2 < 0 || spo2 > 100) errors.push("SpO2 out of range (0-100)");
  if (rr < 0 || rr > 80) errors.push("Respiratory rate out of range (0-80)");
  if (sbp < 0 || sbp > 350) errors.push("Systolic BP out of range (0-350)");
  if (gcs < 3 || gcs > 15) errors.push("GCS out of range (3-15)");

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get human-readable feature labels.
 */
export const FEATURE_LABELS = [
  "Heart Rate (bpm)",
  "SpO2 (%)",
  "Respiratory Rate (/min)",
  "Systolic BP (mmHg)",
  "GCS Score",
];
