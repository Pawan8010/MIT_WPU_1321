import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Brain, BarChart3, Building2, Shield, AlertTriangle, CheckCircle,
  XCircle, Info, ArrowRight, Lightbulb, Heart, Wind, Activity, Loader
} from 'lucide-react';
import './XAIPanel.css';

export default function XAIPanel() {
  const navigate = useNavigate();
  const { prediction, routing, patientData } = useStore();
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);

  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        setLoadingAi(true);
        // Using the API key provided for the Explainable AI panel feature
        const apiKey = "AIzaSyDg4JK90DyByU7N6p7_2-fcBdAyNBu0Zuo";
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const ptData = patientData || {};
        const prompt = `You are an expert XAI (Explainable AI) assistant for a medical triage system. 
Analyze the following patient data and the generated severity prediction to explain WHY the model made this decision.
Your response MUST be valid JSON with absolutely no markdown wrapping, no backticks, just the raw JSON object containing these two fields:
{
  "short_explanation": "A 1-2 sentence concise summary of why this severity was assigned.",
  "long_explanation": "A detailed, multi-paragraph medical reasoning explaining the features, vitals, and their impacts on the final triage decision."
}

Data:
- Patient: Age ${ptData.age || 'Unknown'}, Gender ${ptData.gender || 'Unknown'}
- Complaint: ${ptData.chiefComplaint || 'N/A'}
- Severity Assigned: ${prediction?.severity?.name || 'Unknown'} (${prediction?.severityScore || 0}/100)
- Feature Importance Data: ${JSON.stringify(prediction?.featureImportance || [])}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleaned);
        
        setAiAnalysis(data);
      } catch (e) {
        console.error("XAI Generation error:", e);
        // Fallback static explanation if API fails
        setAiAnalysis({
          short_explanation: explanation.summary,
          long_explanation: "The AI evaluation engine combines multiple physiological factors to assess patient stability. Due to the high-risk indicators observed in the primary survey and vitals, the model escalated the severity to ensure rapid availability of specialized trauma resources. " + explanation.reasons.join(". ")
        });
      } finally {
        setLoadingAi(false);
      }
    };
    
    fetchExplanation();
  }, [patientData, prediction]);

  const featureImportance = prediction?.featureImportance || [
    { feature: 'Chest Pain', importance: 40, value: 'Present' },
    { feature: 'SpO2 Level', importance: 30, value: 89 },
    { feature: 'Blood Pressure', importance: 20, value: '85/55' },
    { feature: 'Heart Rate', importance: 15, value: 128 },
    { feature: 'GCS Score', importance: 12, value: 11 },
    { feature: 'Respiratory Rate', importance: 8, value: 28 },
  ];

  const explanation = routing?.explanation || {
    summary: 'Patient routed due to high cardiac risk and low oxygen levels. Nearest Level-1 trauma center with available ICU and ventilator resources selected.',
    reasons: [
      'Patient classified as high-severity requiring immediate intervention',
      'ICU bed available (5/12)',
      'Ventilator available (3/8)',
      'Low hospital load (45%)',
      'Distance: 2.3 km (ETA: 8 min)',
      'Trauma Level 1 facility'
    ],
    hospitalCapabilities: {
      icuAvailable: true,
      ventilatorAvailable: true,
      specialistAvailable: true,
      traumaLevel: 1,
    }
  };

  const rejectedHospitals = routing?.rejected || [
    { name: 'Metro District Hospital', reasons: ['No ICU beds available', 'No ventilators available', 'Hospital at high capacity'] },
    { name: 'St. Mary\'s Medical Center', reasons: ['Limited specialist availability', 'Higher distance'] },
  ];

  return (
    <div className="xai-page">
      <div className="page-header">
        <div>
          <h2>Explainable AI Panel</h2>
          <p className="page-subtitle">Transparent decision-making insights & model explanations</p>
        </div>
        <div className="xai-model-tag">
          <Brain size={14} />
          <span>Model: v2.4.1-golden-hour</span>
        </div>
      </div>

      <div className="xai-grid">
        {/* Feature Importance */}
        <div className="card xai-card feature-importance-card">
          <div className="card-header">
            <h3><BarChart3 size={16} /> Feature Importance</h3>
            <span className="badge badge-info">Top Factors</span>
          </div>
          <div className="card-body">
            <p className="xai-description">
              These are the key clinical indicators that most influenced the triage decision.
            </p>
            <div className="importance-bars">
              {featureImportance.map((f, i) => (
                <div key={f.feature} className="importance-item" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="imp-header">
                    <span className="imp-feature">{f.feature}</span>
                    <div className="imp-right">
                      <span className="imp-value mono">{f.value}</span>
                      <span className="imp-pct mono">{f.importance}%</span>
                    </div>
                  </div>
                  <div className="imp-bar-track">
                    <div
                      className="imp-bar-fill"
                      style={{
                        width: `${f.importance}%`,
                        background: f.importance > 30 ? 'linear-gradient(90deg, #DC2626, #EF4444)' :
                                   f.importance > 18 ? 'linear-gradient(90deg, #D97706, #F59E0B)' :
                                   'linear-gradient(90deg, #3B82F6, #60A5FA)',
                        animationDelay: `${i * 100}ms`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hospital Capabilities */}
        <div className="card xai-card capabilities-card">
          <div className="card-header">
            <h3><Building2 size={16} /> Hospital Capabilities Match</h3>
          </div>
          <div className="card-body">
            <div className="capability-list">
              <CapabilityItem
                icon={Heart}
                label="ICU Available"
                available={explanation.hospitalCapabilities.icuAvailable}
              />
              <CapabilityItem
                icon={Wind}
                label="Ventilator Available"
                available={explanation.hospitalCapabilities.ventilatorAvailable}
              />
              <CapabilityItem
                icon={Brain}
                label="Specialist Available"
                available={explanation.hospitalCapabilities.specialistAvailable}
              />
              <CapabilityItem
                icon={Shield}
                label={`Trauma Level ${explanation.hospitalCapabilities.traumaLevel}`}
                available={explanation.hospitalCapabilities.traumaLevel <= 2}
              />
            </div>
          </div>
        </div>

        {/* Decision Explanation */}
        <div className="card xai-card explanation-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb size={16} /> Decision Explanation (Gemini AI)</h3>
            {loadingAi && <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Loader size={12} className="spin" /> Generating...</span>}
          </div>
          <div className="card-body">
            {loadingAi ? (
              <div className="xai-loading-skeleton">
                <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
                <div className="skeleton-line" style={{ width: '80%', height: '14px', marginBottom: '24px' }}></div>
                <div className="skeleton-line" style={{ width: '100%', height: '12px', marginBottom: '6px' }}></div>
                <div className="skeleton-line" style={{ width: '90%', height: '12px', marginBottom: '6px' }}></div>
                <div className="skeleton-line" style={{ width: '95%', height: '12px', marginBottom: '6px' }}></div>
              </div>
            ) : (
              <>
                <div className="explanation-summary">
                  <Info size={18} className="explanation-icon" />
                  <div>
                    <h4 style={{ marginBottom: '4px', fontSize: '14px', color: 'var(--text-primary)' }}>Short Summary</h4>
                    <p>{aiAnalysis?.short_explanation}</p>
                  </div>
                </div>
                <div className="explanation-reasons" style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>Detailed Medical Reasoning</h4>
                  <div className="long-explanation-text" style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    {aiAnalysis?.long_explanation?.split('\n').map((paragraph, i) => (
                      <p key={i} style={{ marginBottom: '10px' }}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rejected Hospitals */}
        <div className="card xai-card rejected-card">
          <div className="card-header">
            <h3><XCircle size={16} /> Rejected Alternatives</h3>
            <span className="badge badge-danger">{rejectedHospitals.length} Rejected</span>
          </div>
          <div className="card-body">
            <p className="xai-description">
              These hospitals were not selected and here's why:
            </p>
            <div className="rejected-list">
              {rejectedHospitals.map((h, i) => (
                <div key={i} className="rejected-item">
                  <div className="rejected-header">
                    <AlertTriangle size={14} />
                    <span className="rejected-name">{h.name}</span>
                  </div>
                  <ul className="rejected-reasons">
                    {h.reasons.map((r, j) => (
                      <li key={j}>
                        <XCircle size={11} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="xai-actions">
        <button className="btn btn-outline" onClick={() => navigate('/prediction')}>
          ← Back to Prediction
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/hospital-routing')}>
          View Hospital Routing <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function CapabilityItem({ icon: Icon, label, available }) {
  return (
    <div className={`capability-item ${available ? 'available' : 'unavailable'}`}>
      <div className="cap-icon">
        <Icon size={18} />
      </div>
      <span className="cap-label">{label}</span>
      <div className="cap-status">
        {available ? (
          <><CheckCircle size={14} /> <span>Available</span></>
        ) : (
          <><XCircle size={14} /> <span>Unavailable</span></>
        )}
      </div>
    </div>
  );
}
