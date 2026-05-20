export const PERMISSION_KEYS = [
  'dashboard',
  'appointments',
  'seller',
  'staff',
  'installments',
  'expenses',
  'reports_expenses',
  'reports_employees',
  'reports_installments',
  'reports_sales',
  'settings',
  'manage_users',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]
export type UserPermissions = Record<PermissionKey, boolean>
export type UserRole = 'admin' | 'user'

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'داشبۆرد',
  appointments: 'سەرەبڕین (نەخۆش)',
  seller: 'بەشی فرۆشتن',
  staff: 'کارمەندەکان و موچە',
  installments: 'قیستەکان',
  expenses: 'خەرجیەکان',
  reports_expenses: 'ڕاپۆرتی خەرجیەکان',
  reports_employees: 'ڕاپۆرتی کارمەندەکان',
  reports_installments: 'ڕاپۆرتی قیستەکان',
  reports_sales: 'ڕاپۆرتی فرۆشتن',
  settings: 'ڕێکخستنەکان',
  manage_users: 'بەکارهێنەرەکان',
}

export const ROUTE_PERMISSIONS: Record<string, PermissionKey> = {
  '/dashboard': 'dashboard',
  '/dashboard/appointments': 'appointments',
  '/dashboard/seller': 'seller',
  '/dashboard/staff': 'staff',
  '/dashboard/installments': 'installments',
  '/dashboard/expenses': 'expenses',
  '/dashboard/reports': 'reports_expenses',
  '/dashboard/settings': 'settings',
  '/dashboard/admin/users': 'manage_users',
}

export function getAllPermissions(value = true): UserPermissions {
  return PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = value
    return acc
  }, {} as UserPermissions)
}

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  dashboard: true,
  appointments: true,
  seller: false,
  staff: false,
  installments: false,
  expenses: false,
  reports_expenses: false,
  reports_employees: false,
  reports_installments: false,
  reports_sales: false,
  settings: true,
  manage_users: false,
}

export const OTP_USER_PERMISSIONS: UserPermissions = {
  ...DEFAULT_USER_PERMISSIONS,
  dashboard: true,
  appointments: true,
  settings: false,
  manage_users: false,
}

export function parsePermissions(raw: string | null | undefined): UserPermissions {
  if (!raw) return { ...DEFAULT_USER_PERMISSIONS }
  try {
    const parsed = JSON.parse(raw) as Partial<UserPermissions>
    return { ...DEFAULT_USER_PERMISSIONS, ...parsed }
  } catch {
    return { ...DEFAULT_USER_PERMISSIONS }
  }
}

export function serializePermissions(permissions: UserPermissions): string {
  return JSON.stringify(permissions)
}

export function resolvePermissions(
  role: UserRole | string | null | undefined,
  permissionsJson?: string | null,
  isOTPLogin = false,
): UserPermissions {
  if (isOTPLogin) return { ...OTP_USER_PERMISSIONS }
  if (role === 'admin') return getAllPermissions(true)
  return parsePermissions(permissionsJson)
}

export function hasPermission(
  role: UserRole | string | null | undefined,
  permissions: UserPermissions,
  key: PermissionKey,
): boolean {
  if (role === 'admin') return true
  return Boolean(permissions[key])
}

export function canAccessPath(
  pathname: string,
  role: UserRole | string | null | undefined,
  permissions: UserPermissions,
): boolean {
  if (role === 'admin') return true

  if (pathname.startsWith('/dashboard/admin')) {
    return hasPermission(role, permissions, 'manage_users')
  }

  if (pathname.startsWith('/dashboard/staff')) {
    return hasPermission(role, permissions, 'staff')
  }

  if (pathname.startsWith('/dashboard/reports')) {
    const params = new URLSearchParams(pathname.includes('?') ? pathname.split('?')[1] : '')
    const type = params.get('type')
    if (type === 'employees') return hasPermission(role, permissions, 'reports_employees')
    if (type === 'installments') return hasPermission(role, permissions, 'reports_installments')
    if (type === 'sales') return hasPermission(role, permissions, 'reports_sales')
    return hasPermission(role, permissions, 'reports_expenses')
  }

  const basePath = pathname.split('?')[0]
  const key = ROUTE_PERMISSIONS[basePath]
  if (!key) return true
  return hasPermission(role, permissions, key)
}
