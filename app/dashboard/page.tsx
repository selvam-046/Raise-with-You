import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Dashboard } from '@/components/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('is_completed', { ascending: true })
    .order('due_at', { ascending: true })

  const schemaError = error?.code === 'PGRST205'
    ? 'Database setup is incomplete. Apply the Nexus migration before creating tasks or enrolling devices.'
    : null

  return <Dashboard userId={user.id} userEmail={user.email ?? 'Workspace member'} initialTasks={tasks ?? []} setupError={schemaError} />
}
