'use client'

import { useEffect, useState } from 'react'
import { savePushSubscription } from '@/app/actions/subscriptions'

type Status = 'checking' | 'ready' | 'loading' | 'enabled' | 'denied' | 'unsupported' | 'error'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

function sameApplicationServerKey(subscription: PushSubscription, publicKey: string) {
  const currentKey = subscription.options.applicationServerKey
  if (!currentKey) return false
  const expected = urlBase64ToUint8Array(publicKey)
  const received = new Uint8Array(currentKey)
  return received.length === expected.length && received.every((value, index) => value === expected[index])
}

function readablePushError(error: unknown) {
  if (!(error instanceof DOMException)) return 'We could not secure this device. Please try again.'
  if (error.name === 'AbortError') return 'Your browser could not reach its push service. Check your connection, VPN, proxy, or ad blocker, then retry.'
  if (error.name === 'InvalidStateError') return 'The device is not ready for Push yet. Please try again in a few seconds.'
  if (error.name === 'InvalidAccessError') return 'The VAPID public key is invalid or does not match this app. Generate and deploy a new matching key pair.'
  if (error.name === 'NotAllowedError') return 'Notification permission was blocked by your browser settings.'
  return error.message || 'We could not secure this device. Please try again.'
}

export function PushRegister({ disabledReason }: { disabledReason?: string | null }) {
  const [status, setStatus] = useState<Status>('checking')
  const [errorMessage, setErrorMessage] = useState('')
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (disabledReason) return <div className="push-status denied">{disabledReason}</div>

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !publicKey) {
      setStatus('unsupported')
      return
    }
    setStatus(Notification.permission === 'granted' ? 'ready' : Notification.permission === 'denied' ? 'denied' : 'ready')
  }, [publicKey])

  async function enable() {
    if (!publicKey) return setStatus('unsupported')
    if (!window.isSecureContext) {
      setErrorMessage('Push requires HTTPS. Use localhost for development or deploy behind HTTPS.')
      setStatus('error')
      return
    }
    if (publicKey === 'your-vapid-public-key') {
      setErrorMessage('Add a real NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local, then restart Next.js.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMessage('')
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      // subscribe() requires an active worker. `ready` also prevents a freshly
      // installed worker from racing the browser's native push registration.
      const registration = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return setStatus('denied')
      const existing = await registration.pushManager.getSubscription()
      // A subscription made with an old VAPID identity cannot be delivered by
      // the current server, so replace it instead of silently saving a mismatch.
      if (existing && !sameApplicationServerKey(existing, publicKey)) await existing.unsubscribe()
      const subscription = existing && sameApplicationServerKey(existing, publicKey)
        ? existing
        : await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('The browser returned an incomplete subscription.')
      await savePushSubscription({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } })
      setStatus('enabled')
    } catch (error) {
      console.error('Push setup failed', error)
      setErrorMessage(readablePushError(error))
      setStatus('error')
    }
  }

  if (status === 'checking') return <div className="push-status muted">Checking device support…</div>
  if (status === 'enabled') return <div className="push-status success"><span>●</span> Secure device alerts active</div>
  if (status === 'unsupported') return <div className="push-status muted">Push isn’t available in this browser or environment.</div>
  if (status === 'denied') return <button className="push-status denied" onClick={enable}>Notifications blocked · Update browser settings</button>
  if (status === 'error') return <button className="push-status denied" title={errorMessage} onClick={enable}><span className="error-dot">●</span>{errorMessage || 'Try device alerts again'}</button>
  return <button className="push-status" onClick={enable} disabled={status === 'loading'}><span className="ring">{status === 'loading' ? '◌' : '◉'}</span>{status === 'loading' ? 'Securing this device…' : 'Enable device alerts'}</button>
}
