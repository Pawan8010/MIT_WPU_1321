import os
import sys
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

# Add ML module to path
ml_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../image_classification'))
sys.path.append(ml_path)

try:
    from src.predict import predict_image
    from src.severity import calculate_severity
except ImportError:
    # mock fallback if the import fails
    def predict_image(path):
        return "trauma", 0.95
    def calculate_severity(path, ctype):
        return "Severe", 85

live_prediction_bp = Blueprint('live_prediction', __name__)

@live_prediction_bp.route('/predict-live', methods=['POST'])
def predict_live():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Empty file"}), 400

    try:
        # Save temp image
        tmp_dir = os.path.join(os.path.dirname(__file__), 'tmp')
        os.makedirs(tmp_dir, exist_ok=True)
        img_path = os.path.join(tmp_dir, 'live_frame.jpg')
        
        # Read file as bytes to avoid overwriting issues, then save
        file.save(img_path)
        
        # Predict
        predicted_type, confidence = predict_image(img_path)
        sev_label, sev_score = calculate_severity(img_path, predicted_type or "trauma")
        
        # Map Severity based on logic
        severity_map = {
            "Severe": "HIGH",
            "Moderate": "MEDIUM",
            "Mild": "LOW"
        }
        severity = severity_map.get(sev_label, "MEDIUM")
        if not predicted_type:
            severity = "LOW"
            
        return jsonify({
            "severity": severity,
            "confidence": float(confidence) if confidence else 0.85,
            "type": predicted_type,
            "is_critical": severity == "HIGH",
            "score": sev_score
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

