import { useMemo } from 'react';
import { useStateContext } from '../contexts/ContextProvider';

/**
 * Hook to check user permissions
 * @returns {Object} Permission checking utilities
 */
export const usePermissions = () => {
  const { user } = useStateContext();

  // Get user permissions from user object
  const permissions = useMemo(() => {
    const userPermissions = user?.permissions;
    
    // Ensure permissions is always an array
    if (!userPermissions) {
      return [];
    }
    
    // If it's already an array, return it
    if (Array.isArray(userPermissions)) {
      return userPermissions;
    }
    
    // If it's a string (from localStorage), try to parse it
    if (typeof userPermissions === 'string') {
      try {
        const parsed = JSON.parse(userPermissions);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing permissions:', e);
        return [];
      }
    }
    
    // If it's an object, convert it to an array (might be an object with permission names as keys)
    if (typeof userPermissions === 'object') {
      return Object.values(userPermissions);
    }
    
    // Fallback to empty array
    return [];
  }, [user]);

  /**
   * Check if user has a specific permission
   * @param {string} permissionName - Name of the permission to check
   * @returns {boolean}
   */
  const hasPermission = (permissionName) => {
    if (!permissionName) return false;
    
    // Admin has all permissions
    if (isAdmin()) {
      return true;
    }
    
    // Safety check: ensure permissions is an array
    if (!Array.isArray(permissions)) {
      console.warn('Permissions is not an array:', permissions);
      return false;
    }
    
    return permissions.includes(permissionName);
  };

  /**
   * Check if user has any of the given permissions
   * @param {string[]} permissionNames - Array of permission names to check
   * @returns {boolean}
   */
  const hasAnyPermission = (permissionNames) => {
    if (!Array.isArray(permissionNames) || permissionNames.length === 0) {
      return false;
    }
    
    // Admin has all permissions
    if (isAdmin()) {
      return true;
    }
    
    // Safety check: ensure permissions is an array
    if (!Array.isArray(permissions)) {
      console.warn('Permissions is not an array:', permissions);
      return false;
    }
    
    return permissionNames.some(permission => permissions.includes(permission));
  };

  /**
   * Check if user has all of the given permissions
   * @param {string[]} permissionNames - Array of permission names to check
   * @returns {boolean}
   */
  const hasAllPermissions = (permissionNames) => {
    if (!Array.isArray(permissionNames) || permissionNames.length === 0) {
      return false;
    }
    
    // Admin has all permissions
    if (isAdmin()) {
      return true;
    }
    
    // Safety check: ensure permissions is an array
    if (!Array.isArray(permissions)) {
      console.warn('Permissions is not an array:', permissions);
      return false;
    }
    
    return permissionNames.every(permission => permissions.includes(permission));
  };

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = () => {
    const roleName = user?.role?.name?.toLowerCase();
    const roleSlug = user?.role?.slug?.toLowerCase();
    return user?.role_id === 1 || roleName === 'admin' || roleSlug === 'admin';
  };

  /**
   * Check if user is manager (role_id === 2, typically)
   * @returns {boolean}
   */
  const isManager = () => {
    return user?.role_id === 2;
  };

  /**
   * Check if user is employee (role_id === 3, typically)
   * @returns {boolean}
   */
  const isEmployee = () => {
    return user?.role_id === 3;
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isEmployee,
  };
};

