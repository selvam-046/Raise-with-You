import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const reminderWindow = new Date(now.valueOf() + 60 * 60 * 1000)
  const { data: candidates, error } = await admin
    .from('tasks')
    .select('id,user_id,title,due_at')
    .eq('is_completed', false)
    .is('reminder_sent_at', null)
    .gt('due_at', now.toISOString())
    .lte('due_at', reminderWindow.toISOString())
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let processed = 0
  let delivered = 0
  let failed = 0
  for (const task of candidates ?? []) {
    // Claim the reminder first. The null predicate makes overlapping cron invocations idempotent.
    const { data: claimed } = await admin.from('tasks')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', task.id)
      .is('reminder_sent_at', null)
      .select('id')
      .maybeSingle()
    if (!claimed) continue
    processed += 1
    try {
      const result = await dispatchPushToUser(task.user_id, {
        title: 'Due within the hour',
        body: `“${task.title}” is due soon.`,
        url: '/dashboard',
        tag: `task-${task.id}`,
      })
      delivered += result.delivered
      failed += result.failed
    } catch (pushError) {
      failed += 1
      console.error('Unable to send task reminder', { taskId: task.id, pushError })
      // Release a failed claim while the task is still in the reminder window.
      // A later cron invocation can then retry rather than silently losing the alert.
      await admin.from('tasks').update({ reminder_sent_at: null }).eq('id', task.id)
    }
  }

  return NextResponse.json({ processed, delivered, failed, scanned: candidates?.length ?? 0 })
}
