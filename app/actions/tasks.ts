'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in.')
  return { supabase, user }
}

export async function createTask(input: { title: string; dueAt: string }) {
  const title = input.title.trim()
  const dueAt = new Date(input.dueAt)
  if (!title || title.length > 160) throw new Error('Task title must be between 1 and 160 characters.')
  if (Number.isNaN(dueAt.valueOf())) throw new Error('Choose a valid due date.')
  const { supabase, user } = await currentUser()
  const { error } = await supabase.from('tasks').insert({ user_id: user.id, title, due_at: dueAt.toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function setTaskCompletion(id: string, isCompleted: boolean) {
  const { supabase, user } = await currentUser()
  const { error } = await supabase.from('tasks').update({ is_completed: isCompleted }).eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function deleteTask(id: string) {
  const { supabase, user } = await currentUser()
  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}
