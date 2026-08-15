import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchPushToUser } from '@/lib/push'

// A delayed scheduler run can still pick up a reminder that became due just
// before its previous tick. Claims make overlapping scans safe.
const REMINDER_GRACE_MS = 15 * 60 * 1000

export type ReminderScanResult = {
  processed: number
  delivered: number
  failed: number
  scanned: number
}

export async function checkDueReminders(): Promise<ReminderScanResult> {
  const admin = createAdminClient()
  const now = new Date()
  const reminderWindowStart = new Date(now.valueOf() - REMINDER_GRACE_MS)
  const { data: candidates, error } = await admin
    .from('tasks')
    .select('id,user_id,title,due_at')
    .eq('is_completed', false)
    .is('reminder_sent_at', null)
    .gt('due_at', reminderWindowStart.toISOString())
    .lte('due_at', now.toISOString())
    .limit(200)

  if (error) throw new Error(error.message)

  let processed = 0
  let delivered = 0
  let failed = 0
  for (const task of candidates ?? []) {
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
        title: 'Task due now',
        body: `“${task.title}” is due now.`,
        url: '/dashboard',
        tag: `task-${task.id}`,
      })
      delivered += result.delivered
      failed += result.failed
    } catch (pushError) {
      failed += 1
      console.error('Unable to send task reminder', { taskId: task.id, pushError })
      await admin.from('tasks').update({ reminder_sent_at: null }).eq('id', task.id)
    }
  }

  return { processed, delivered, failed, scanned: candidates?.length ?? 0 }
}
