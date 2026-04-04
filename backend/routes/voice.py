import os
import requests
import time
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()
voice_bp = Blueprint('voice', __name__)

ASSEMBLY_AI_KEY = os.getenv('ASSEMBLY_AI_KEY', '708a59616f434556ba2b9e15053ba117')

@voice_bp.route('/voice-input', methods=['POST'])
def voice_input():
    # Retain the fallback text route just in case
    data = request.get_json()
    if not data or 'transcript' not in data:
        return jsonify({"error": "No transcript provided"}), 400
        
    text = data['transcript'].lower()
    
    high_keywords = ["unconscious", "bleeding", "not breathing", "critical", "severe", "heavy"]
    medium_keywords = ["injury", "fracture", "pain", "burn", "ache"]
    
    severity = "LOW"
    for kw in high_keywords:
        if kw in text:
            severity = "HIGH"
            break
            
    if severity == "LOW":
        for kw in medium_keywords:
            if kw in text:
                severity = "MEDIUM"
                break
                
    return jsonify({
        "severity": severity,
        "transcript": data['transcript']
    })

@voice_bp.route('/voice-transcribe', methods=['POST'])
def voice_transcribe():
    """Modern voice transcription with improved error handling and timeout support"""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided", "code": "NO_AUDIO"}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"error": "Empty audio file", "code": "EMPTY_FILE"}), 400
    
    headers = {"authorization": ASSEMBLY_AI_KEY}
    max_retries = 3
    poll_timeout = 120  # 2 minutes timeout for polling
    poll_start_time = time.time()
    
    try:
        # 1. Upload audio to AssemblyAI
        print(f"[VoiceAPI] Uploading audio file: {audio_file.filename}")
        upload_resp = requests.post(
            "https://api.assemblyai.com/v2/upload",
            headers=headers,
            data=audio_file.read(),
            timeout=30
        )
        upload_resp.raise_for_status()
        audio_url = upload_resp.json().get("upload_url")
        print(f"[VoiceAPI] Audio uploaded successfully: {audio_url}")

        # 2. Request transcription with language detection
        transcript_resp = requests.post(
            "https://api.assemblyai.com/v2/transcript",
            headers=headers,
            json={
                "audio_url": audio_url,
                "language_detection": True,
                "speech_recognition": True
            },
            timeout=30
        )
        transcript_resp.raise_for_status()
        transcript_id = transcript_resp.json().get("id")
        print(f"[VoiceAPI] Transcription requested: {transcript_id}")

        # 3. Poll for result with timeout
        polling_endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
        transcript_text = ""
        poll_count = 0
        
        while True:
            poll_count += 1
            elapsed = time.time() - poll_start_time
            
            # Check timeout
            if elapsed > poll_timeout:
                print(f"[VoiceAPI] Transcription timeout after {elapsed:.1f}s")
                return jsonify({
                    "error": "Transcription took too long. Please try again.",
                    "code": "TIMEOUT"
                }), 408
            
            poll_resp = requests.get(polling_endpoint, headers=headers, timeout=10)
            poll_resp.raise_for_status()
            response_data = poll_resp.json()
            status = response_data.get("status")
            print(f"[VoiceAPI] Poll {poll_count}: Status = {status} (elapsed: {elapsed:.1f}s)")
            
            if status == "completed":
                transcript_text = response_data.get("text", "")
                confidence = response_data.get("confidence", 0)
                print(f"[VoiceAPI] Transcription complete. Confidence: {confidence:.2%}")
                break
            elif status == "error":
                error_msg = response_data.get("error", "Unknown error")
                print(f"[VoiceAPI] AssemblyAI error: {error_msg}")
                return jsonify({
                    "error": f"Transcription failed: {error_msg}",
                    "code": "TRANSCRIPTION_ERROR"
                }), 500
            
            time.sleep(2)  # wait 2s before polling again
            
        # 4. Keyword extraction & Severity logic on the backend
        text = transcript_text.lower()
        
        # Enhanced severity keywords based on EMT triage
        high_keywords = [
            "unconscious", "unresponsive", "bleeding", "heavy bleeding", 
            "not breathing", "no pulse", "critical", "severe", "severe injury",
            "uncontrolled bleeding", "shock", "respiratory distress", "choking",
            "poisoning", "overdose", "cardiac arrest", "stroke", "severe burn"
        ]
        medium_keywords = [
            "injury", "fracture", "broken", "pain", "severe pain", 
            "burn", "ache", "sprain", "dislocation", "conscious but",
            "difficulty breathing", "chest pain", "abdominal pain",
            "bleeding", "wound", "moderate", "heat exhaustion"
        ]
        
        severity = "LOW"
        for kw in high_keywords:
            if kw in text:
                severity = "HIGH"
                break
                
        if severity == "LOW":
            for kw in medium_keywords:
                if kw in text:
                    severity = "MEDIUM"
                    break

        print(f"[VoiceAPI] Detected severity: {severity}")
        
        return jsonify({
            "severity": severity,
            "transcript": transcript_text,
            "success": True
        }), 200
        
    except requests.exceptions.Timeout:
        print("[VoiceAPI] Request timeout to AssemblyAI")
        return jsonify({
            "error": "Request timeout. AssemblyAI service took too long to respond.",
            "code": "REQUEST_TIMEOUT"
        }), 408
    except requests.exceptions.ConnectionError:
        print("[VoiceAPI] Connection error to AssemblyAI")
        return jsonify({
            "error": "Could not connect to transcription service. Check your internet connection.",
            "code": "CONNECTION_ERROR"
        }), 503
    except requests.exceptions.HTTPError as e:
        print(f"[VoiceAPI] HTTP error: {str(e)}")
        if e.response.status_code == 401:
            return jsonify({
                "error": "Authentication failed. API key may be invalid.",
                "code": "AUTH_ERROR"
            }), 401
        return jsonify({
            "error": f"Service error: {str(e)}",
            "code": "HTTP_ERROR"
        }), 500
    except Exception as e:
        print(f"[VoiceAPI] Unexpected error: {str(e)}")
        return jsonify({
            "error": f"An unexpected error occurred: {str(e)}",
            "code": "UNKNOWN_ERROR"
        }), 500
