import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, token } = useStateContext();

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If no roles required, allow access (private route for authenticated users)
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user has required role
  // Admin is identified by role_id === 1
  const isAdmin = user?.role_id === 1;
  const userRole = user?.role?.name?.toLowerCase();
  
  // Check role by role_id (for admin) or role name
  const hasAccess = allowedRoles.some(role => {
    if (role === 'admin') {
      return isAdmin;
    }
    return userRole === role?.toLowerCase();
  });

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;