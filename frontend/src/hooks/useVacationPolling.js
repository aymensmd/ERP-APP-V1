import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../axios';
import { useAuthCheck } from './useAuthCheck';
import { useRetryLogic } from './useRetryLogic';

export const useVacationPolling = (userId, interval = 30000) => {
  const [vacations, setVacations] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isAuthenticated = useAuthCheck();
  const intervalRef = useRef(null);
  const isMounted = useRef(true);
  const [isPolling, setIsPolling] = useState(true);

  const fetchVacations = useCallback(async () => {
    if (!isAuthenticated || isLoading || !isPolling) return;

    try {
      setIsLoading(true);
      setError(null);

      // Token is handled by axios interceptor
      const response = await axios.get(`/vacations?user_id=${userId}`);

      if (isMounted.current) {
        setVacations(response.data);
      }
    } catch (error) {
      if (isMounted.current) {
        setError(error.response?.data?.message || error.message);
        setIsPolling(false); // Stop polling on error
        // 401 handling is done by axios interceptor
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [userId, isLoading, isAuthenticated, isPolling]);

  // Wrap fetchVacations with retry logic
  const { executeWithRetry } = useRetryLogic(fetchVacations);

  useEffect(() => {
    isMounted.current = true;

    if (!isPolling) return; // Skip polling if disabled

    // Initial fetch
    executeWithRetry();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (isPolling) executeWithRetry();
    }, interval);

    // Cleanup
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [executeWithRetry, interval, isPolling]);

  const refresh = useCallback(() => {
    setIsPolling(true); // Re-enable polling if it was stopped
    executeWithRetry();
  }, [executeWithRetry]);

  return {
    vacations,
    error,
    isLoading,
    refresh,
  };
};