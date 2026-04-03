"""
Golden-Hour Emergency Triage — FastAPI ML Service

Exposes a POST /predict endpoint that accepts patient vital signs
and returns severity prediction, resource needs, and confidence score.
"""
import os
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List

from utils.preprocess import (
    build_feature_vector,
    determine_resource_needs,
    FEATURE_NAMES,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Golden-Hour Triage ML Service",
    version="1.0.0",
    description="Severity prediction for emergency triage patients",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load model
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "model.pkl")

model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"✓ Model loaded from {MODEL_PATH}")
    else:
        print(f"⚠ No model found at {MODEL_PATH} — will use rule-based fallback")
        model = None

load_model()

# ---------------------------------------------------------------------------
# Priority mapping
# ---------------------------------------------------------------------------
PRIORITY_MAP = {
    0: "LOW",
    1: "MODERATE",
    2: "HIGH",
    3: "EMERGENCY",
    4: "CRITICAL",
}

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    features: List[float] = Field(
        ...,
        min_length=5,
        max_length=5,
        description="Patient vital signs: [heart_rate, spo2, respiratory_rate, systolic_bp, gcs]",
        examples=[[110, 89, 28, 85, 7]],
    )

class PredictResponse(BaseModel):
    needs_icu: bool
    needs_ventilator: bool
    priority: str
    confidence: float
    feature_names: List[str] = FEATURE_NAMES

# ---------------------------------------------------------------------------
# Rule-based fallback predictor
# ---------------------------------------------------------------------------
def rule_based_predict(features: List[float]) -> tuple[int, float]:
    """Fallback predictor when no ML model is available."""
    heart_rate, spo2, resp_rate, systolic_bp, gcs = features

    score = 0
    if heart_rate > 120 or heart_rate < 50:
        score += 25
    elif heart_rate > 100 or heart_rate < 60:
        score += 12

    if spo2 < 88:
        score += 30
    elif spo2 < 92:
        score += 20
    elif spo2 < 95:
        score += 10

    if resp_rate > 30 or resp_rate < 8:
        score += 25
    elif resp_rate > 24 or resp_rate < 12:
        score += 12

    if systolic_bp < 80 or systolic_bp > 200:
        score += 25
    elif systolic_bp < 90 or systolic_bp > 180:
        score += 15

    if gcs <= 8:
        score += 30
    elif gcs <= 12:
        score += 15
    elif gcs <= 14:
        score += 5

    if score >= 80:
        return 4, 0.88
    elif score >= 60:
        return 3, 0.85
    elif score >= 40:
        return 2, 0.82
    elif score >= 20:
        return 1, 0.80
    else:
        return 0, 0.90

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "service": "Golden-Hour Triage ML Service",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": model is not None,
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Predict patient severity from vital signs.

    Input features (list of 5 floats):
      [heart_rate, spo2, respiratory_rate, systolic_bp, gcs]

    Returns:
      - needs_icu: whether patient needs ICU
      - needs_ventilator: whether patient needs ventilator
      - priority: LOW | MODERATE | HIGH | EMERGENCY | CRITICAL
      - confidence: prediction confidence (0-1)
    """
    try:
        features = request.features

        if model is not None:
            # Use trained ML model
            feature_vector = build_feature_vector(features)
            prediction = int(model.predict(feature_vector)[0])

            # Get probability for confidence
            probabilities = model.predict_proba(feature_vector)[0]
            confidence = float(round(max(probabilities), 4))
        else:
            # Rule-based fallback
            prediction, confidence = rule_based_predict(features)

        priority = PRIORITY_MAP.get(prediction, "MODERATE")
        resources = determine_resource_needs(features, priority)

        return PredictResponse(
            needs_icu=resources["needs_icu"],
            needs_ventilator=resources["needs_ventilator"],
            priority=priority,
            confidence=confidence,
            feature_names=FEATURE_NAMES,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
