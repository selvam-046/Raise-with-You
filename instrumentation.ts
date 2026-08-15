declare global {
  // Keep hot reloads from creating more than one local reminder scheduler.
  var nexusReminderScheduler: ReturnType<typeof setInterval> | undefined
}

export async function register() {
  // Vercel Cron invokes the protected route in production. In local development
  // keep the Next.js process scanning so Web Push can alert after the browser
  // window has been closed.
  if (process.env.NODE_ENV !== 'development' || globalThis.nexusReminderScheduler) return

  const { checkDueReminders } = await import('@/lib/reminders')
  const scan = () => void checkDueReminders().catch((error) => console.error('Local reminder scan failed', error))
  scan()
  globalThis.nexusReminderScheduler = setInterval(scan, 30_000)
}
