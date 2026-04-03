"""
Preprocessing utilities for patient feature vectors.
Transforms raw patient vitals into normalized feature arrays
suitable for the Gradient Boosting severity prediction model.
"""
import numpy as np


# Feature names in the order expected by the model
FEATURE_NAMES = [
    "heart_rate",
    "spo2",
    "respiratory_rate",
    "systolic_bp",
    "gcs",
]

# Normal reference ranges for vital signs
VITAL_RANGES = {
    "heart_rate":       {"min": 40,  "max": 180, "normal_low": 60,  "normal_high": 100},
    "spo2":             {"min": 50,  "max": 100, "normal_low": 95,  "normal_high": 100},
    "respiratory_rate": {"min": 4,   "max": 50,  "normal_low": 12,  "normal_high": 20},
    "systolic_bp":      {"min": 50,  "max": 250, "normal_low": 90,  "normal_high": 140},
    "gcs":              {"min": 3,   "max": 15,  "normal_low": 14,  "normal_high": 15},
}


def clamp(value: float, lo: float, hi: float) -> float:
    """Clamp a value between lo and hi."""
    return max(lo, min(hi, value))


def normalize_feature(value: float, feature_name: str) -> float:
    """Normalize a single feature to [0, 1] range using its vital range."""
    r = VITAL_RANGES[feature_name]
    clamped = clamp(value, r["min"], r["max"])
    return (clamped - r["min"]) / (r["max"] - r["min"])


def compute_abnormality_score(value: float, feature_name: str) -> float:
    """
    Compute how far a vital sign deviates from normal.
    Returns 0.0 (perfectly normal) to 1.0 (maximally abnormal).
    """
    r = VITAL_RANGES[feature_name]
    low, high = r["normal_low"], r["normal_high"]

    if low <= value <= high:
        return 0.0

    if value < low:
        deviation = (low - value) / (low - r["min"]) if low != r["min"] else 0
    else:
        deviation = (value - high) / (r["max"] - high) if r["max"] != high else 0

    return clamp(deviation, 0.0, 1.0)


def build_feature_vector(features: list[float]) -> np.ndarray:
    """
    Take a list of 5 raw feature values and return a 2D numpy array
    suitable for model.predict().

    Features order: [heart_rate, spo2, respiratory_rate, systolic_bp, gcs]
    """
    if len(features) != 5:
        raise ValueError(f"Expected 5 features, got {len(features)}")

    processed = []
    for val, name in zip(features, FEATURE_NAMES):
        processed.append(normalize_feature(float(val), name))

    return np.array([processed], dtype=np.float64)


def determine_resource_needs(features: list[float], priority: str) -> dict:
    """
    Determine ICU and ventilator needs based on raw features and predicted priority.
    """
    heart_rate = features[0]
    spo2 = features[1]
    respiratory_rate = features[2]
    systolic_bp = features[3]
    gcs = features[4]

    needs_icu = (
        priority in ("CRITICAL", "EMERGENCY")
        or gcs <= 8
        or systolic_bp < 80
        or (spo2 < 88 and respiratory_rate > 28)
    )

    needs_ventilator = (
        spo2 < 90
        or respiratory_rate > 30
        or (gcs <= 8 and spo2 < 92)
    )

    return {
        "needs_icu": needs_icu,
        "needs_ventilator": needs_ventilator,
    }
