import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Loader2, Sparkles, Bot, 
  CheckCircle, Activity, Volume2, Shield, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import './VoiceInput.css';

export default function VoiceInput({ onSeverityDetected }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Load from env or use the Vite proxy path /api-ml
  const BACKEND_URL = import.meta.env.VITE_ML_SERVICE_URL || '/api-ml';

  useEffect(() => {
    console.log(`[VoiceAssistant] Backend initialized at: ${BACKEND_URL}`);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setTranscript('');
    setLastTranscript('');
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Microphone Error:', err);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const processAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'assessment.webm');
    
    try {
      const response = await fetch(`${BACKEND_URL}/voice-transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      if (data.success) {
        setTranscript(data.transcript);
        setLastTranscript(data.transcript);
        if (onSeverityDetected) {
          onSeverityDetected(data.severity || 'LOW', data.transcript);
        }
        toast.success(`Success: ${data.severity} severity detected!`);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err) {
      console.error('Transcription Error:', err);
      toast.error(err.message || 'Error connecting to AI service');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className="voice-assistant-container">
      {/* Premium Header */}
      <div className="voice-header">
        <div className="voice-header-info">
          <div className="voice-icon-wrapper">
             <Bot size={22} color="white" />
          </div>
          <div className="voice-title-group">
            <h3>AI Voice Assistant</h3>
            <p className="voice-subtitle">AssemblyAI Transcription Service</p>
          </div>
        </div>
        <div className="header-actions">
           {isRecording ? (
             <div className="severity-pill">
               <Activity size={14} className="animate-pulse" />
               <span>{formatTime(timer)}</span>
             </div>
           ) : (
             <div className="severity-pill high">
               <Shield size={14} />
               <span>SECURE CHANNEL</span>
             </div>
           )}
        </div>
      </div>

      <div className="voice-body">
        <div className="voice-input-layout">
          {/* Circular Microphone Section */}
          <div className="mic-section">
            <button 
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`mic-button ${isProcessing ? 'processing' : isRecording ? 'recording' : 'idle'}`}
              title={isRecording ? "Stop Listening" : "Start Listening"}
            >
              {isProcessing ? (
                <Loader2 size={32} className="animate-spin text-white" />
              ) : isRecording ? (
                <Square size={32} fill="white" className="text-white" />
              ) : (
                <Mic size={32} fill="rgba(255,255,255,0.2)" />
              )}
              <span className="mic-button-label">
                {isProcessing ? "POLLING" : isRecording ? "SEND" : "BEGIN"}
              </span>
            </button>
          </div>

          <div className="transcript-section">
            <div className={`transcript-container ${transcript || lastTranscript || isProcessing ? 'has-content' : ''}`}>
              {!isRecording && !isProcessing && !lastTranscript && (
                <div className="transcript-placeholder">
                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
                    <Volume2 size={24} className="text-blue-500" />
                  </div>
                  <p>Hold the microphone and dictate your patient assessment clearly.</p>
                </div>
              )}

              {isRecording && (
                <div className="listening-text">
                  <div className="recording-dot" />
                  <span>Listening... Speak into microphone</span>
                  <div className="waveform ml-3">
                    <div className="bar"></div><div className="bar"></div>
                    <div className="bar"></div><div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                </div>
              )}

              {lastTranscript && !isProcessing && !isRecording && (
                 <div className="transcript-wrapper">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase font-black text-blue-500 mb-2 border-b border-blue-100 dark:border-blue-900 pb-1">
                       <CheckCircle size={14} /> Analysis Complete
                    </div>
                    <p className="transcript-text">"{lastTranscript}"</p>
                 </div>
              )}

              {isProcessing && (
                <div className="processing-indicator">
                  <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
                  <span className="processing-text">CONNECTING TO ASSEMBLYAI...</span>
                  <p className="text-[10px] opacity-60 mt-1 uppercase tracking-tighter">Uploading blob & waiting for transcription</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
