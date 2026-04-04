from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Features(BaseModel):
    features: list[float]

@app.post("/predict")
def predict(data: Features):
    # DUMMY ML LOGIC - REPLACE WITH ACTUAL MODEL
    f = data.features
    score = sum(f) / len(f)
    
    if score >= 4:
        return {"priority": "CRITICAL", "needs_icu": True, "needs_ventilator": True}
    elif score >= 3:
        return {"priority": "EMERGENCY", "needs_icu": True, "needs_ventilator": False}
    elif score >= 2:
        return {"priority": "HIGH", "needs_icu": False, "needs_ventilator": False}
    elif score >= 1:
        return {"priority": "MODERATE", "needs_icu": False, "needs_ventilator": False}
    else:
        return {"priority": "LOW", "needs_icu": False, "needs_ventilator": False}
