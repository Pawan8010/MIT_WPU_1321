/**
 * useApi hook — wraps API calls with loading/error state management.
 */
import { useState, useCallback } from "react";

/**
 * Generic API call wrapper with state management.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(predictPatient);
 *   // then: execute(patientData);
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const message = err?.message || "API call failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

export default useApi;
