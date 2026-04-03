/**
 * Severity utility functions.
 * Maps priority labels from the ML service to UI-friendly severity objects.
 */

/**
 * Map ML priority string to a severity object with color and display info.
 *
 * @param {string} priority - ML model output: LOW | MODERATE | HIGH | EMERGENCY | CRITICAL
 * @returns {{ level: number, label: string, name: string, color: string }}
 */
export function mapPriorityToSeverity(priority) {
  const map = {
    LOW: {
      level: 0,
      label: "GREEN",
      name: "Minor",
      color: "#059669",
    },
    MODERATE: {
      level: 1,
      label: "YELLOW",
      name: "Delayed",
      color: "#EAB308",
    },
    HIGH: {
      level: 2,
      label: "ORANGE",
      name: "Urgent",
      color: "#D97706",
    },
    EMERGENCY: {
      level: 3,
      label: "RED",
      name: "Immediate",
      color: "#DC2626",
    },
    CRITICAL: {
      level: 4,
      label: "BLACK",
      name: "Deceased/Expectant",
      color: "#1F2937",
    },
  };

  return map[priority] || map.MODERATE;
}

/**
 * Get a severity badge color for CSS styling.
 */
export function getSeverityColor(label) {
  const colors = {
    GREEN: "#059669",
    YELLOW: "#EAB308",
    ORANGE: "#D97706",
    RED: "#DC2626",
    BLACK: "#1F2937",
    LOW: "#059669",
    MODERATE: "#EAB308",
    HIGH: "#D97706",
    EMERGENCY: "#DC2626",
    CRITICAL: "#1F2937",
  };
  return colors[label] || "#94A3B8";
}

/**
 * Determine if a severity level requires immediate action.
 */
export function isHighSeverity(priority) {
  return ["HIGH", "EMERGENCY", "CRITICAL", "RED", "BLACK", "ORANGE"].includes(
    priority
  );
}
