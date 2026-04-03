/**
 * AppContext — global application state context.
 * Manages patients, predictions, routing, and hospital notifications.
 */
import { createContext, useContext, useState, useCallback } from "react";
import { predictPatient, routePatient, notifyHospital } from "../services/api";

const AppContext = createContext(null);

/**
 * AppProvider wraps the app and exposes global state + actions.
 */
export function AppProvider({ children }) {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [routingResult, setRoutingResult] = useState(null);
  const [notificationResult, setNotificationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Submit patient data for prediction
  const submitPatient = useCallback(async (patientData) => {
    setIsProcessing(true);
    setError(null);
    try {
      setCurrentPatient(patientData);
      const prediction = await predictPatient(patientData);
      setPredictionResult(prediction);
      return prediction;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Route patient to best hospital
  const routeCurrentPatient = useCallback(async (prediction) => {
    setIsProcessing(true);
    setError(null);
    try {
      const routing = await routePatient(prediction || predictionResult);
      setRoutingResult(routing);
      return routing;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [predictionResult]);

  // Notify hospital about incoming patient
  const notifySelectedHospital = useCallback(async (hospitalId, bookingData) => {
    setIsProcessing(true);
    setError(null);
    try {
      const notification = await notifyHospital(hospitalId, currentPatient, bookingData);
      setNotificationResult(notification);
      return notification;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [currentPatient]);

  // Reset the triage pipeline
  const resetPipeline = useCallback(() => {
    setCurrentPatient(null);
    setPredictionResult(null);
    setRoutingResult(null);
    setNotificationResult(null);
    setError(null);
  }, []);

  const value = {
    currentPatient,
    predictionResult,
    routingResult,
    notificationResult,
    isProcessing,
    error,
    submitPatient,
    routeCurrentPatient,
    notifySelectedHospital,
    resetPipeline,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
}

export default AppContext;
