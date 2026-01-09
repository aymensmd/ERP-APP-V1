import { useState, useCallback, useRef, useEffect } from 'react';

export const useRetryLogic = (callback, maxRetries = 3, baseDelay = 1000) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef(null);

  const executeWithRetry = useCallback(async () => {
    if (isRetrying) return;

    try {
      setIsRetrying(true);
      await callback();
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout with exponential backoff
        timeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          executeWithRetry();
        }, delay);
      } else {
        console.error('Max retries reached:', error);
        throw error; // Re-throw after max retries
      }
    } finally {
      setIsRetrying(false);
    }
  }, [callback, retryCount, maxRetries, baseDelay, isRetrying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    executeWithRetry,
    retryCount,
    isRetrying,
    resetRetries: () => setRetryCount(0),
  };
};