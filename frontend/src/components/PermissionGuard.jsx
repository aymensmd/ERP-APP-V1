import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * Component to protect routes or sections based on permissions
 * @param {Object} props
 * @param {string|string[]} props.permission - Permission(s) required
 * @param {boolean} props.requireAll - If true, requires all permissions. If false, requires any. Default false.
 * @param {React.ReactNode} props.fallback - Custom fallback if permission denied. Default is 403 page.
 * @param {boolean} props.hide - If true, returns null instead of fallback when denied. Default false.
 * @param {React.ReactNode} props.children
 */
const PermissionGuard = ({ 
  permission, 
  requireAll = false, 
  fallback = null, 
  hide = false,
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } = usePermissions();
  const navigate = useNavigate();

  // Admin bypass
  if (isAdmin()) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (Array.isArray(permission)) {
    hasAccess = requireAll 
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission);
  } else {
    hasAccess = hasPermission(permission);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (hide) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back Home
          </Button>
        }
      />
    </div>
  );
};

export default PermissionGuard;
