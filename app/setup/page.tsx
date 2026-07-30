import Link from 'next/link'

export default function SetupPage() {
  return (
    <main className="setup-page">
      <Link className="brand" href="/"><span className="brand-mark">N</span> Nexus</Link>
      <section>
        <p className="eyebrow">ONE-TIME DATABASE SETUP</p>
        <h1>Apply the Supabase migration.</h1>
        <p>The app is connected to Supabase, but that project does not yet contain the Nexus tables. This needs to be applied once by a project administrator.</p>
        <ol>
          <li>Open your Supabase project dashboard and choose <strong>SQL Editor</strong>.</li>
          <li>Open <code>supabase/migrations/0001_nexus_tasks.sql</code> in this project.</li>
          <li>Copy its complete contents into a new SQL query and select <strong>Run</strong>.</li>
          <li>Refresh the dashboard, then enable device alerts again.</li>
        </ol>
        <p className="setup-note">This creates <code>tasks</code> and <code>push_subscriptions</code>, enables row-level security, and adds the required indexes. It does not alter Supabase Auth users.</p>
        <Link className="button" href="/dashboard">Return to dashboard <span>→</span></Link>
      </section>
    </main>
  )
}
