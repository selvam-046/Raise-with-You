'use client'

import { useActionState, useState } from 'react'
import { signIn, signUp, type AuthState } from '@/app/actions/auth'

const initialState: AuthState = {}

export function AuthCard() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const action = mode === 'signin' ? signIn : signUp
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <section className="auth-card">
      <div className="auth-card-heading"><span className="eyebrow">YOUR PRIVATE WORKSPACE</span><h1>{mode === 'signin' ? 'Welcome back.' : 'Begin with intent.'}</h1><p>{mode === 'signin' ? 'Sign in to return to what matters.' : 'Set up a calmer system for your work.'}</p></div>
      <form action={formAction} className="auth-form">
        <label>Email<input required name="email" type="email" autoComplete="email" placeholder="you@company.com" /></label>
        <label>Password<input required name="password" type="password" minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="••••••••" /></label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        {state.message && <p className="form-success" role="status">{state.message}</p>}
        <button className="button auth-submit" disabled={pending}>{pending ? 'Working…' : mode === 'signin' ? 'Enter workspace →' : 'Create workspace →'}</button>
      </form>
      <button className="auth-switch" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} type="button">
        {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </section>
  )
}
