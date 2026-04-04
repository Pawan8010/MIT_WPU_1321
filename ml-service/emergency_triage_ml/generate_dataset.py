import pandas as pd
import numpy as np
import os

np.random.seed(42)
rows = 5000
data = []

for _ in range(rows):
    # -------------------------------
    # BASIC INPUTS
    # -------------------------------
    gender = np.random.choice(["Male", "Female"])
    pregnancy = 1 if gender == "Female" and np.random.rand() < 0.1 else 0

    pain = np.random.randint(0, 6)
    breath = np.random.randint(0, 6)
    gcs = np.random.randint(8, 16)
    hr = np.random.randint(0, 6)
    bp = np.random.randint(0, 6)
    rr = np.random.randint(0, 6)
    spo2 = np.random.randint(0, 6)

    emergency = np.random.choice([
        "Cardiac", "Trauma", "Respiratory",
        "Neurological", "Pediatric", "Obstetric", "Burn"
    ])

    # -------------------------------
    # SEVERITY LOGIC (IMPORTANT)
    # -------------------------------
    severity = int(np.clip((pain + breath + (5 - spo2) + (5 - gcs / 3)) / 4, 0, 5))

    if severity <= 1:
        label = "Minimal"
    elif severity == 2:
        label = "Mild"
    elif severity == 3:
        label = "Moderate"
    elif severity == 4:
        label = "Severe"
    else:
        label = "Critical"

    # -------------------------------
    # CORE OUTPUTS
    # -------------------------------
    ICU = 1 if severity >= 4 else 0
    Ventilator = 1 if breath >= 4 else 0
    CT = 1 if emergency == "Neurological" else 0
    MRI = 1 if emergency == "Neurological" else 0

    # -------------------------------
    # FULL HOSPITAL RESOURCE LOGIC
    # -------------------------------
    row = {
        # INPUT FEATURES
        "Gender": gender,
        "Pregnancy_Status": pregnancy,
        "Pain_Level": pain,
        "Breathing_Difficulty": breath,
        "GCS": gcs,
        "Heart_Rate": hr,
        "Blood_Pressure": bp,
        "Respiratory_Rate": rr,
        "SpO2": spo2,
        "Body_Temperature": 36 + np.random.rand() * 2,
        "Blood_Glucose": 80 + np.random.rand() * 100,
        "Bleeding_Severity": np.random.randint(0, 6),
        "Skin_Circulation": np.random.randint(0, 6),
        "Capillary_Refill": np.random.randint(0, 6),
        "Seizure": np.random.randint(0, 6),
        "Slurred_Speech": np.random.randint(0, 6),
        "Vision_Changes": np.random.randint(0, 6),
        "Facial_Droop": np.random.randint(0, 6),
        "Arm_Weakness": np.random.randint(0, 6),
        "Numbness_Tingling": np.random.randint(0, 6),
        "Chest_Pain": np.random.randint(0, 6),
        "ECG_Result": np.random.choice(["Normal", "Abnormal"]),
        "Pulse_Deficit": np.random.randint(0, 6),
        "Shortness_of_Breath": np.random.randint(0, 6),
        "Airway_Status": np.random.randint(0, 6),
        "Airway_Sounds": np.random.randint(0, 6),
        "Breathing_Sounds": np.random.randint(0, 6),
        "Abdominal_Pain": np.random.randint(0, 6),
        "Abdominal_Tenderness": np.random.randint(0, 6),
        "Abdominal_Hardness": np.random.randint(0, 6),
        "Nausea_Vomiting": np.random.randint(0, 6),
        "Injury_Severity": np.random.randint(0, 6),
        "Trauma_Score": np.random.randint(0, 6),
        "Mechanism_of_Injury": np.random.choice(["Fall", "Accident", "Assault"]),
        "C_Spine_Injury": np.random.randint(0, 6),
        "Extremity_Deformity": np.random.randint(0, 6),
        "Burn_Percentage": np.random.randint(0, 100),
        "Burn_Degree": np.random.choice(["1st", "2nd", "3rd"]),
        "Smoke_Inhalation": np.random.randint(0, 6),
        "Head_Neck_Abnormality": np.random.randint(0, 6),
        "Chest_Abnormality": np.random.randint(0, 6),
        "Skin_Issues": np.random.randint(0, 6),
        "Weakness": np.random.randint(0, 6),
        "Fatigue": np.random.randint(0, 6),
        "Fever": np.random.randint(0, 6),
        "Chills": np.random.randint(0, 6),
        "Dizziness": np.random.randint(0, 6),
        "Headache": np.random.randint(0, 6),
        "Hypothermia_Risk": np.random.randint(0, 6),
        "Pupils": np.random.randint(0, 6),
        "Movement": np.random.randint(0, 6),
        "Response_to_Treatment": np.random.randint(0, 6),
        "Overall_Patient_Condition": np.random.randint(0, 6),
        "EMT_Clinical_Judgment": np.random.randint(0, 6),
        "Time_Since_Symptom_Onset": np.random.randint(1, 120),
        "EmergencyType": emergency,

        # OUTPUTS
        "SeverityScore": severity,
        "SeverityLabel": label,
        "ICU": ICU,
        "Ventilator": Ventilator,
        "CT_Scan": CT,
        "MRI": MRI,
        "Neurosurgeon": 1 if emergency == "Neurological" else 0,
        "Neurologist": 1 if emergency == "Neurological" else 0,
        "Emergency_Department": 1,
        "Stroke_Unit": 1 if emergency == "Neurological" else 0,
        "General_Physician": 1,
        "PICU": 1 if emergency == "Pediatric" else 0,
        "NICU": 1 if emergency == "Pediatric" else 0,
        "Pediatrician": 1 if emergency == "Pediatric" else 0,
        "Oxygen_Support": 1 if breath >= 2 else 0,
        "Emergency_OT": 1 if severity >= 4 else 0,
        "Blood_Bank": 1 if severity >= 3 else 0,
        "Obstetrician": 1 if emergency == "Obstetric" else 0,
        "Delivery_Room": 1 if emergency == "Obstetric" else 0,
        "Burn_Unit": 1 if emergency == "Burn" else 0,
        "Plastic_Surgeon": 1 if emergency == "Burn" else 0,
        "Trauma_Center": 1 if emergency == "Trauma" else 0,
        "Orthopedic_Surgeon": 1 if emergency == "Trauma" else 0,
        "Cardiac_ICU": 1 if emergency == "Cardiac" and severity >= 4 else 0,
        "ECG": 1 if emergency == "Cardiac" else 0,
        "Cardiologist": 1 if emergency == "Cardiac" else 0,
        "Pulmonologist": 1 if emergency == "Respiratory" else 0
    }

    data.append(row)

df = pd.DataFrame(data)

os.makedirs("data", exist_ok=True)
df.to_csv("data/emergency_triage_dataset.csv", index=False)

print("✅ FULL Dataset Generated Successfully!")