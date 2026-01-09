// PrivateRoute.js
import React from 'react';
import { Route, Navigate } from 'react-router-dom';

const PrivateRoute = ({ element, roles }) => {
  // Replace this logic with your actual authentication and authorization logic
  const isAuthenticated = true; // Example: Check if the user is authenticated
  const userRoles = ['admin']; // Example: User roles

  // Check if the user is authenticated and has the required roles
  if (isAuthenticated && roles.every(role => userRoles.includes(role))) {
    return <Route element={element} />;
  } else {
    // Redirect to the login page if not authenticated
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;
