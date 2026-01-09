import { useState, useEffect, useCallback } from 'react';
import axios from '../axios';

export const useRealTimeData = (url, interval = 30000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Convert full URL to relative path if needed (strip http://host/api part)
      let requestUrl = url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Extract path after /api/ or just the path
        const match = url.match(/\/api(\/.+)$/);
        requestUrl = match ? match[1] : url.replace(/^https?:\/\/[^\/]+\/api/, '');
      }
      // Ensure it starts with /
      if (!requestUrl.startsWith('/')) {
        requestUrl = '/' + requestUrl;
      }
      
      const response = await axios.get(requestUrl);
      // Response data is already unwrapped by axios interceptor
      const responseData = Array.isArray(response.data) ? response.data : (typeof response.data === 'object' && response.data !== null ? response.data : []);
      setData(responseData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      // Don't stop polling on 401, let the interceptor handle it
      if (err.response?.status !== 401) {
        setIsPolling(false); // Stop polling on other errors
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!isPolling) return;

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [fetchData, interval, isPolling]);

  const refresh = useCallback(() => {
    setIsPolling(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};