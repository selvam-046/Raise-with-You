import Link from 'next/link'
import { AuthCard } from '@/components/auth-card'

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <Link href="/" className="brand"><span className="brand-mark">N</span> Nexus</Link>
      <AuthCard />
      <p className="auth-footnote">Your tasks remain yours. Every workspace is isolated at the database layer.</p>
    </main>
  )
}
