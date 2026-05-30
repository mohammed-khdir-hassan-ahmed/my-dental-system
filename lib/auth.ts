import { NextRequest } from 'next/server'
import { db } from '@/db/drizzle'
import { usersTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  OTP_USER_PERMISSIONS,
  resolvePermissions,
  type UserPermissions,
  type UserRole,
} from '@/lib/permissions'

export type SessionUser = {
  id: number
  email: string
  role: UserRole
  permissions: UserPermissions
  isOTPLogin: boolean
  isAdmin: boolean
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const sessionId = request.cookies.get('sessionId')?.value
  const otpSession = request.cookies.get('session')?.value

  if (otpSession && !sessionId) {
    return {
      id: 0,
      email: '*****',
      role: 'user',
      permissions: OTP_USER_PERMISSIONS,
      isOTPLogin: true,
      isAdmin: false,
    }
  }

  if (!sessionId) return null

  const userId = parseInt(sessionId, 10)
  if (!Number.isFinite(userId)) return null

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1)

  if (rows.length === 0) return null

  const user = rows[0]
  const role = (user.role as UserRole) || 'user'
  const permissions = resolvePermissions(role, user.permissions, false)

  return {
    id: user.id,
    email: user.email,
    role,
    permissions,
    isOTPLogin: false,
    isAdmin: role === 'admin',
  }
}

export function isAdminUser(user: SessionUser | null): boolean {
  return Boolean(user?.isAdmin)
}
