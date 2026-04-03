"""
Training script for the Golden-Hour Emergency Triage severity prediction model.
Trains a Gradient Boosting Classifier on synthetic patient vital-sign data
and saves the trained model as model.pkl.
"""
import os
import sys
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# Ensure the parent directory is on the path so we can import utils
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

PRIORITY_LABELS = ["LOW", "MODERATE", "HIGH", "EMERGENCY", "CRITICAL"]

np.random.seed(42)


def generate_synthetic_data(n_samples: int = 5000):
    """
    Generate synthetic patient data with 5 features:
      0 - heart_rate   (40-180 bpm)
      1 - spo2         (50-100 %)
      2 - resp_rate    (4-50 /min)
      3 - systolic_bp  (50-250 mmHg)
      4 - gcs          (3-15)

    Labels (0-4) are derived from a rule-based scoring system
    that mimics real triage logic.
    """
    heart_rate = np.random.normal(82, 25, n_samples).clip(40, 180)
    spo2 = np.random.normal(96, 5, n_samples).clip(50, 100)
    resp_rate = np.random.normal(17, 7, n_samples).clip(4, 50)
    systolic_bp = np.random.normal(125, 30, n_samples).clip(50, 250)
    gcs = np.random.normal(13, 3, n_samples).clip(3, 15).astype(int)

    X = np.column_stack([heart_rate, spo2, resp_rate, systolic_bp, gcs])

    # Rule-based labeling
    scores = np.zeros(n_samples)

    # Heart rate scoring
    scores += np.where((heart_rate > 120) | (heart_rate < 50), 25,
              np.where((heart_rate > 100) | (heart_rate < 60), 12, 0))

    # SpO2 scoring
    scores += np.where(spo2 < 88, 30,
              np.where(spo2 < 92, 20,
              np.where(spo2 < 95, 10, 0)))

    # Respiratory rate scoring
    scores += np.where((resp_rate > 30) | (resp_rate < 8), 25,
              np.where((resp_rate > 24) | (resp_rate < 12), 12, 0))

    # Systolic BP scoring
    scores += np.where((systolic_bp < 80) | (systolic_bp > 200), 25,
              np.where((systolic_bp < 90) | (systolic_bp > 180), 15, 0))

    # GCS scoring
    scores += np.where(gcs <= 8, 30,
              np.where(gcs <= 12, 15,
              np.where(gcs <= 14, 5, 0)))

    # Map scores to priority labels (0-4)
    y = np.where(scores >= 80, 4,    # CRITICAL
         np.where(scores >= 60, 3,    # EMERGENCY
         np.where(scores >= 40, 2,    # HIGH
         np.where(scores >= 20, 1,    # MODERATE
                                0)))) # LOW

    return X, y


def normalize_features(X: np.ndarray) -> np.ndarray:
    """Normalize features to [0, 1] using known vital sign ranges."""
    ranges = np.array([
        [40, 180],   # heart_rate
        [50, 100],   # spo2
        [4, 50],     # resp_rate
        [50, 250],   # systolic_bp
        [3, 15],     # gcs
    ])
    mins = ranges[:, 0]
    maxs = ranges[:, 1]
    return (X - mins) / (maxs - mins)


def main():
    print("=" * 60)
    print("Golden-Hour Triage — Model Training")
    print("=" * 60)

    # Generate data
    print("\n[1/4] Generating synthetic training data...")
    X_raw, y = generate_synthetic_data(8000)
    X = normalize_features(X_raw)
    print(f"  → Generated {len(X)} samples with {X.shape[1]} features")
    print(f"  → Label distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

    # Split
    print("\n[2/4] Splitting into train/test sets (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  → Train: {len(X_train)}, Test: {len(X_test)}")

    # Train
    print("\n[3/4] Training Gradient Boosting Classifier...")
    model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        min_samples_split=10,
        min_samples_leaf=5,
        subsample=0.9,
        random_state=42,
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n  ✓ Training complete!")
    print(f"  → Accuracy: {accuracy:.4f}")
    print(f"\n  Classification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=PRIORITY_LABELS,
        zero_division=0,
    ))

    # Feature importance
    importances = model.feature_importances_
    feature_names = ["heart_rate", "spo2", "respiratory_rate", "systolic_bp", "gcs"]
    print("  Feature Importances:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        bar = "█" * int(imp * 50)
        print(f"    {name:20s} {imp:.4f} {bar}")

    # Save model
    print("\n[4/4] Saving model...")
    model_dir = os.path.join(os.path.dirname(__file__), "..", "model")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "model.pkl")
    joblib.dump(model, model_path)
    print(f"  ✓ Model saved to {model_path}")
    print(f"  → File size: {os.path.getsize(model_path) / 1024:.1f} KB")
    print("\n" + "=" * 60)
    print("Done! Model ready for deployment.")
    print("=" * 60)


if __name__ == "__main__":
    main()
