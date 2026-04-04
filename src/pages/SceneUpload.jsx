import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { 
  Camera, Upload, Zap, AlertTriangle, ArrowRight, X, 
  Image as ImageIcon, Loader2, ShieldCheck, Activity
} from 'lucide-react';
import './SceneUpload.css';
import LiveCamera from '../components/LiveCamera';
import ExplainPanel from '../components/ExplainPanel';
import { notifyHospital } from '../services/notifyService';

export default function SceneUpload() {
  const navigate = useNavigate();
  const { setPatientField, runRouting } = useStore();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showLiveCamera, setShowLiveCamera] = useState(false);

  const handlePredict = async (predictionData, imageFile = null) => {
    // Basic fields
    const updatedResult = { ...predictionData };
    setResult(updatedResult);

    setPatientField('aiSeverity', predictionData.severity);
    setPatientField('isCritical', predictionData.is_critical || predictionData.severity === 'HIGH');

    // Fetch Explainability data (SHAP/Grad-CAM)
    try {
        const formData = new FormData();
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || "/api-ml";
        const response = await fetch(`${ML_SERVICE_URL}/predict-explain`, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
            const explainData = await response.json();
            updatedResult.explanations = explainData.explanations;
            updatedResult.heatmap = explainData.heatmap;
            setResult({...updatedResult});
        }
    } catch (e) {
        console.error("Failed to fetch explanations", e);
    }

    if (predictionData.severity === 'HIGH' || predictionData.severity === 'CRITICAL') {
      toast.error('CRITICAL CASE DETECTED: Auto-notifying hospital network', {
        icon: '🚨',
        duration: 5000,
        style: { background: '#991B1B', color: '#fff' }
      });
      // Trigger notification for top matched hospital
      await notifyHospital('HOSP-001', predictionData.severity, 15);
    }
  };

  const proceedToHospitals = async () => {
    try {
      await runRouting();
      navigate('/hospital-routing');
    } catch (e) {
      toast.error('Failed to load routing data');
    }
  };

  return (
    <div className="scene-upload-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Emergency Scene AI <span className="badge badge-primary ml-2 animate-pulse">LIVE</span></h2>
          <p className="page-subtitle">Real-time accident severity assessment via vision models</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/app/emt-form')}>
          Manual Triage
        </button>
      </div>

      <div className="upload-container card glass p-6">
        {showLiveCamera ? (
          <div className="w-full">
             <LiveCamera 
                 onPredict={handlePredict} 
                 onStop={() => setShowLiveCamera(false)} 
             />
             <ExplainPanel result={result} />
             
             {result && (
                <div className="mt-6 flex justify-center">
                    <button className="btn btn-primary btn-lg" onClick={proceedToHospitals}>
                        Route to Best Hospital <ArrowRight size={18} />
                    </button>
                </div>
             )}
          </div>
        ) : (
          <div className="dropzone-wrapper">
            <div className="text-center p-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
               <div className="flex justify-center mb-4">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                     <Camera size={48} className="text-blue-600 dark:text-blue-400" />
                  </div>
               </div>
               <h3 className="text-2xl font-bold mb-2">Live AI Detection & Upload</h3>
               <p className="text-gray-500 mb-6">Activate camera or upload a photo for real-time analysis.</p>
               <div className="flex justify-center gap-4">
                 <button 
                    className="btn btn-primary btn-lg open-camera-btn shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all" 
                    onClick={() => setShowLiveCamera(true)}
                 >
                   <Camera size={20} className="mr-2" /> Start Live Camera
                 </button>
                 <label className="btn btn-secondary btn-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all cursor-pointer">
                   <Upload size={20} className="mr-2" /> Upload Photo
                   <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                       const file = e.target.files[0];
                       if (file) {
                           setAnalyzing(true);
                           toast.loading("Analyzing image...", { id: "analyze" });
                           const formData = new FormData();
                           formData.append("image", file);
                           try {
                               const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || "/api-ml";
                               const res = await fetch(`${ML_SERVICE_URL}/predict-live`, {
                                   method: "POST",
                                   body: formData
                               });
                               if (res.ok) {
                                   const data = await res.json();
                                   toast.success("Image analyzed successfully!", { id: "analyze" });
                                   handlePredict(data, file);
                               } else {
                                   toast.error("Analysis failed", { id: "analyze" });
                               }
                           } catch (err) {
                               console.error(err);
                               toast.error("Network error during analysis", { id: "analyze" });
                           } finally {
                               setAnalyzing(false);
                           }
                       }
                   }} />
                 </label>
               </div>
            </div>
          </div>
        )}
      </div>


      <div className="info-grid mt-8">
        <div className="info-card">
          <Activity size={20} className="info-icon text-primary" />
          <h3>Dynamic Routing</h3>
          <p>Hospitals are filtered based on detected trauma levels (Level-1 for High Severity).</p>
        </div>
        <div className="info-card">
          <Zap size={20} className="info-icon text-warning" />
          <h3>Real-time Sync & Explainability</h3>
          <p>Scene findings are automatically explained via SHAP/Grad-CAM and synchronized with hospitals.</p>
        </div>
      </div>
    </div>
  );
}
