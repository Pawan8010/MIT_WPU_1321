/**
 * Constraint constants used by the hospital routing engine.
 * These define weights, thresholds, and scoring parameters.
 */

const ROUTING_WEIGHTS = {
  DISTANCE: 30,       // Max points for proximity
  LOAD: 25,           // Max points for low hospital load
  ICU: 20,            // Points for ICU availability
  VENTILATOR: 15,     // Points for ventilator availability
  SPECIALIST: 10,     // Points per matching specialty
  TRAUMA_LEVEL: 5,    // Points per trauma level (lower = better)
};

const THRESHOLDS = {
  MAX_DISTANCE_KM: 25,          // Maximum acceptable distance
  HIGH_LOAD_PERCENT: 80,        // Hospital considered "full"
  CRITICAL_LOAD_PERCENT: 95,    // Hospital at critical capacity
  MIN_ROUTING_SCORE: 10,        // Minimum score to be considered
};

const PRIORITY_LEVELS = {
  LOW: 0,
  MODERATE: 1,
  HIGH: 2,
  EMERGENCY: 3,
  CRITICAL: 4,
};

const BOOKING_STATUS = {
  PENDING: "PENDING",
  EN_ROUTE: "EN_ROUTE",
  ARRIVED: "ARRIVED",
  ADMITTED: "ADMITTED",
  CANCELLED: "CANCELLED",
};

module.exports = {
  ROUTING_WEIGHTS,
  THRESHOLDS,
  PRIORITY_LEVELS,
  BOOKING_STATUS,
};
