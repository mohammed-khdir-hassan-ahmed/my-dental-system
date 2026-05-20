import { NextRequest, NextResponse } from 'next/server'
import { asc, desc, eq, gt, inArray } from 'drizzle-orm'
import { db } from '@/db/drizzle'
import { adminNotificationsTable } from '@/db/schema'
import { getSessionUser, isAdminUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!isAdminUser(user)) {
      return NextResponse.json({ message: 'ڕێگەپێنەدراو' }, { status: 403 })
    }

    const afterIdParam = request.nextUrl.searchParams.get('afterId')
    const afterId = afterIdParam ? parseInt(afterIdParam, 10) : 0

    if (afterId > 0) {
      const rows = await db
        .select()
        .from(adminNotificationsTable)
        .where(gt(adminNotificationsTable.id, afterId))
        .orderBy(asc(adminNotificationsTable.id))
        .limit(50)

      return NextResponse.json({ notifications: mapRows(rows) })
    }

    const rows = await db
      .select()
      .from(adminNotificationsTable)
      .where(eq(adminNotificationsTable.read, false))
      .orderBy(desc(adminNotificationsTable.createdAt))
      .limit(50)

    return NextResponse.json({ notifications: mapRows(rows) })
  } catch (error) {
    console.error('GET admin notifications error:', error)
    return NextResponse.json({ message: 'هەڵەیەک ڕویدا' }, { status: 500 })
  }
}

function mapRows(
  rows: (typeof adminNotificationsTable.$inferSelect)[]
) {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    userEmail: row.userEmail,
    userId: row.userId,
    loginMethod: row.loginMethod,
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }))
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!isAdminUser(user)) {
      return NextResponse.json({ message: 'ڕێگەپێنەدراو' }, { status: 403 })
    }

    const body = await request.json()
    const ids: number[] = Array.isArray(body?.ids) ? body.ids : []
    const markAll = body?.markAll === true

    if (markAll) {
      await db
        .update(adminNotificationsTable)
        .set({ read: true })
        .where(eq(adminNotificationsTable.read, false))
    } else if (ids.length > 0) {
      await db
        .update(adminNotificationsTable)
        .set({ read: true })
        .where(inArray(adminNotificationsTable.id, ids))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH admin notifications error:', error)
    return NextResponse.json({ message: 'هەڵەیەک ڕویدا' }, { status: 500 })
  }
}
