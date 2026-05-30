'use client'

import { useUser } from '@/contexts/user-context'
import {
  hasPermission,
  type PermissionKey,
  type UserPermissions,
} from '@/lib/permissions'

export function usePermissions() {
  const { user, loading } = useUser()

  const can = (key: PermissionKey) => {
    if (!user) return false
    return hasPermission(user.role, user.permissions, key)
  }

  return {
    loading,
    user,
    isAdmin: user?.isAdmin ?? false,
    permissions: (user?.permissions ?? {}) as UserPermissions,
    can,
  }
}
