import { useState, useRef, useCallback } from 'react';

export default function useLivePrediction(videoRef, canvasRef, onPredict) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [severity, setSeverity] = useState(null);
    const [confidence, setConfidence] = useState(null);
    const intervalRef = useRef(null);

    const captureAndSend = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Ensure video has loaded
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append('image', blob, 'frame.jpg');

            try {
                // Use proxy path so it handles both prod and dev correctly
                const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || "/api-ml";
                const res = await fetch(`${ML_SERVICE_URL}/predict-live`, {
                    method: 'POST',
                    body: formData,
                    signal: AbortSignal.timeout(3000)
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setSeverity(data.severity);
                    setConfidence(data.confidence);
                    if (onPredict) {
                        onPredict(data, blob);
                    }
                }
            } catch (err) {
                console.error("Live prediction error", err);
            }
        }, 'image/jpeg', 0.7);
    }, [videoRef, canvasRef, onPredict]);

    const startStreaming = useCallback(() => {
        if (!isStreaming) {
            setIsStreaming(true);
            captureAndSend(); 
            intervalRef.current = setInterval(captureAndSend, 2500);
        }
    }, [captureAndSend, isStreaming]);

    const stopStreaming = useCallback(() => {
        setIsStreaming(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    return { startStreaming, stopStreaming, isStreaming, severity, confidence };
}
