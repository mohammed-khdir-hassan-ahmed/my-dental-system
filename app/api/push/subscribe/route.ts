import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { pushSubscriptionsTable } from '@/db/schema'
import { getSessionUser, isAdminUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/** تۆمارکردنی push subscription بۆ ئەدمین */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!isAdminUser(user)) {
      return NextResponse.json({ message: 'تەنها ئەدمین دەتوانێت subscribe بکات' }, { status: 403 })
    }

    const body = await request.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ message: 'داتای subscription ناتەواوە' }, { status: 400 })
    }

    // ئەگەر ئەم endpoint ە پێشتر هەبێت، نوێی بکەرەوە
    const existing = await db
      .select()
      .from(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.endpoint, endpoint))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(pushSubscriptionsTable)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
          userId: user!.id,
        })
        .where(eq(pushSubscriptionsTable.endpoint, endpoint))
    } else {
      await db.insert(pushSubscriptionsTable).values({
        userId: user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json({ message: 'هەڵەیەک ڕویدا' }, { status: 500 })
  }
}

/** سڕینەوەی push subscription */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!isAdminUser(user)) {
      return NextResponse.json({ message: 'ڕێگەپێنەدراو' }, { status: 403 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (endpoint) {
      await db
        .delete(pushSubscriptionsTable)
        .where(eq(pushSubscriptionsTable.endpoint, endpoint))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json({ message: 'هەڵەیەک ڕویدا' }, { status: 500 })
  }
}
