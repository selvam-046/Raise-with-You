'use server'

import { createClient } from '@/lib/supabase/server'
import { dispatchPushToUser } from '@/lib/push'

export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } }

export async function savePushSubscription(subscription: PushSubscriptionInput) {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) throw new Error('Invalid push subscription.')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in.')
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  }, { onConflict: 'endpoint' })
  if (error) throw new Error(`Unable to save your device: ${error.message}`)
}

export async function sendTestPushNotification() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in.')

  const result = await dispatchPushToUser(user.id, {
    title: 'Nexus test alert',
    body: 'Device alerts are working.',
    url: '/dashboard',
    tag: 'nexus-test',
  })

  if (!result.attempted) throw new Error('No device subscription was found. Enable device alerts again and retry.')
  if (!result.delivered) throw new Error('The push service did not accept the test alert. Check the server logs for the delivery error.')
}
