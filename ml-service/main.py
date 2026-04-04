import os
import sys
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Ensure the subfolder is in the python path
sys.path.append(os.path.join(os.path.dirname(__file__), "emergency_triage_ml"))

try:
    from emergency_triage_ml.src.predict import predict
except ImportError:
    try:
        from src.predict import predict
    except:
        sys.path.append(os.path.join(os.path.dirname(__file__), "emergency_triage_ml", "src"))
        from predict import predict

app = FastAPI(title="Emergency Triage ML Service", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientData(BaseModel):
    payload: dict | list[float]

# ─── GRADING ENGINE ───────────────────────────────────────────
def grade_spo2(val):
    n = float(val or 0)
    if n >= 98: return 0
    if n >= 95: return 1
    if n >= 92: return 2
    if n >= 90: return 3
    if n >= 85: return 4
    return 5

def grade_hr(val):
    n = float(val or 0)
    if 60 <= n <= 100: return 0
    if (50 <= n < 60) or (100 < n <= 110): return 1
    if (40 <= n < 50) or (110 < n <= 130): return 2
    if (30 <= n < 40) or (130 < n <= 150): return 3
    if n < 30 or (150 < n <= 180): return 4
    return 5

def grade_bp(val):
    n = float(val or 0)
    if 90 <= n <= 139: return 0
    if 140 <= n <= 159: return 1
    if (80 <= n < 90) or (160 <= n <= 179): return 2
    if (70 <= n < 80) or (180 <= n <= 199): return 3
    if (60 <= n < 70) or (200 <= n <= 219): return 4
    return 5

def grade_rr(val):
    n = float(val or 0)
    if 12 <= n <= 20: return 0
    if (21 <= n <= 24) or (10 <= n < 12): return 1
    if (25 <= n <= 30) or (8 <= n < 10): return 2
    if (31 <= n <= 40) or n < 8: return 4
    return 5

# ─── ENDPOINTS ────────────────────────────────────────────────
@app.get("/")
def home():
    return {"status": "ok", "version": "3.1.0"}

@app.post("/predict")
def run_prediction(data: PatientData):
    try:
        if isinstance(data.payload, dict):
            raw = data.payload
            
            # Map frontend raw data to modeled levels
            mapped = {
                "Gender": str(raw.get("gender", "Male")).capitalize(),
                "Pregnancy_Status": 1 if raw.get("pregnancy") else 0,
                
                # Dynamic Levels (calculated here for accuracy)
                "Pain_Level": int(raw.get("pain", 0)),
                "Breathing_Difficulty": int(raw.get("breathingDifficulty", 0)),
                "GCS": int(raw.get("gcs", 15)),
                "Heart_Rate": grade_hr(raw.get("heartRate", 80)),
                "Blood_Pressure": grade_bp(raw.get("systolicBP", 120)),
                "Respiratory_Rate": grade_rr(raw.get("respiratoryRate", 16)),
                "SpO2": grade_spo2(raw.get("spo2", 98)),
                
                "Body_Temperature": float(raw.get("temperature", 37.0)),
                "Blood_Glucose": float(raw.get("glucose", 100.0)),
                
                # Clinical flags
                "Bleeding_Severity": 1 if raw.get("bleeding") != "none" else 0,
                "Skin_Circulation": 1 if raw.get("skinCondition") != "normal" else 0,
                "Capillary_Refill": 1 if raw.get("capillaryRefill") != "normal" else 0,
                "Seizure": 1 if raw.get("seizureActivity") else 0,
                "Slurred_Speech": 1 if raw.get("slurredSpeech") else 0,
                "Vision_Changes": 1 if raw.get("visionChanges") else 0,
                "Facial_Droop": 1 if raw.get("facialDroop") else 0,
                "Arm_Weakness": 1 if raw.get("armWeakness") else 0,
                "Numbness_Tingling": 1 if raw.get("sensoryDeficit") else 0,
                "Chest_Pain": int(raw.get("chestPainLevel", 0)),
                "ECG_Result": str(raw.get("ecgResult", "Normal")).capitalize(),
                "Pulse_Deficit": 0,
                "Shortness_of_Breath": 1 if raw.get("dyspnea") else 0,
                "Airway_Status": 1 if raw.get("airwayStatus") != "patent" else 0,
                "Airway_Sounds": 1 if raw.get("breathSounds") != "clear" else 0,
                "Breathing_Sounds": 1 if raw.get("breathSounds") != "clear" else 0,
                "Abdominal_Pain": 1 if raw.get("abdominalPain") else 0,
                "Abdominal_Tenderness": 1 if raw.get("abdominalGuard") else 0,
                "Abdominal_Hardness": 0,
                "Nausea_Vomiting": 1 if (raw.get("nausea") or raw.get("vomiting")) else 0,
                "Injury_Severity": 1 if raw.get("laceration") or raw.get("fracture") else 0,
                "Trauma_Score": 0,
                "Mechanism_of_Injury": str(raw.get("traumaMechanism", "Fall")).capitalize(),
                "C_Spine_Injury": 1 if raw.get("spinalInjury") else 0,
                "Extremity_Deformity": 1 if raw.get("deformity") else 0,
                "Burn_Percentage": float(raw.get("burnTBSA", 0)),
                "Burn_Degree": str(raw.get("burnDegree", "1st")).lower(),
                "Smoke_Inhalation": 1 if raw.get("airwayBurn") else 0,
                "Head_Neck_Abnormality": 1 if raw.get("headInjury") else 0,
                "Chest_Abnormality": 0,
                "Skin_Issues": 1 if raw.get("cyanosis") else 0,
                "Weakness": 1 if raw.get("fatigue") else 0,
                "Fatigue": 1 if raw.get("fatigue") else 0,
                "Fever": 1 if raw.get("fever") else 0,
                "Chills": 1 if raw.get("chills") else 0,
                "Dizziness": 1 if raw.get("dizziness") else 0,
                "Headache": 1 if raw.get("headache") else 0,
                "Hypothermia_Risk": 1 if raw.get("exposureHypothermia") else 0,
                "Pupils": 1 if (raw.get("pupilReaction") and raw.get("pupilReaction") != "normal") else 0,
                "Movement": 1 if (raw.get("motorResponse") and raw.get("motorResponse") != "normal") else 0,
                "Response_to_Treatment": 1 if raw.get("responseToTreatment") == "improving" else 0,
                "Overall_Patient_Condition": 3,
                "EMT_Clinical_Judgment": 3,
                "Time_Since_Symptom_Onset": 30.0,
                "EmergencyType": str(raw.get("emergencyType", "General")).capitalize()
            }
            
            old_cwd = os.getcwd()
            os.chdir(os.path.join(os.path.dirname(__file__), "emergency_triage_ml"))
            try:
                result = predict(mapped)
            finally:
                os.chdir(old_cwd)
                
            priority_map = {
                "Critical": "CRITICAL", "Severe": "EMERGENCY", "Moderate": "HIGH", "Mild": "MODERATE", "Minimal": "LOW"
            }
            
            return {
                "priority": priority_map.get(result.get("SeverityLabel"), "HIGH"),
                "needs_icu": result.get("ICU") == "Yes",
                "needs_ventilator": result.get("Ventilator") == "Yes",
                "score": result.get("SeverityScore"),
                "details": result
            }

        # Legacy fallback
        if isinstance(data.payload, list):
            f = data.payload
            score = sum(f) / len(f) if f else 0
            if score >= 4: return {"priority": "CRITICAL", "needs_icu": True, "needs_ventilator": True}
            if score >= 3: return {"priority": "EMERGENCY", "needs_icu": True, "needs_ventilator": False}
            return {"priority": "HIGH", "needs_icu": False, "needs_ventilator": False}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
