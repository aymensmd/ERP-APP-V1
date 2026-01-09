import Axios from 'axios';

const axios = Axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Include CSRF token from meta tag if it exists
const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
if (csrfTokenMeta) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfTokenMeta.getAttribute('content');
}

// Request interceptor to add token and company context dynamically
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add company context to all requests
    const companyId = localStorage.getItem('current_company_id');
    if (companyId) {
      config.headers['X-Company-ID'] = companyId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and unwrap Laravel API resources
axios.interceptors.response.use(
  (response) => {
    // Laravel API Resources wrap collections in a 'data' key
    // Unwrap it for easier access in components
    if (response.data && typeof response.data === 'object') {
      // If response has a 'data' key and it's an array (Laravel collection response)
      if (response.data.data !== undefined && Array.isArray(response.data.data)) {
        response.data = response.data.data;
      }
      // If response has only 'data' key and it's an object (single resource response)
      // Keep it as is, but components can access response.data directly
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ACCESS_TOKEN');
      localStorage.removeItem('USER');
      localStorage.removeItem('USER_DATA');
      localStorage.removeItem('USER_ID');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
