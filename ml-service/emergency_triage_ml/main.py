from src.train import train
from src.predict import predict

def get_input():

    print("\n🩺 ENTER PATIENT DATA:\n")

    data = {}

    # -------------------------------
    # BASIC
    # -------------------------------
    data["Gender"] = input("Gender (Male/Female): ")
    data["Pregnancy_Status"] = int(input("Pregnancy_Status (0/1): "))

    # -------------------------------
    # VITALS (0–5 SCALE)
    # -------------------------------
    data["Pain_Level"] = int(input("Pain Level (0-5): "))
    data["Breathing_Difficulty"] = int(input("Breathing Difficulty (0-5): "))
    data["GCS"] = int(input("GCS (3-15): "))
    data["Heart_Rate"] = int(input("Heart Rate Grade (0-5): "))
    data["Blood_Pressure"] = int(input("Blood Pressure Grade (0-5): "))
    data["Respiratory_Rate"] = int(input("Respiratory Rate Grade (0-5): "))
    data["SpO2"] = int(input("SpO2 Grade (0-5): "))

    data["Body_Temperature"] = float(input("Body Temperature (°C): "))
    data["Blood_Glucose"] = float(input("Blood Glucose: "))

    # -------------------------------
    # SYMPTOMS
    # -------------------------------
    data["Bleeding_Severity"] = int(input("Bleeding Severity (0-5): "))
    data["Skin_Circulation"] = int(input("Skin Circulation (0-5): "))
    data["Capillary_Refill"] = int(input("Capillary Refill (0-5): "))

    data["Seizure"] = int(input("Seizure (0-5): "))
    data["Slurred_Speech"] = int(input("Slurred Speech (0-5): "))
    data["Vision_Changes"] = int(input("Vision Changes (0-5): "))
    data["Facial_Droop"] = int(input("Facial Droop (0-5): "))
    data["Arm_Weakness"] = int(input("Arm Weakness (0-5): "))
    data["Numbness_Tingling"] = int(input("Numbness/Tingling (0-5): "))

    # -------------------------------
    # CARDIAC
    # -------------------------------
    data["Chest_Pain"] = int(input("Chest Pain (0-5): "))
    data["ECG_Result"] = input("ECG Result (Normal/Abnormal): ")
    data["Pulse_Deficit"] = int(input("Pulse Deficit (0-5): "))

    # -------------------------------
    # RESPIRATORY
    # -------------------------------
    data["Shortness_of_Breath"] = int(input("Shortness of Breath (0-5): "))
    data["Airway_Status"] = int(input("Airway Status (0-5): "))
    data["Airway_Sounds"] = int(input("Airway Sounds (0-5): "))
    data["Breathing_Sounds"] = int(input("Breathing Sounds (0-5): "))

    # -------------------------------
    # ABDOMEN
    # -------------------------------
    data["Abdominal_Pain"] = int(input("Abdominal Pain (0-5): "))
    data["Abdominal_Tenderness"] = int(input("Abdominal Tenderness (0-5): "))
    data["Abdominal_Hardness"] = int(input("Abdominal Hardness (0-5): "))
    data["Nausea_Vomiting"] = int(input("Nausea/Vomiting (0-5): "))

    # -------------------------------
    # TRAUMA
    # -------------------------------
    data["Injury_Severity"] = int(input("Injury Severity (0-5): "))
    data["Trauma_Score"] = int(input("Trauma Score (0-5): "))
    data["Mechanism_of_Injury"] = input("Mechanism (Fall/Accident/Assault): ")
    data["C_Spine_Injury"] = int(input("C-Spine Injury (0-5): "))
    data["Extremity_Deformity"] = int(input("Extremity Deformity (0-5): "))

    # -------------------------------
    # BURNS
    # -------------------------------
    data["Burn_Percentage"] = float(input("Burn %: "))
    data["Burn_Degree"] = input("Burn Degree (1st/2nd/3rd): ")
    data["Smoke_Inhalation"] = int(input("Smoke Inhalation (0-5): "))

    # -------------------------------
    # GENERAL
    # -------------------------------
    data["Head_Neck_Abnormality"] = int(input("Head/Neck Abnormality (0-5): "))
    data["Chest_Abnormality"] = int(input("Chest Abnormality (0-5): "))
    data["Skin_Issues"] = int(input("Skin Issues (0-5): "))

    data["Weakness"] = int(input("Weakness (0-5): "))
    data["Fatigue"] = int(input("Fatigue (0-5): "))
    data["Fever"] = int(input("Fever (0-5): "))
    data["Chills"] = int(input("Chills (0-5): "))
    data["Dizziness"] = int(input("Dizziness (0-5): "))
    data["Headache"] = int(input("Headache (0-5): "))

    data["Hypothermia_Risk"] = int(input("Hypothermia Risk (0-5): "))

    data["Pupils"] = int(input("Pupils (0-5): "))
    data["Movement"] = int(input("Movement (0-5): "))

    data["Response_to_Treatment"] = int(input("Response to Treatment (0-5): "))
    data["Overall_Patient_Condition"] = int(input("Overall Condition (0-5): "))
    data["EMT_Clinical_Judgment"] = int(input("EMT Judgment (0-5): "))

    data["Time_Since_Symptom_Onset"] = float(input("Time since onset (minutes): "))
    data["EmergencyType"] = input("Emergency Type (Cardiac/Trauma/Respiratory/Neurological/Pediatric/Obstetric/Burn): ").strip().capitalize()
    return data


if __name__ == "__main__":

    # Train model first
    train()

    # Take input
    user_input = get_input()

    # Predict
    result = predict(user_input)

    print("\n🚑 PREDICTION RESULT:\n")
    for k, v in result.items():
        print(f"{k}: {v}")