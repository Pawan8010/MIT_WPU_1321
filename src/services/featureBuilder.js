/**
 * featureBuilder.js
 * ==================
 * Converts the rich patientData object (from EMTForm / Zustand store)
 * into the 8-element numeric feature array expected by the FastAPI
 * /predict endpoint.
 *
 * Feature order (0-5 scale, 5 = most severe):
 *  [0] pain_level
 *  [1] spo2_grade
 *  [2] bp_grade
 *  [3] heart_rate_grade
 *  [4] gcs_grade
 *  [5] bleeding_severity
 *  [6] injury_severity
 *  [7] overall_condition
 */

// ── Helpers ────────────────────────────────────────────────────────────

/** Clamp value to [0, 5] and round to nearest integer. */
const grade = (val) => Math.min(5, Math.max(0, Math.round(Number(val) || 0)));

/** Grade SpO2 % → 0 (100%) to 5 (<85%). Higher = worse oxygenation. */
const gradeSpo2 = (spo2) => {
  const n = Number(spo2);
  if (!n || isNaN(n)) return 0;
  if (n >= 98) return 0;
  if (n >= 95) return 1;
  if (n >= 92) return 2;
  if (n >= 90) return 3;
  if (n >= 85) return 4;
  return 5;
};

/**
 * Grade blood pressure from systolic mmHg → 0 (normal) to 5 (critical).
 * Both hypotension (<90) and severe hypertension (>180) are dangerous.
 */
const gradeBP = (bp) => {
  const n = Number(bp);
  if (!n || isNaN(n)) return 0;
  if (n >= 90 && n <= 139) return 0;   // Normal
  if (n >= 140 && n <= 159) return 1;  // Elevated
  if ((n >= 80 && n < 90) || (n >= 160 && n <= 179)) return 2;  // High/Low
  if ((n >= 70 && n < 80) || (n >= 180 && n <= 199)) return 3;  // Danger
  if ((n >= 60 && n < 70) || (n >= 200 && n <= 219)) return 4;  // Critical
  return 5;                            // Shock / Hypertensive emergency
};

/** Grade heart rate (bpm) → 0 (normal) to 5 (critical). */
const gradeHR = (hr) => {
  const n = Number(hr);
  if (!n || isNaN(n)) return 0;
  if (n >= 60 && n <= 100) return 0;
  if ((n >= 50 && n < 60) || (n > 100 && n <= 110)) return 1;
  if ((n >= 40 && n < 50) || (n > 110 && n <= 130)) return 2;
  if ((n >= 30 && n < 40) || (n > 130 && n <= 150)) return 3;
  if (n < 30 || (n > 150 && n <= 180)) return 4;
  return 5;                            // Extreme arrhythmia / arrest
};

/** Grade Glasgow Coma Scale (3–15) → 0 (normal) to 5 (unresponsive). */
const gradeGCS = (gcs) => {
  const n = Number(gcs);
  if (!n || isNaN(n)) return 0;
  if (n === 15) return 0;
  if (n >= 13) return 1;
  if (n >= 11) return 2;
  if (n >= 9)  return 3;
  if (n >= 7)  return 4;
  return 5;                            // Deep coma / brain stem herniation
};

// ── Main export ────────────────────────────────────────────────────────

/**
 * Build the 8-element numeric feature array from patientData.
 *
 * @param {Object} patientData - Zustand store patient object
 * @returns {number[]} 8-element array, each value 0-5
 */
export function buildFeatures(patientData) {
  if (!patientData || typeof patientData !== 'object') {
    return [0, 0, 0, 0, 0, 0, 0, 0];
  }

  const pain     = grade(patientData.painLevel ?? patientData.pain_level ?? 0);
  const spo2     = gradeSpo2(patientData.spo2 ?? patientData.oxygenSaturation ?? patientData.oxygen_saturation);
  const bp       = gradeBP(patientData.systolicBP ?? patientData.bloodPressure ?? patientData.blood_pressure ?? patientData.bp);
  const hr       = gradeHR(patientData.heartRate ?? patientData.heart_rate ?? patientData.pulse);
  const gcs      = gradeGCS(patientData.gcs ?? patientData.glasgowComaScale ?? patientData.glasgow);
  const bleeding = grade(patientData.bleedingSeverity ?? patientData.bleeding_severity ?? patientData.bleeding ?? 0);
  const injury   = grade(patientData.injurySeverity ?? patientData.injury_severity ?? patientData.injuryLevel ?? 0);

  // Overall condition: average of all signals (rounded to 0-5)
  const overall  = grade((pain + spo2 + bp + hr + gcs + bleeding + injury) / 7);

  return [pain, spo2, bp, hr, gcs, bleeding, injury, overall];
}
