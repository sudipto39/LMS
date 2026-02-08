import { Button, GiteaBadge } from '@/components/ui';
import { Shield, GitBranch, TrendingUp, Users, CheckCircle2, Layers, ArrowUpRight, Server, Award, Globe, Zap, Moon, Sun } from '@/components/Icons';
import type { Page } from '@/types';

export function Landing({ onNavigate, darkMode, setDarkMode }: { onNavigate: (page: Page) => void; darkMode: boolean; setDarkMode: (v: boolean) => void }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117]">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 dark:bg-[#f0f6fc]">
              <Layers className="h-4.5 w-4.5 text-white dark:text-[#0d1117]" />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-[#f0f6fc]">GiteaForge</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-[#30363d] text-neutral-500 dark:text-[#8b949e]">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Button variant="ghost" onClick={() => onNavigate('login')}>Sign in</Button>
            <Button onClick={() => onNavigate('login')}>Request Account</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-neutral-200 dark:border-[#30363d] bg-neutral-50 dark:bg-[#161b22]">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <GiteaBadge />
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-5xl font-extrabold text-neutral-900 dark:text-[#f0f6fc] leading-tight tracking-tight">
            Student Project<br />Management Portal
          </h1>
          <p className="mt-5 text-lg text-neutral-500 dark:text-[#8b949e] max-w-2xl mx-auto leading-relaxed">
            Create projects, link private Git repositories on your institute&apos;s self-hosted Gitea server, track progress with milestones, and collaborate with professors — all in one secure platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => onNavigate('login')}>
              Get Started <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => onNavigate('login')}>
              <Globe className="h-4 w-4" /> Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Active Projects', value: '248', icon: <GitBranch className="h-5 w-5 text-blue-500" /> },
              { label: 'Students', value: '1,200+', icon: <Users className="h-5 w-5 text-green-600" /> },
              { label: 'Professors', value: '45', icon: <Award className="h-5 w-5 text-yellow-600" /> },
              { label: 'Repos Hosted', value: '520+', icon: <Server className="h-5 w-5 text-purple-500" /> },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4">
                <div className="flex items-center justify-center mb-2">{s.icon}</div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-[#f0f6fc]">{s.value}</p>
                <p className="text-xs text-neutral-500 dark:text-[#8b949e] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-2">Built for Academic Excellence</h2>
        <p className="text-center text-neutral-500 dark:text-[#8b949e] mb-12 max-w-xl mx-auto">Everything students, professors, and administrators need in one integrated platform.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <GitBranch className="h-5 w-5" />, title: 'Private Gitea Repos', desc: 'Create and manage private repositories on your institute\'s self-hosted Gitea server. Full push/pull support.', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
            { icon: <TrendingUp className="h-5 w-5" />, title: 'Progress Tracking', desc: 'Track project progress with milestones, commit activity charts, and automated progress indicators.', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
            { icon: <Shield className="h-5 w-5" />, title: 'Role-Based Access', desc: 'Student, Professor, and Admin roles with appropriate permissions and views for each.', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
            { icon: <CheckCircle2 className="h-5 w-5" />, title: 'Review & Grading', desc: 'Professors can review milestones, approve submissions, leave feedback, and assign grades.', color: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400' },
            { icon: <Zap className="h-5 w-5" />, title: 'Webhook Integration', desc: 'Automatic activity tracking via Gitea webhooks — every push and event is recorded.', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400' },
            { icon: <Server className="h-5 w-5" />, title: 'On-Premise Privacy', desc: 'All code stays on your institute\'s servers. No data leaves your infrastructure.', color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-5 hover:border-neutral-300 dark:hover:border-[#484f58] transition group">
              <div className={`inline-flex rounded-md p-2 ${f.color} mb-3`}>{f.icon}</div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#f0f6fc] mb-1.5">{f.title}</h3>
              <p className="text-sm text-neutral-500 dark:text-[#8b949e] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-neutral-200 dark:border-[#30363d] bg-neutral-50 dark:bg-[#161b22]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-12">Three Roles, One Platform</h2>
          <div className="grid lg:grid-cols-3 gap-5">
            {[
              { role: 'Student', color: 'border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400', items: ['Create & manage projects', 'Link private Gitea repos', 'Push code & track progress', 'Upload documents', 'Submit milestones & final version'] },
              { role: 'Professor', color: 'border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-900/20', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400', items: ['View assigned projects', 'Monitor push activity', 'Review & approve milestones', 'Grade with rubric scoring', 'Download ZIP / clone repos'] },
              { role: 'Admin', color: 'border-neutral-300 dark:border-[#30363d] bg-neutral-50 dark:bg-[#161b22]', badge: 'bg-neutral-200 dark:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9]', items: ['Manage users & batches', 'Map students to professors', 'Configure Gitea server', 'Set deadlines & policies', 'View audit logs'] },
            ].map((r) => (
              <div key={r.role} className={`rounded-lg border p-6 ${r.color}`}>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${r.badge}`}>{r.role}</span>
                <ul className="mt-4 space-y-2.5">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-[#c9d1d9]">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-lg bg-neutral-900 dark:bg-[#161b22] dark:border dark:border-[#30363d] p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Get Started?</h2>
          <p className="text-neutral-400 mb-6 max-w-lg mx-auto">Contact your department administrator to get your account set up on the GiteaForge platform.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => onNavigate('login')}>Login to Portal</Button>
            <Button variant="secondary" size="lg" onClick={() => onNavigate('login')}>Request Account</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-[#30363d] bg-neutral-50 dark:bg-[#161b22] py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-neutral-900 dark:text-[#f0f6fc]" />
            <span className="text-sm font-semibold text-neutral-900 dark:text-[#f0f6fc]">GiteaForge</span>
            <span className="text-xs text-neutral-400 dark:text-[#8b949e]">v1.0.0</span>
          </div>
          <p className="text-xs text-neutral-400 dark:text-[#8b949e]">&copy; 2025 IGNOU Computer Science Department. Self-hosted & secure.</p>
        </div>
      </footer>
    </div>
  );
}
