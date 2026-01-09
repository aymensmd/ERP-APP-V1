import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('ACCESS_TOKEN'); // Ensure consistent key usage
      const isAuth = !!token;
      setIsAuthenticated(isAuth);

      if (!isAuth) {
        console.warn('User is not authenticated. Redirecting to login.');
        navigate('/login');
      }
    };

    checkAuth();

    // Add event listener for storage changes
    const handleStorageChange = (event) => {
      if (event.key === 'ACCESS_TOKEN') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  return isAuthenticated;
};