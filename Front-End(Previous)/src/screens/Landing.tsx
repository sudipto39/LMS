import { Button } from '@/components/ui';
import { GitBranch, ArrowUpRight, Server, Moon, Sun, Layers, CheckCircle2 } from '@/components/Icons';
import { getGiteaURL } from '@/api/client';
import type { Page } from '@/types';

// Get Gitea URL from environment variable (never hardcode!)
const GITEA_HOST = (getGiteaURL() || 'https://gitea.example.com').replace(/^https?:\/\//, '');

function TerminalBlock({ darkMode }: { darkMode: boolean }) {
  return (
    <div className={`rounded-lg overflow-hidden border ${darkMode ? 'border-[#30363d] bg-[#0d1117]' : 'border-neutral-300 bg-neutral-900'} font-mono text-sm`}>
      <div className={`flex items-center gap-1.5 px-4 py-2.5 ${darkMode ? 'bg-[#161b22]' : 'bg-neutral-800'}`}>
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-neutral-500">terminal</span>
      </div>
      <div className="p-4 space-y-1 text-[13px] leading-relaxed">
        <p><span className="text-green-400">$</span> <span className="text-neutral-300">git remote add origin</span> <span className="text-blue-400">https://{GITEA_HOST}/org/my-project.git</span></p>
        <p><span className="text-green-400">$</span> <span className="text-neutral-300">git push -u origin main</span></p>
        <p className="text-neutral-500">Enumerating objects: 42, done.</p>
        <p className="text-neutral-500">Compressing objects: 100% (38/38), done.</p>
        <p className="text-neutral-500">Writing objects: 100% (42/42), 156.20 KiB, done.</p>
        <p className="text-green-400">✓ Push received — webhook triggered — professor notified</p>
      </div>
    </div>
  );
}

function FlowStep({ number, title, desc, isLast, darkMode }: { number: string; title: string; desc: string; isLast?: boolean; darkMode: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${darkMode ? 'bg-[#f0f6fc] text-[#0d1117]' : 'bg-neutral-900 text-white'}`}>
          {number}
        </div>
        {!isLast && <div className={`w-px flex-1 mt-2 ${darkMode ? 'bg-[#30363d]' : 'bg-neutral-200'}`} />}
      </div>
      <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
        <h4 className={`text-sm font-semibold ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>{title}</h4>
        <p className={`text-sm mt-1 ${darkMode ? 'text-[#8b949e]' : 'text-neutral-500'} leading-relaxed`}>{desc}</p>
      </div>
    </div>
  );
}

export function Landing({ onNavigate, darkMode, setDarkMode }: { onNavigate: (page: Page) => void; darkMode: boolean; setDarkMode: (v: boolean) => void }) {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0d1117]' : 'bg-white'}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'border-[#30363d] bg-[#010409]' : 'border-neutral-200 bg-white'} sticky top-0 z-30`}>
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-md ${darkMode ? 'bg-[#f0f6fc]' : 'bg-neutral-900'}`}>
              <Layers className={`h-4 w-4 ${darkMode ? 'text-[#0d1117]' : 'text-white'}`} />
            </div>
            <span className={`text-base font-bold ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>GiteaForge</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-md p-2 ${darkMode ? 'hover:bg-[#30363d] text-[#8b949e]' : 'hover:bg-neutral-100 text-neutral-500'}`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onNavigate('login')}
              className={`text-sm font-medium px-3 py-1.5 rounded-md ${darkMode ? 'text-[#c9d1d9] hover:text-[#f0f6fc]' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Sign in
            </button>
            <Button size="sm" onClick={() => onNavigate('signup')}>
              Get access
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — asymmetric layout, not centered cards */}
      <section className={`border-b ${darkMode ? 'border-[#30363d]' : 'border-neutral-100'}`}>
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-14 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-6 ${darkMode ? 'border-[#30363d] text-[#8b949e] bg-[#161b22]' : 'border-neutral-200 text-neutral-500 bg-neutral-50'}`}>
              <Server className="h-3 w-3" />
              Self-hosted &middot; Private &middot; On your institute's server
            </div>
            <h1 className={`text-3xl sm:text-4xl font-bold leading-tight tracking-tight ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>
              Manage student projects
              <br />
              <span className={darkMode ? 'text-[#8b949e]' : 'text-neutral-400'}>with Git built in.</span>
            </h1>
            <p className={`mt-4 text-base leading-relaxed max-w-md ${darkMode ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
              GiteaForge connects your institute's Gitea server with a project management layer. Students push code, professors review it, admins manage everything. No code leaves your infrastructure.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => onNavigate('signup')}>
                Request account <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="secondary" onClick={() => onNavigate('login')}>
                Sign in
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <TerminalBlock darkMode={darkMode} />
          </div>
        </div>
      </section>

      {/* How it works — vertical flow, not card grid */}
      <section className={`${darkMode ? 'bg-[#0d1117]' : 'bg-white'}`}>
        <div className="mx-auto max-w-5xl px-6 py-16 grid lg:grid-cols-2 gap-16">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${darkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`}>How it works</p>
            <h2 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>From first commit<br />to final grade.</h2>
            <div>
              <FlowStep darkMode={darkMode} number="1" title="Student creates a project" desc="Pick a title, select your batch and professor, and GiteaForge creates a private repo on the institute's Gitea server automatically." />
              <FlowStep darkMode={darkMode} number="2" title="Push code from your machine" desc="Clone the repo, write code locally, push with standard Git. Every push is tracked and timestamped." />
              <FlowStep darkMode={darkMode} number="3" title="Professor reviews progress" desc="Professors see push activity, milestone status, and can leave inline feedback — no login to Gitea needed." />
              <FlowStep darkMode={darkMode} number="4" title="Submit and get graded" desc="Mark milestones complete, submit the final version. Professor reviews, scores with a rubric, and approves." isLast />
            </div>
          </div>

          {/* Right side — what each role gets, as a stacked list not cards */}
          <div className={`rounded-lg border p-6 h-fit ${darkMode ? 'border-[#30363d] bg-[#161b22]' : 'border-neutral-200 bg-neutral-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-5 ${darkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`}>Built for three roles</p>

            {[
              {
                role: 'Students',
                items: ['Create projects & link Gitea repos', 'Push code, upload documents', 'Track milestones and submit work'],
              },
              {
                role: 'Professors',
                items: ['Monitor push activity & progress', 'Review milestones, leave feedback', 'Grade with rubric scoring'],
              },
              {
                role: 'Admins',
                items: ['Manage users, batches, courses', 'Configure Gitea server & webhooks', 'View audit logs & enforce policy'],
              },
            ].map((group, i) => (
              <div key={group.role} className={`${i > 0 ? `mt-5 pt-5 border-t ${darkMode ? 'border-[#30363d]' : 'border-neutral-200'}` : ''}`}>
                <h4 className={`text-sm font-semibold mb-2.5 ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>{group.role}</h4>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className={`flex items-center gap-2 text-sm ${darkMode ? 'text-[#c9d1d9]' : 'text-neutral-600'}`}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key principles — horizontal strip, not cards */}
      <section className={`border-y ${darkMode ? 'border-[#30363d] bg-[#161b22]' : 'border-neutral-200 bg-neutral-50'}`}>
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: <Server className="h-4 w-4" />,
                title: 'Your server, your data',
                desc: 'Every repository lives on your institute\'s Gitea instance. Nothing is sent to external clouds.',
              },
              {
                icon: <GitBranch className="h-4 w-4" />,
                title: 'Standard Git workflow',
                desc: 'Students use regular git commands. No proprietary tools, no lock-in. Works with any IDE.',
              },
              {
                icon: <ArrowUpRight className="h-4 w-4" />,
                title: 'Webhook-driven tracking',
                desc: 'Push events flow into the dashboard automatically. Professors see activity without checking Gitea.',
              },
            ].map((item) => (
              <div key={item.title}>
                <div className={`inline-flex items-center justify-center h-8 w-8 rounded-md mb-3 ${darkMode ? 'bg-[#30363d] text-[#c9d1d9]' : 'bg-neutral-200 text-neutral-700'}`}>
                  {item.icon}
                </div>
                <h3 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-[#8b949e]' : 'text-neutral-500'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for — simple text block */}
      <section className={`${darkMode ? 'bg-[#0d1117]' : 'bg-white'}`}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-2">
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${darkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`}>Designed for</p>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>Universities that<br />take code seriously.</h2>
            </div>
            <div className={`lg:col-span-3 text-sm leading-7 ${darkMode ? 'text-[#c9d1d9]' : 'text-neutral-600'}`}>
              <p>
                Most student project submissions happen over email or Google Drive. Code gets lost, versions get confused, and professors have no visibility into whether students actually wrote the code or when they started working.
              </p>
              <p className="mt-4">
                GiteaForge fixes this by making Git the source of truth. Every push is logged. Every milestone has a deadline. Professors see real commit history, not just a final ZIP file. And because it runs on your own server, student code never touches GitHub, GitLab, or any external service.
              </p>
              <p className={`mt-4 ${darkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`}>
                Built for institutions like IGNOU, state universities, and engineering colleges that want proper project tracking without depending on third-party platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — minimal, not a dark box */}
      <section className={`border-t ${darkMode ? 'border-[#30363d]' : 'border-neutral-200'}`}>
        <div className="mx-auto max-w-5xl px-6 py-14 text-center">
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>Ready to set this up for your department?</h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-[#8b949e]' : 'text-neutral-500'}`}>Talk to your IT admin. The setup takes about an hour with Docker.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => onNavigate('signup')}>
              Request account
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('login')}>
              Sign in
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${darkMode ? 'border-[#30363d] bg-[#010409]' : 'border-neutral-200 bg-neutral-50'} py-6`}>
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className={`h-4 w-4 ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`} />
            <span className={`text-sm font-semibold ${darkMode ? 'text-[#f0f6fc]' : 'text-neutral-900'}`}>GiteaForge</span>
          </div>
          <p className={`text-xs ${darkMode ? 'text-[#484f58]' : 'text-neutral-400'}`}>Self-hosted student project management. No external dependencies.</p>
        </div>
      </footer>
    </div>
  );
}
