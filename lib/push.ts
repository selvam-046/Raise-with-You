import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

type Subscription = { endpoint: string; p256dh: string; auth: string }

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) throw new Error('VAPID keys are not configured.')
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:operations@example.com', publicKey, privateKey)
}

export async function dispatchPushToUser(userId: string, payload: { title: string; body: string; url: string; tag?: string }) {
  configureWebPush()
  const admin = createAdminClient()
  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth')
    .eq('user_id', userId)

  if (error) throw new Error(`Unable to load subscriptions: ${error.message}`)
  const results = await Promise.allSettled((subscriptions ?? []).map(async (subscription: Subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 },
      )
      return 'sent'
    } catch (error: unknown) {
      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode?: number }).statusCode : undefined
      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
        return 'pruned'
      }
      throw error
    }
  }))

  return {
    attempted: subscriptions?.length ?? 0,
    delivered: results.filter((result) => result.status === 'fulfilled' && result.value === 'sent').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  }
}
