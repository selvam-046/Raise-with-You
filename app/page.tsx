import Link from 'next/link'

export default function Home() {
  return (
    <main className="marketing-shell">
      <nav className="marketing-nav">
        <Link className="brand" href="/"><span className="brand-mark">N</span> Nexus</Link>
        <Link className="button button-small" href="/login">Open workspace <span>→</span></Link>
      </nav>
      <section className="hero">
        <div className="eyebrow"><span className="pulse" /> PRIVATE BY DESIGN</div>
        <h1>Make the important<br /><em>inevitable.</em></h1>
        <p>One calm command center for deadlines, focus, and timely reminders — built on your own data, without notification middlemen.</p>
        <div className="hero-actions">
          <Link className="button" href="/login">Start your workspace <span>→</span></Link>
          <a className="text-link" href="#principles">Explore the system <span>↓</span></a>
        </div>
      </section>
      <section id="principles" className="principles">
        <article><span>01</span><h2>Private core</h2><p>Supabase authentication, isolated data, and row-level security keep every workspace personal.</p></article>
        <article><span>02</span><h2>Native delivery</h2><p>Encrypted Web Push routes directly through browser vendor gateways, signed with your VAPID identity.</p></article>
        <article><span>03</span><h2>Always deliberate</h2><p>Serverless cron checks what is due, sends only once, and cleans unreachable devices automatically.</p></article>
      </section>
      <footer>© {new Date().getFullYear()} Nexus Tasks <span>Engineered for focused teams.</span></footer>
    </main>
  )
}
