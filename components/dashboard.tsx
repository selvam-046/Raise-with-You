'use client'

import { useEffect, useMemo, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { createTask, deleteTask, setTaskCompletion } from '@/app/actions/tasks'
import { signOut } from '@/app/actions/auth'
import { PushRegister } from '@/components/push-register'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

type Task = { id: string; title: string; due_at: string; is_completed: boolean; created_at: string; streak_count: number; reminder_sent_at?: string | null }

const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

function dueState(date: string, complete: boolean) {
  if (complete) return 'done'
  const remaining = new Date(date).valueOf() - Date.now()
  if (remaining < 0) return 'overdue'
  if (remaining < 86_400_000) return 'today'
  return 'upcoming'
}

export function Dashboard({ userId, userEmail, initialTasks, setupError }: { userId: string; userEmail: string; initialTasks: Task[]; setupError?: string | null }) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [isComposerOpen, setComposerOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')
  const [notice, setNotice] = useState('')
  const [pending, startTransition] = useTransition()
  const [syncState, setSyncState] = useState<'connecting' | 'live' | 'offline'>('connecting')

  // A router refresh gives this client component a new server snapshot. Mirror
  // it locally so a successful mutation is visible immediately.
  useEffect(() => { setTasks(initialTasks) }, [initialTasks])

  useEffect(() => {
    if (setupError) { setSyncState('offline'); return }
    let supabase: ReturnType<typeof createSupabaseClient>
    try { supabase = createSupabaseClient() } catch { setSyncState('offline'); return }
    const channel = supabase
      .channel(`nexus-tasks:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, () => router.refresh())
      .subscribe((status) => setSyncState(status === 'SUBSCRIBED' ? 'live' : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'offline' : 'connecting'))
    return () => { void supabase.removeChannel(channel) }
  }, [router, setupError, userId])

  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'all' ? true : filter === 'active' ? !task.is_completed : task.is_completed), [tasks, filter])
  const activeCount = tasks.filter((task) => !task.is_completed).length
  const dueToday = tasks.filter((task) => !task.is_completed && dueState(task.due_at, false) === 'today').length
  const completion = tasks.length ? Math.round((tasks.filter((task) => task.is_completed).length / tasks.length) * 100) : 0

  function refresh(message?: string) {
    if (message) setNotice(message)
    router.refresh()
  }
  function toggle(task: Task) {
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, is_completed: !item.is_completed } : item))
    startTransition(async () => { try { await setTaskCompletion(task.id, !task.is_completed); refresh() } catch { setTasks(initialTasks); setNotice('Could not update that task. Please retry.') } })
  }
  function remove(id: string) {
    const previous = tasks
    setTasks((current) => current.filter((task) => task.id !== id))
    startTransition(async () => { try { await deleteTask(id); refresh('Task removed.') } catch { setTasks(previous); setNotice('Could not remove that task. Please retry.') } })
  }
  function addTask(formData: FormData) {
    const title = String(formData.get('title') ?? '')
    const dueAt = String(formData.get('dueAt') ?? '')
    startTransition(async () => {
      try { await createTask({ title, dueAt }); setComposerOpen(false); refresh('Task added to your command center.') }
      catch (error) { setNotice(error instanceof Error ? error.message : 'Could not create that task.') }
    })
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <a className="brand" href="/dashboard"><span className="brand-mark">N</span> Nexus</a>
        <div className="workspace-label"><span className="avatar">{userEmail.slice(0, 1).toUpperCase()}</span><div><small>PERSONAL WORKSPACE</small><strong>{userEmail.split('@')[0]}</strong></div></div>
        <nav className="side-nav"><a className="active" href="#tasks"><span>⌁</span> My tasks <b>{activeCount}</b></a><a href="#insights"><span>◫</span> Momentum</a><a href="#devices"><span>◉</span> Device alerts</a></nav>
        <div className="sidebar-bottom"><PushRegister disabledReason={setupError} /><form action={signOut}><button className="signout">Sign out <span>↗</span></button></form></div>
      </aside>
      <section className="workspace">
        <header className="workspace-head"><div><p className="eyebrow">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p><h1>Good morning.</h1></div><div className="head-actions"><span className={`sync-state ${syncState}`}><i />{syncState === 'live' ? 'Live sync' : syncState === 'connecting' ? 'Syncing' : 'Offline'}</span><button className="button" disabled={Boolean(setupError)} onClick={() => setComposerOpen(true)}>New task <span>+</span></button></div></header>
        {setupError && <div className="toast setup-toast" role="alert">{setupError}<a href="/setup">Open setup instructions →</a></div>}
        {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
        <section id="insights" className="metric-grid">
          <article className="metric-card emphasis"><div><span>Completion</span><strong>{completion}%</strong><small>{tasks.filter((task) => task.is_completed).length} of {tasks.length || 0} tasks closed</small></div><div className="completion-orbit" style={{ '--progress': `${completion * 3.6}deg` } as CSSProperties}><span>{completion}%</span></div></article>
          <article className="metric-card"><span>In focus</span><strong>{activeCount}</strong><small>Tasks that still need you</small><i>↗</i></article>
          <article className="metric-card alert"><span>Due today</span><strong>{dueToday}</strong><small>{dueToday ? 'Keep the day on your side' : 'A calm runway ahead'}</small><i>◷</i></article>
        </section>
        <section id="tasks" className="tasks-section"><div className="section-head"><div><h2>Your focus queue</h2><p>Clear the signal. Keep moving.</p></div><div className="filters">{(['all', 'active', 'done'] as const).map((option) => <button key={option} className={filter === option ? 'selected' : ''} onClick={() => setFilter(option)}>{option === 'all' ? 'All' : option === 'active' ? 'Open' : 'Complete'}</button>)}</div></div>
          <div className="task-list">
            {visibleTasks.map((task) => { const state = dueState(task.due_at, task.is_completed); return <article className={`task-row ${task.is_completed ? 'completed' : ''}`} key={task.id}><button aria-label={`Mark ${task.title} as ${task.is_completed ? 'open' : 'complete'}`} className="check" onClick={() => toggle(task)} disabled={pending}>{task.is_completed && '✓'}</button><div className="task-copy"><h3>{task.title}</h3><p className={`due ${state}`}><span>{state === 'overdue' ? '!' : state === 'today' ? '◷' : state === 'done' ? '✓' : '○'}</span>{state === 'overdue' ? `Overdue · ${day.format(new Date(task.due_at))}` : state === 'today' ? `Today · ${time.format(new Date(task.due_at))}` : state === 'done' ? 'Completed' : `${day.format(new Date(task.due_at))} · ${time.format(new Date(task.due_at))}`}</p></div><button className="delete-task" aria-label={`Delete ${task.title}`} onClick={() => remove(task.id)} disabled={pending}>×</button></article> })}
            {!visibleTasks.length && <div className="empty-state"><span>✦</span><h3>{filter === 'done' ? 'No completed tasks yet.' : 'The queue is clear.'}</h3><p>{filter === 'done' ? 'Completed work will be recorded here.' : 'Give your next priority a place to land.'}</p>{filter !== 'done' && <button onClick={() => setComposerOpen(true)}>Add your first task →</button>}</div>}
          </div>
        </section>
        <section id="devices" className="security-strip"><div><span className="lock">⌁</span><div><h2>Private by default</h2><p>Tasks are protected by row-level security. Device alerts use direct, encrypted Web Push.</p></div></div><span className="secure-label">VAPID SIGNED</span></section>
      </section>
      {isComposerOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setComposerOpen(false)}><form className="task-modal" action={addTask} onMouseDown={(event) => event.stopPropagation()}><div className="modal-top"><span className="eyebrow">NEW FOCUS ITEM</span><button type="button" onClick={() => setComposerOpen(false)}>×</button></div><h2>What deserves your attention?</h2><label>Task name<input name="title" placeholder="e.g. Review design proposal" autoFocus required maxLength={160} /></label><label>When should we remind you?<input name="dueAt" type="datetime-local" required defaultValue={new Date(Date.now() + 3_600_000).toISOString().slice(0, 16)} /></label><button className="button" disabled={pending}>{pending ? 'Adding task…' : 'Add to focus queue →'}</button></form></div>}
    </main>
  )
}
