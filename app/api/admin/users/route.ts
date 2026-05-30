import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { usersTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser, isAdminUser } from '@/lib/auth'
import {
  DEFAULT_USER_PERMISSIONS,
  getAllPermissions,
  parsePermissions,
  serializePermissions,
  type UserPermissions,
  type UserRole,
} from '@/lib/permissions'

export const dynamic = 'force-dynamic'

function sanitizeUser(row: typeof usersTable.$inferSelect) {
  const role = (row.role as UserRole) || 'user'
  return {
    id: row.id,
    email: row.email,
    role,
    permissions:
      role === 'admin' ? getAllPermissions(true) : parsePermissions(row.permissions),
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request)
    if (!isAdminUser(session)) {
      return NextResponse.json({ message: 'دەسەڵاتت نییە' }, { status: 403 })
    }

    const users = await db.select().from(usersTable).orderBy(usersTable.id)
    return NextResponse.json(users.map(sanitizeUser))
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ message: 'هەڵە لە هێنانی بەکارهێنەران' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request)
    if (!isAdminUser(session)) {
      return NextResponse.json({ message: 'دەسەڵاتت نییە' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, role = 'user', permissions } = body as {
      email: string
      password: string
      role?: UserRole
      permissions?: UserPermissions
    }

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ message: 'ئیمەیڵ و وشەی نهێنی پێویستن' }, { status: 400 })
    }

    const userRole: UserRole = role === 'admin' ? 'admin' : 'user'
    const permissionsJson =
      userRole === 'admin'
        ? serializePermissions(getAllPermissions(true))
        : serializePermissions({ ...DEFAULT_USER_PERMISSIONS, ...permissions })

    const created = await db
      .insert(usersTable)
      .values({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: userRole,
        permissions: permissionsJson,
      })
      .returning()

    return NextResponse.json(sanitizeUser(created[0]), { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ message: 'هەڵە لە دروستکردنی بەکارهێنەر' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser(request)
    if (!isAdminUser(session)) {
      return NextResponse.json({ message: 'دەسەڵاتت نییە' }, { status: 403 })
    }

    const body = await request.json()
    const { id, email, password, role, permissions } = body as {
      id: number
      email?: string
      password?: string
      role?: UserRole
      permissions?: UserPermissions
    }

    if (!id) {
      return NextResponse.json({ message: 'ناسنامەی بەکارهێنەر پێویستە' }, { status: 400 })
    }

    if (session?.id === id && role && role !== 'admin') {
      return NextResponse.json({ message: 'ناتوانیت ڕۆڵی خۆت بگۆڕیت' }, { status: 400 })
    }

    const updateData: Partial<typeof usersTable.$inferInsert> = {}

    if (email !== undefined) updateData.email = email.trim().toLowerCase()
    if (password !== undefined && password.trim()) updateData.password = password.trim()

    if (role !== undefined) {
      updateData.role = role === 'admin' ? 'admin' : 'user'
      if (role === 'admin') {
        updateData.permissions = serializePermissions(getAllPermissions(true))
      }
    }

    if (permissions !== undefined) {
      const effectiveRole = role ?? (await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, id)).limit(1))[0]?.role
      if (effectiveRole !== 'admin') {
        updateData.permissions = serializePermissions({
          ...DEFAULT_USER_PERMISSIONS,
          ...permissions,
        })
      }
    }

    const updated = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, id))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ message: 'بەکارهێنەر نەدۆزرایەوە' }, { status: 404 })
    }

    return NextResponse.json(sanitizeUser(updated[0]))
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ message: 'هەڵە لە نوێکردنەوەی بەکارهێنەر' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionUser(request)
    if (!isAdminUser(session)) {
      return NextResponse.json({ message: 'دەسەڵاتت نییە' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '', 10)

    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: 'ناسنامەی بەکارهێنەر پێویستە' }, { status: 400 })
    }

    if (session?.id === id) {
      return NextResponse.json({ message: 'ناتوانیت خۆت بسڕیتەوە' }, { status: 400 })
    }

    await db.delete(usersTable).where(eq(usersTable.id, id))
    return NextResponse.json({ message: 'سەرکەوتوو سڕایەوە' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ message: 'هەڵە لە سڕینەوەی بەکارهێنەر' }, { status: 500 })
  }
}
