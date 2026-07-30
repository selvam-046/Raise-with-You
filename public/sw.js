self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload = {}
  try { payload = event.data.json() } catch { payload = { body: event.data.text() } }
  const data = payload || {}
  event.waitUntil(self.registration.showNotification(data.title || 'Nexus reminder', {
    body: data.body || 'You have an upcoming task.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag || 'nexus-reminder',
    renotify: true,
    data: { url: data.url || '/dashboard' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destination = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url.startsWith(self.location.origin))
    return existing ? existing.focus().then(() => existing.navigate(destination)) : clients.openWindow(destination)
  }))
})
