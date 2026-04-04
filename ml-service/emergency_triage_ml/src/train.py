import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_squared_error

from xgboost import XGBRegressor

from src.preprocess import preprocess


def train():
    print("🔄 Loading dataset...")
    df = pd.read_csv("data/emergency_triage_dataset.csv")

    # 🔹 Preprocess
    X, y, scaler, encoders, le_label, input_columns = preprocess(df)

    # 🔥 SAVE INPUT COLUMN ORDER (VERY IMPORTANT FIX)
    os.makedirs("models", exist_ok=True)
    joblib.dump(list(input_columns), "models/input_columns.pkl")

    # 🔹 Train Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 🔥 BEST MODEL (TUNED XGBOOST)
    base_model = XGBRegressor(
        n_estimators=500,
        max_depth=8,
        learning_rate=0.03,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_alpha=0.1,
        reg_lambda=1,
        random_state=42
    )

    model = MultiOutputRegressor(base_model)

    print("🚀 Training model...")
    model.fit(X_train, y_train)

    # 🔹 Predictions
    y_pred = model.predict(X_test)

    # -------------------------------
    # 🔥 ACCURACY CALCULATION
    # -------------------------------

    # Round for classification outputs
    y_pred_round = y_pred.round()

    # Overall accuracy
    acc = (y_pred_round == y_test.values).mean()

    # SeverityScore RMSE
    rmse = mean_squared_error(y_test.iloc[:, 0], y_pred[:, 0]) ** 0.5

    print(f"\n🔥 Overall Accuracy: {acc*100:.2f}%")
    print(f"📊 SeverityScore RMSE: {rmse:.2f}")

    # -------------------------------
    # 💾 SAVE MODELS
    # -------------------------------
    joblib.dump(model, "models/model.pkl")
    joblib.dump(scaler, "models/scaler.pkl")
    joblib.dump(encoders, "models/encoders.pkl")
    joblib.dump(le_label, "models/label_encoder.pkl")

    print("\n✅ Model Saved Successfully!")