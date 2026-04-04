import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

def preprocess(df):

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

    # ✅ COPY to avoid warning
    df = df.copy()

    X = df.drop(columns=output_cols)
    y = df[output_cols].copy()

    # 🔹 Encode categorical
    encoders = {}
    categorical_cols = X.select_dtypes(include=['object']).columns

    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le

    # 🔹 Encode label
    le_label = LabelEncoder()
    y.loc[:, "SeverityLabel"] = le_label.fit_transform(y["SeverityLabel"])

    # 🔹 Save column names BEFORE scaling
    input_columns = X.columns

    # 🔹 Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler, encoders, le_label, input_columns