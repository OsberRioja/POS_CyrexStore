// src/hooks/usePermissions.ts
import { useAuth } from '../context/authContext';
import type { PermissionType } from '../types/permissions';
import { getPermissionsForRole } from '../types/permissions';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: PermissionType): boolean => {
    if (!user) return false;
    
    const userPermissions = getPermissionsForRole(user.role);
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: PermissionType[]): boolean => {
    if (!user) return false;
    
    const userPermissions = getPermissionsForRole(user.role);
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: PermissionType[]): boolean => {
    if (!user) return false;
    
    const userPermissions = getPermissionsForRole(user.role);
    return permissions.every(permission => userPermissions.includes(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: user ? getPermissionsForRole(user.role) : [],
    role: user?.role
  };
}