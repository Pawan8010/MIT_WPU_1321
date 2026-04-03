# HC03 Patient Assessment Form

---

## Patient Info

| # | Field | Type | Input |
|---|-------|------|-------|
| 1 | **Age** | Continuous | ___ years |
| 2 | **Gender** | Categorical | ☐ Male  ☐ Female |
| 3 | **Pregnancy_Status** | 0/1 | ☐ No  ☐ Yes |

---

## Vital Signs

| # | Field | Type | Input |
|---|-------|------|-------|
| 4 | **Pain_Level** | 0-5 | ___ /5 |
| 5 | **Breathing_Difficulty** | 0-5 | ___ /5 |
| 6 | **GCS** | Continuous | ___ /15 |
| 7 | **Heart_Rate** | 0-5 | ___ /5 |
| 8 | **Blood_Pressure** | 0-5 | ___ /5 |
| 9 | **Respiratory_Rate** | 0-5 | ___ /5 |
| 10 | **SpO2** | 0-5 | ___ /5 |
| 11 | **Body_Temperature** | Continuous | ___ . _ °C |
| 12 | **Blood_Glucose** | Continuous | ___ mg/dL |

---

## Assessment

| # | Field | Type | Input |
|---|-------|------|-------|
| 13 | **Bleeding_Severity** | 0-5 | ___ /5 |
| 14 | **Skin_Circulation** | 0-5 | ___ /5 |
| 15 | **Capillary_Refill** | 0-5 | ___ /5 |

---

## Neurological

| # | Field | Type | Input |
|---|-------|------|-------|
| 16 | **Seizure** | 0-5 | ___ /5 |
| 17 | **Slurred_Speech** | 0-5 | ___ /5 |
| 18 | **Vision_Changes** | 0-5 | ___ /5 |
| 19 | **Facial_Droop** | 0-5 | ___ /5 |
| 20 | **Arm_Weakness** | 0-5 | ___ /5 |
| 21 | **Numbness_Tingling** | 0-5 | ___ /5 |

---

## Cardiac

| # | Field | Type | Input |
|---|-------|------|-------|
| 22 | **Chest_Pain** | 0-5 | ___ /5 |
| 23 | **ECG_Result** | Categorical | ☐ Normal  ☐ STEMI  ☐ ST Depression  ☐ Arrhythmia |
| 24 | **Pulse_Deficit** | 0-5 | ___ /5 |

---

## Respiratory

| # | Field | Type | Input |
|---|-------|------|-------|
| 25 | **Shortness_of_Breath** | 0-5 | ___ /5 |
| 26 | **Airway_Status** | 0-5 | ___ /5 |
| 27 | **Airway_Sounds** | 0-5 | ___ /5 |
| 28 | **Breathing_Sounds** | 0-5 | ___ /5 |

---

## Gastrointestinal

| # | Field | Type | Input |
|---|-------|------|-------|
| 29 | **Abdominal_Pain** | 0-5 | ___ /5 |
| 30 | **Abdominal_Tenderness** | 0-5 | ___ /5 |
| 31 | **Abdominal_Hardness** | 0-5 | ___ /5 |
| 32 | **Nausea_Vomiting** | 0-5 | ___ /5 |

---

## Trauma

| # | Field | Type | Input |
|---|-------|------|-------|
| 33 | **Injury_Severity** | 0-5 | ___ /5 |
| 34 | **Trauma_Score** | 0-5 | ___ /5 |
| 35 | **Mechanism_of_Injury** | Categorical | ☐ None  ☐ Fall  ☐ Vehicle  ☐ Assault  ☐ Sports |
| 36 | **C_Spine_Injury** | 0-5 | ___ /5 |
| 37 | **Extremity_Deformity** | 0-5 | ___ /5 |

---

## Burns

| # | Field | Type | Input |
|---|-------|------|-------|
| 38 | **Burn_Percentage** | Continuous | ___ % |
| 39 | **Burn_Degree** | Categorical | ☐ 1st  ☐ 2nd  ☐ 3rd  ☐ 4th |
| 40 | **Smoke_Inhalation** | 0-5 | ___ /5 |

---

## Physical Exam

| # | Field | Type | Input |
|---|-------|------|-------|
| 41 | **Head_Neck_Abnormality** | 0-5 | ___ /5 |
| 42 | **Chest_Abnormality** | 0-5 | ___ /5 |
| 43 | **Skin_Issues** | 0-5 | ___ /5 |

---

## General Symptoms

| # | Field | Type | Input |
|---|-------|------|-------|
| 44 | **Weakness** | 0-5 | ___ /5 |
| 45 | **Fatigue** | 0-5 | ___ /5 |
| 46 | **Fever** | 0-5 | ___ /5 |
| 47 | **Chills** | 0-5 | ___ /5 |
| 48 | **Dizziness** | 0-5 | ___ /5 |
| 49 | **Headache** | 0-5 | ___ /5 |

---

## Additional

| # | Field | Type | Input |
|---|-------|------|-------|
| 50 | **Hypothermia_Risk** | 0-5 | ___ /5 |
| 51 | **Pupils** | 0-5 | ___ /5 |
| 52 | **Movement** | 0-5 | ___ /5 |

---

## Response & Condition

| # | Field | Type | Input |
|---|-------|------|-------|
| 53 | **Response_to_Treatment** | 0-5 | ___ /5 |
| 54 | **Overall_Patient_Condition** | 0-5 | ___ /5 |
| 55 | **EMT_Clinical_Judgment** | 0-5 | ___ /5 |

---

## Time

| # | Field | Type | Input |
|---|-------|------|-------|
| 56 | **Time_Since_Symptom_Onset** | Continuous | ___ minutes |

---

## Submit

```
┌──────────────────────────┐
│   📤 SUBMIT ASSESSMENT   │
└──────────────────────────┘
```

---

## TL;DR

**Total: 56 Fields**

| Category | Count |
|----------|:-----:|
| Patient Info | 3 |
| Vital Signs | 9 |
| Assessment | 3 |
| Neurological | 6 |
| Cardiac | 3 |
| Respiratory | 4 |
| Gastrointestinal | 4 |
| Trauma | 5 |
| Burns | 3 |
| Physical Exam | 3 |
| General Symptoms | 6 |
| Additional | 3 |
| Response & Condition | 3 |
| Time | 1 |
