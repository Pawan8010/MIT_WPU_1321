/**
 * AppContext — global application state context.
 *
 * Provides shared state for:
 *   - patient data
 *   - prediction results
 *   - hospital routing
 *   - loading/error states
 *
 * Works alongside the existing Zustand store for backward compatibility.
 */
import { createContext, useContext, useState, useCallback } from "react";
import { predictPatient, routePatient, notifyHospital } from "../services/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [patientData, setPatientData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [routing, setRouting] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [loading, setLoading] = useState({
    prediction: false,
    routing: false,
    notification: false,
  });
  const [errors, setErrors] = useState({});

  const setLoadingState = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const setErrorState = (key, value) => {
    setErrors((prev) => ({ ...prev, [key]: value }));
  };

  // Run prediction on patient data
  const runPrediction = useCallback(async (data) => {
    setLoadingState("prediction", true);
    setErrorState("prediction", null);
    try {
      const result = await predictPatient(data);
      setPrediction(result);
      setPatientData(data);
      return result;
    } catch (err) {
      setErrorState("prediction", err.message);
      throw err;
    } finally {
      setLoadingState("prediction", false);
    }
  }, []);

  // Run hospital routing
  const runRouting = useCallback(async (predictionData) => {
    setLoadingState("routing", true);
    setErrorState("routing", null);
    try {
      const result = await routePatient(predictionData || prediction);
      setRouting(result);
      return result;
    } catch (err) {
      setErrorState("routing", err.message);
      throw err;
    } finally {
      setLoadingState("routing", false);
    }
  }, [prediction]);

  // Notify hospital
  const sendNotification = useCallback(async (hospital) => {
    setLoadingState("notification", true);
    setErrorState("notification", null);
    try {
      const result = await notifyHospital(hospital.id, patientData, {
        hospitalName: hospital.name,
        eta: hospital.eta,
      });
      setSelectedHospital(hospital);
      return result;
    } catch (err) {
      setErrorState("notification", err.message);
      throw err;
    } finally {
      setLoadingState("notification", false);
    }
  }, [patientData]);

  // Reset all state
  const resetAll = useCallback(() => {
    setPatientData(null);
    setPrediction(null);
    setRouting(null);
    setSelectedHospital(null);
    setErrors({});
  }, []);

  const value = {
    patientData,
    setPatientData,
    prediction,
    setPrediction,
    routing,
    setRouting,
    selectedHospital,
    setSelectedHospital,
    loading,
    errors,
    runPrediction,
    runRouting,
    sendNotification,
    resetAll,
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
