import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider';
import { usePermissions } from '../hooks/usePermissions';

const PrivateRoute = ({ 
  children, 
  allowedRoles = [], 
  requiredPermissions = [],
  anyPermission = false 
}) => {
  const { user, token } = useStateContext();
  const { hasAnyPermission, hasAllPermissions, isAdmin, isManager, isEmployee } = usePermissions();

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access first (if specified)
  if (allowedRoles.length > 0) {
    const userRole = user?.role?.name?.toLowerCase();
    const userRoleId = user?.role_id;
    
    const hasRoleAccess = allowedRoles.some(role => {
      const roleLower = role?.toLowerCase();
      if (roleLower === 'admin') {
        return userRoleId === 1 || userRole === 'admin' || isAdmin();
      }
      if (roleLower === 'manager') {
        return userRoleId === 2 || userRole === 'manager' || isManager();
      }
      if (roleLower === 'employee') {
        return userRoleId === 3 || userRole === 'employee' || isEmployee();
      }
      return userRole === roleLower;
    });

    if (!hasRoleAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission-based access (if specified)
  if (requiredPermissions.length > 0) {
    const hasPermissionAccess = anyPermission
      ? hasAnyPermission(requiredPermissions)
      : hasAllPermissions(requiredPermissions);

    if (!hasPermissionAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If no restrictions, allow access (private route for authenticated users)
  return children;
};

export default PrivateRoute;
