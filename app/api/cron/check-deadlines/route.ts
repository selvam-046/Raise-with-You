import { NextResponse } from 'next/server'
import { checkDueReminders } from '@/lib/reminders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    return NextResponse.json(await checkDueReminders())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to scan reminders.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
