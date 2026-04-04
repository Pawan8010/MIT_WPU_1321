import joblib
import pandas as pd

def load():
    return (
        joblib.load("models/model.pkl"),
        joblib.load("models/scaler.pkl"),
        joblib.load("models/encoders.pkl"),
        joblib.load("models/label_encoder.pkl"),
        joblib.load("models/input_columns.pkl")
    )

def predict(input_data):

    model, scaler, encoders, le_label, input_columns = load()

    df = pd.DataFrame([input_data])

    # 🔥 FIXED INDENTATION
    for col in encoders:
        df[col] = df[col].astype(str).str.strip()

        if col == "Gender":
            df[col] = df[col].str.capitalize()

        if col == "ECG_Result":
            df[col] = df[col].str.capitalize()

        if col == "Mechanism_of_Injury":
            df[col] = df[col].str.capitalize()

        if col == "Burn_Degree":
            df[col] = df[col].str.lower()

        if col == "EmergencyType":
            df[col] = df[col].str.capitalize()

        # Handle unknown values
        known_classes = list(encoders[col].classes_)

        df[col] = df[col].apply(
            lambda x: x if x in known_classes else known_classes[0]
        )

        df[col] = encoders[col].transform(df[col])

    # 🔹 Match column order
    df = df[input_columns]

    # 🔹 Scale
    df_scaled = scaler.transform(df)

    # 🔹 Predict
    pred = model.predict(df_scaled)[0]

    output_cols = [
        "SeverityScore","SeverityLabel",
        "ICU","Ventilator","CT_Scan","MRI",
        "Neurosurgeon","Neurologist","Emergency_Department",
        "Stroke_Unit","General_Physician","PICU","NICU",
        "Pediatrician","Oxygen_Support","Emergency_OT",
        "Blood_Bank","Obstetrician","Delivery_Room",
        "Burn_Unit","Plastic_Surgeon","Trauma_Center",
        "Orthopedic_Surgeon","Cardiac_ICU","ECG",
        "Cardiologist","Pulmonologist"
    ]

    result = {}

    # SeverityScore
    result["SeverityScore"] = float(pred[0])

    # Binary outputs
    for i, col in enumerate(output_cols[2:], start=2):
        result[col] = "Yes" if round(pred[i]) == 1 else "No"

    # SeverityLabel LAST
    result["SeverityLabel"] = le_label.inverse_transform([int(round(pred[1]))])[0]

    return result