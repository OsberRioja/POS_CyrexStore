// src/components/PermissionGuard.tsx
import type { ReactNode } from 'react'; // ← Agregar 'type'
import { usePermissions } from '../hooks/usePermissions';
//import { Permission } from '../types/permissions';
import type { PermissionType } from '../types/permissions';

interface PermissionGuardProps {
  permission: PermissionType;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componente para múltiples permisos (OR lógico)
interface AnyPermissionGuardProps {
  permissions: PermissionType[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AnyPermissionGuard({ 
  permissions, 
  children, 
  fallback = null 
}: AnyPermissionGuardProps) {
  const { hasAnyPermission } = usePermissions();

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componente para múltiples permisos (AND lógico)
interface AllPermissionsGuardProps {
  permissions: PermissionType[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AllPermissionsGuard({ 
  permissions, 
  children, 
  fallback = null 
}: AllPermissionsGuardProps) {
  const { hasAllPermissions } = usePermissions();

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}