import { useState, useEffect, useCallback } from 'react';
import type { Page } from '@/types';
import dataService from '@/services/dataService';
import { mockProjects, mockActivities, mockMilestones, mockUsers, mockComments } from '@/data';
import {
  KPICard, StatusPill, ProgressBar, ActivityTimeline, TechTag, InactivityBadge,
  Button, MilestoneStatusPill, Modal, Toast
} from '@/components/ui';
import {
  FolderGit2, Clock, AlertTriangle, Eye, Plus, ExternalLink,
  GitBranch, Send, CheckCircle2, Award, Users, Calendar, Download,
  Filter, Terminal, Copy, ArrowUpRight, XCircle,
  Server, Webhook, FileText, BookOpen, User, Search,
  Upload, RefreshCw, Hash, ListChecks, MessageSquare
} from '@/components/Icons';
import { cn } from '@/utils/cn';

// Shared dark-mode class shortcuts
const card = 'rounded-lg border border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22]';
const cardHover = card + ' hover:border-neutral-300 dark:hover:border-[#484f58] transition';
// Grid classes for better big-screen usage
const kpiGrid = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5';
const mainGrid = 'grid lg:grid-cols-3 gap-6 xl:gap-8';
const twoColGrid = 'grid lg:grid-cols-2 gap-6 xl:gap-8';
const threeColGrid = 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6';
const heading = 'text-neutral-900 dark:text-[#f0f6fc]';
const subtext = 'text-neutral-500 dark:text-[#8b949e]';
const mutedText = 'text-neutral-400 dark:text-[#484f58]';
const bodyText = 'text-neutral-600 dark:text-[#8b949e]';
const tableHead = 'border-b border-neutral-100 dark:border-[#30363d] bg-neutral-50/50 dark:bg-[#161b22]';
const tableRow = 'border-b border-neutral-50 dark:border-[#21262d] hover:bg-neutral-50/50 dark:hover:bg-[#21262d]/50 transition';
const thCell = 'font-medium text-neutral-500 dark:text-[#484f58] text-xs uppercase tracking-wider';
const inputClass = 'w-full rounded-md border border-neutral-300 dark:border-[#30363d] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]';
const selectClass = 'w-full rounded-md border border-neutral-300 dark:border-[#30363d] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-[#f0f6fc]';
const sectionBorder = 'border-b border-neutral-100 dark:border-[#30363d]';
const infoBox = 'bg-neutral-50 dark:bg-[#0d1117] rounded-md border border-neutral-200 dark:border-[#30363d]';

/* ═══════════════════════════════════════════════════
   STUDENT DASHBOARD
   ═══════════════════════════════════════════════════ */
export function StudentDashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const studentProjects = mockProjects.filter(p => p.studentId === 'u1');
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', heading)}>Dashboard</h1>
          <p className={cn('text-sm mt-0.5', subtext)}>Welcome back, Rahul. Here&apos;s your project overview.</p>
        </div>
        <Button onClick={() => onNavigate('student-create-project')}><Plus className="h-4 w-4" /> New Project</Button>
      </div>

      <div className={kpiGrid}>
        <KPICard title="Active Projects" value={1} subtitle="1 in progress" icon={<FolderGit2 className="h-5 w-5" />} color="blue" />
        <KPICard title="Upcoming Deadline" value="Mar 15" subtitle="E-Commerce Platform" icon={<Calendar className="h-5 w-5" />} color="yellow" />
        <KPICard title="Last Push" value="2h ago" subtitle="main branch" icon={<Clock className="h-5 w-5" />} color="green" />
        <KPICard title="Pending Review" value={1} subtitle="Milestone 3" icon={<Eye className="h-5 w-5" />} color="purple" />
      </div>

      <div className={mainGrid}>
        <div className={cn('lg:col-span-2', card)}>
          <div className={cn('flex items-center justify-between p-5', sectionBorder)}>
            <h2 className={cn('text-sm font-semibold', heading)}>My Projects</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('student-projects')}>View All <ArrowUpRight className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={tableHead}>
                <th className={cn('text-left py-3 px-5', thCell)}>Project</th>
                <th className={cn('text-left py-3 px-3', thCell)}>Status</th>
                <th className={cn('text-left py-3 px-3 hidden md:table-cell', thCell)}>Progress</th>
                <th className={cn('text-left py-3 px-3 hidden sm:table-cell', thCell)}>Last Push</th>
                <th className={cn('text-left py-3 px-3', thCell)}>Actions</th>
              </tr></thead>
              <tbody>
                {studentProjects.map(p => (
                  <tr key={p.id} className={tableRow}>
                    <td className="py-3 px-5">
                      <p className={cn('font-medium', heading)}>{p.title}</p>
                      <p className={cn('text-xs', mutedText)}>Prof. {p.professor}</p>
                    </td>
                    <td className="py-3 px-3"><StatusPill status={p.status} /></td>
                    <td className="py-3 px-3 hidden md:table-cell w-40"><ProgressBar value={p.progress} /></td>
                    <td className="py-3 px-3 hidden sm:table-cell"><InactivityBadge lastPush={p.lastPush} /></td>
                    <td className="py-3 px-3">
                      <Button variant="ghost" size="sm" onClick={() => onNavigate('student-project-detail')}>
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={card}>
          <div className={cn('p-5', sectionBorder)}>
            <h2 className={cn('text-sm font-semibold', heading)}>Recent Activity</h2>
          </div>
          <div className="p-5">
            <ActivityTimeline activities={mockActivities.filter(a => a.user === 'Rahul Sharma' || (a.project === 'E-Commerce Platform'))} limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STUDENT PROJECTS LIST
   ═══════════════════════════════════════════════════ */
export function StudentProjects({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', heading)}>My Projects</h1>
          <p className={cn('text-sm', subtext)}>Manage and track all your projects</p>
        </div>
        <Button onClick={() => onNavigate('student-create-project')}><Plus className="h-4 w-4" /> New Project</Button>
      </div>
      <div className="grid gap-4">
        {mockProjects.filter(p => p.studentId === 'u1').map(p => (
          <div key={p.id} className={cn(cardHover, 'p-5 cursor-pointer')} onClick={() => onNavigate('student-project-detail')}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={cn('text-base font-semibold', heading)}>{p.title}</h3>
                  <StatusPill status={p.status} />
                </div>
                <p className={cn('text-sm mb-3', subtext)}>{p.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.techStack.map(t => <TechTag key={t} label={t} />)}
                </div>
                <div className={cn('flex flex-wrap items-center gap-4 text-xs', mutedText)}>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {p.professor}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Due: {p.deadline}</span>
                  <InactivityBadge lastPush={p.lastPush} />
                  {p.repoLinked && <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><GitBranch className="h-3.5 w-3.5" /> Repo linked</span>}
                </div>
              </div>
              <div className="w-full sm:w-48">
                <ProgressBar value={p.progress} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CREATE PROJECT
   ═══════════════════════════════════════════════════ */
export function CreateProject({ onNavigate }: { onNavigate: (page: Page) => void }) {
  // Note: max-w-3xl removed - now uses full width with max-w-4xl for better big screen usage
  const [step, setStep] = useState(1);
  const [repoOption, setRepoOption] = useState<'create' | 'link'>('create');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', batch: 'BCA-2024', professor: 'u4', techStack: [] as string[] });

  const handleCreateProject = useCallback(async () => {
    setIsCreating(true);
    try {
      await dataService.createProject({
        title: formData.title || 'New Project',
        description: formData.description || 'Project description',
        batch: formData.batch,
        course: formData.batch,
        professorId: formData.professor,
        techStack: formData.techStack,
        repoOption: repoOption === 'create' ? 'create_new' : 'link_existing',
      });
      setShowSuccess(true);
      setTimeout(() => onNavigate('student-project-detail'), 1500);
    } catch { /* handled */ }
    setIsCreating(false);
  }, [formData, repoOption, onNavigate]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showSuccess && <Toast message="Project created successfully! Repository initialized." onClose={() => setShowSuccess(false)} />}
      <div>
        <h1 className={cn('text-2xl font-bold', heading)}>Create New Project</h1>
        <p className={cn('text-sm mt-0.5', subtext)}>Set up your project and connect a Git repository</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[{ n: 1, label: 'Details' }, { n: 2, label: 'Repository' }, { n: 3, label: 'Milestones' }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition',
              step >= s.n ? 'bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117]' : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]'
            )}>{s.n}</div>
            <span className={cn('text-sm font-medium', step >= s.n ? heading : mutedText)}>{s.label}</span>
            {i < 2 && <div className={cn('w-8 h-px', step > s.n ? 'bg-neutral-400 dark:bg-[#8b949e]' : 'bg-neutral-200 dark:bg-[#30363d]')} />}
          </div>
        ))}
      </div>

      <div className={cn(card, 'p-6')}>
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={cn('block text-sm font-medium mb-1.5', heading)}>Project Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="Enter project title" className={inputClass} />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-1.5', heading)}>Description *</label>
              <textarea rows={3} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Describe your project..." className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', heading)}>Batch / Course</label>
                <select className={selectClass}><option>BCA-2024</option><option>MCA-2024</option></select>
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', heading)}>Supervisor</label>
                <select className={selectClass}><option>Dr. Anita Desai</option><option>Dr. Vikram Singh</option></select>
              </div>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-1.5', heading)}>Tech Stack</label>
              <div className="flex flex-wrap gap-2">
                {['React', 'Node.js', 'MongoDB', 'Express', 'Python', 'Django', 'Vue.js', 'Angular', 'PostgreSQL', 'MySQL'].map(t => (
                  <button key={t} className="rounded-md border border-neutral-200 dark:border-[#30363d] px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-[#8b949e] hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-1.5', heading)}>Team Members (optional)</label>
              <input type="text" placeholder="Search students to add..." className={inputClass} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Next: Repository Setup <ArrowUpRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className={cn('text-base font-semibold', heading)}>Repository Setup</h3>
            <p className={cn('text-sm', subtext)}>Connect your project to a Git repository on the institute Gitea server.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => setRepoOption('create')}
                className={cn('rounded-lg border-2 p-5 text-left transition', repoOption === 'create' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-[#30363d] hover:border-neutral-300 dark:hover:border-[#484f58]')}>
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className={cn('font-semibold', heading)}>Create New Repo</span>
                </div>
                <p className={cn('text-xs', subtext)}>Create a new private repository on institute Gitea server</p>
              </button>
              <button onClick={() => setRepoOption('link')}
                className={cn('rounded-lg border-2 p-5 text-left transition', repoOption === 'link' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-[#30363d] hover:border-neutral-300 dark:hover:border-[#484f58]')}>
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className={cn('font-semibold', heading)}>Link Existing Repo</span>
                </div>
                <p className={cn('text-xs', subtext)}>Link an existing repository from your Gitea account</p>
              </button>
            </div>
            {repoOption === 'create' && (
              <div className={cn('space-y-3 p-4', infoBox)}>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', heading)}>Repository Name</label>
                  <input type="text" defaultValue="ecommerce-platform" className={inputClass} />
                </div>
                <div className={cn('flex items-center gap-2 text-xs', subtext)}>
                  <Server className="h-3.5 w-3.5" />
                  <span>Will be created at: gitea.ignou.local/rahul/ecommerce-platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-neutral-300 dark:border-[#30363d] text-blue-600" />
                  <span className={cn('text-sm', bodyText)}>Initialize with README</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-neutral-300 dark:border-[#30363d] text-blue-600" />
                  <span className={cn('text-sm', bodyText)}>Add .gitignore (Node)</span>
                </div>
              </div>
            )}
            {repoOption === 'link' && (
              <div className={cn('space-y-3 p-4', infoBox)}>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', heading)}>Repository URL</label>
                  <input type="text" placeholder="https://gitea.ignou.local/username/repo" className={inputClass} />
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next: Milestones <ArrowUpRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className={cn('text-base font-semibold', heading)}>Milestone Plan</h3>
            <p className={cn('text-sm', subtext)}>Define key milestones for your project (you can add more later).</p>
            <div className="space-y-3">
              {['Project Setup & Database Design', 'Core Features Implementation', 'Testing & Documentation', 'Final Submission'].map((m, i) => (
                <div key={m} className={cn('flex items-center gap-3 px-4 py-3', infoBox)}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 dark:bg-[#30363d] text-xs font-bold text-neutral-600 dark:text-[#c9d1d9]">{i + 1}</span>
                  <input type="text" defaultValue={m} className={cn('flex-1 text-sm bg-transparent outline-none', heading)} />
                  <input type="date" className={cn('text-xs bg-transparent outline-none border border-neutral-200 dark:border-[#30363d] rounded px-2 py-1', subtext)} />
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm"><Plus className="h-4 w-4" /> Add Milestone</Button>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleCreateProject} disabled={isCreating}>
                {isCreating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Creating...</> : <><CheckCircle2 className="h-4 w-4" /> Create Project</>}
              </Button>
            </div>
          </div>
        )}
      </div>

      {step === 2 && repoOption === 'create' && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2"><Terminal className="h-4 w-4" /> After creation — Push your code</h4>
          <div className="bg-neutral-900 rounded-md p-4 text-sm font-mono text-neutral-300 space-y-1 overflow-x-auto">
            <p><span className="text-green-400">$</span> git clone https://gitea.ignou.local/rahul/ecommerce-platform.git</p>
            <p><span className="text-green-400">$</span> cd ecommerce-platform</p>
            <p><span className="text-green-400">$</span> git add . && git commit -m &quot;initial commit&quot;</p>
            <p><span className="text-green-400">$</span> git push origin main</p>
          </div>
          <button className="mt-3 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"><Copy className="h-3.5 w-3.5" /> Copy clone URL</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROJECT DETAIL (STUDENT VIEW)
   ═══════════════════════════════════════════════════ */
export function StudentProjectDetail({ onNavigate: _onNavigate }: { onNavigate: (page: Page) => void }) {
  const [tab, setTab] = useState<'overview' | 'milestones' | 'progress' | 'files' | 'feedback'>('overview');
  const project = mockProjects[0];
  const milestones = mockMilestones.filter(m => m.projectId === 'p1');

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'milestones' as const, label: 'Milestones' },
    { id: 'progress' as const, label: 'Progress' },
    { id: 'files' as const, label: 'Files' },
    { id: 'feedback' as const, label: 'Feedback' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className={cn('text-2xl font-bold', heading)}>{project.title}</h1>
            <StatusPill status={project.status} />
          </div>
          <p className={cn('text-sm', subtext)}>{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><RefreshCw className="h-4 w-4" /> Update Progress</Button>
          <Button size="sm"><Send className="h-4 w-4" /> Submit Final</Button>
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-[#30363d]">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition',
                tab === t.id ? 'border-orange-500 text-neutral-900 dark:text-[#f0f6fc]' : 'border-transparent text-neutral-500 dark:text-[#8b949e] hover:text-neutral-700 dark:hover:text-[#c9d1d9] hover:border-neutral-300 dark:hover:border-[#484f58]'
              )}>{t.label}</button>
          ))}
        </nav>
      </div>

      {tab === 'overview' && (
        <div className={cn(mainGrid)}>
          <div className="lg:col-span-2 space-y-6">
            <div className={cn(card, 'p-5')}>
              <h3 className={cn('font-semibold mb-4', heading)}>Project Information</h3>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><dt className={cn('mb-0.5', mutedText)}>Professor</dt><dd className={cn('font-medium', heading)}>{project.professor}</dd></div>
                <div><dt className={cn('mb-0.5', mutedText)}>Batch</dt><dd className={cn('font-medium', heading)}>{project.batch}</dd></div>
                <div><dt className={cn('mb-0.5', mutedText)}>Deadline</dt><dd className={cn('font-medium', heading)}>{project.deadline}</dd></div>
                <div><dt className={cn('mb-0.5', mutedText)}>Created</dt><dd className={cn('font-medium', heading)}>{project.createdAt}</dd></div>
              </dl>
              <div className="mt-4">
                <dt className={cn('text-sm mb-1', mutedText)}>Tech Stack</dt>
                <div className="flex flex-wrap gap-1.5">{project.techStack.map(t => <TechTag key={t} label={t} />)}</div>
              </div>
            </div>
            <div className={cn(card, 'p-5')}>
              <h3 className={cn('font-semibold mb-3', heading)}>Repository</h3>
              {project.repoLinked ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <GitBranch className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Connected</span>
                  </div>
                  <div className={cn('flex items-center gap-2 p-3', infoBox)}>
                    <code className={cn('text-xs flex-1 overflow-hidden text-ellipsis font-mono', bodyText)}>{project.repoUrl}</code>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700"><Copy className="h-4 w-4" /></button>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700"><ExternalLink className="h-4 w-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                  <span className="text-sm text-red-600 dark:text-red-400">Repository not linked</span>
                  <Button variant="danger" size="sm" className="ml-auto">Link Now</Button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className={cn(card, 'p-5')}>
              <h3 className={cn('font-semibold mb-3', heading)}>Progress</h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <svg className="h-28 w-28 -rotate-90">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="10" className="text-neutral-100 dark:text-[#21262d]" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke="#2da44e" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${project.progress * 3.01} ${301 - project.progress * 3.01}`} />
                  </svg>
                  <span className={cn('absolute inset-0 flex items-center justify-center text-2xl font-bold', heading)}>{project.progress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className={cn('text-sm', subtext)}>3 of 5 milestones completed</p>
              </div>
            </div>
            <div className={cn(card, 'p-5')}>
              <h3 className={cn('font-semibold mb-3', heading)}>Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="secondary" size="sm" className="w-full justify-start"><Upload className="h-4 w-4" /> Upload Document</Button>
                <Button variant="secondary" size="sm" className="w-full justify-start"><ListChecks className="h-4 w-4" /> Update Milestone</Button>
                <Button variant="secondary" size="sm" className="w-full justify-start"><Send className="h-4 w-4" /> Submit for Review</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'milestones' && (
        <div className={card}>
          <div className={cn('p-5 flex items-center justify-between', sectionBorder)}>
            <h3 className={cn('font-semibold', heading)}>Milestones</h3>
            <Button variant="ghost" size="sm"><Plus className="h-4 w-4" /> Add</Button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-[#21262d]">
            {milestones.map((m, i) => (
              <div key={m.id} className="flex items-start gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50 transition">
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  m.status === 'approved' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
                  m.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]'
                )}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={cn('text-sm font-semibold', heading)}>{m.title}</h4>
                    <MilestoneStatusPill status={m.status} />
                  </div>
                  <p className={cn('text-xs mb-1', subtext)}>{m.description}</p>
                  <div className={cn('flex items-center gap-3 text-xs', mutedText)}>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due: {m.dueDate}</span>
                    {m.completedAt && <span className="flex items-center gap-1 text-green-500 dark:text-green-400"><CheckCircle2 className="h-3 w-3" />Completed: {m.completedAt}</span>}
                  </div>
                </div>
                {m.status === 'in-progress' && (<Button size="sm" variant="secondary">Mark Complete</Button>)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'progress' && (
        <div className={cn(twoColGrid)}>
          <div className={cn(card, 'p-5')}>
            <h3 className={cn('font-semibold mb-4', heading)}>Weekly Commit Activity</h3>
            <div className="flex items-end gap-2 h-40">
              {[3, 7, 5, 12, 8, 15, 6, 10, 4, 9, 11, 3].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600" style={{ height: `${(v / 15) * 100}%` }} />
                  <span className={cn('text-[9px]', mutedText)}>W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={cn(card, 'p-5')}>
            <h3 className={cn('font-semibold mb-4', heading)}>Recent Commits</h3>
            <div className="space-y-3">
              {[
                { msg: 'Add product search with Fuse.js', branch: 'main', time: '2 hours ago', hash: 'a3f8c2d' },
                { msg: 'Fix cart total calculation', branch: 'main', time: '5 hours ago', hash: 'b1d4e5f' },
                { msg: 'Add pagination component', branch: 'feature/catalog', time: '1 day ago', hash: 'c7a2b3d' },
              ].map(c => (
                <div key={c.hash} className={cn('flex items-start gap-3 p-3 rounded-md', infoBox)}>
                  <Hash className={cn('h-4 w-4 mt-0.5 shrink-0', mutedText)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', heading)}>{c.msg}</p>
                    <div className={cn('flex items-center gap-2 mt-1 text-xs', mutedText)}>
                      <span className="font-mono">{c.hash}</span>
                      <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{c.branch}</span>
                      <span>{c.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'files' && (
        <div className={card}>
          <div className={cn('p-5 flex items-center justify-between', sectionBorder)}>
            <h3 className={cn('font-semibold', heading)}>Uploaded Documents</h3>
            <Button size="sm"><Upload className="h-4 w-4" /> Upload File</Button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-[#21262d]">
            {[
              { name: 'Project_Proposal.pdf', size: '2.4 MB', date: 'Nov 5, 2024', type: 'PDF' },
              { name: 'Database_Schema.pdf', size: '1.1 MB', date: 'Dec 10, 2024', type: 'PDF' },
              { name: 'UI_Mockups.zip', size: '8.7 MB', date: 'Dec 22, 2024', type: 'ZIP' },
            ].map(f => (
              <div key={f.name} className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', heading)}>{f.name}</p>
                  <p className={cn('text-xs', mutedText)}>{f.size} · {f.date}</p>
                </div>
                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <FeedbackThread projectId={project.id} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STUDENT SUBMISSIONS
   ═══════════════════════════════════════════════════ */
export function StudentSubmissions({ onNavigate: _onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="space-y-6">
      <h1 className={cn('text-2xl font-bold', heading)}>Submissions</h1>
      <div className={card}>
        <div className="divide-y divide-neutral-100 dark:divide-[#21262d]">
          {[
            { project: 'E-Commerce Platform', type: 'Milestone 2: User Auth', date: 'Dec 14, 2024', status: 'approved' as const },
            { project: 'E-Commerce Platform', type: 'Milestone 1: Setup', date: 'Nov 28, 2024', status: 'approved' as const },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-full',
                s.status === 'approved' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'
              )}>
                {s.status === 'approved' ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> : <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
              </div>
              <div className="flex-1">
                <p className={cn('text-sm font-medium', heading)}>{s.type}</p>
                <p className={cn('text-xs', mutedText)}>{s.project} · {s.date}</p>
              </div>
              <StatusPill status={s.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFESSOR DASHBOARD
   ═══════════════════════════════════════════════════ */
export function ProfessorDashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const profProjects = mockProjects.filter(p => p.professorId === 'u4');
  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold', heading)}>Dashboard</h1>
        <p className={cn('text-sm', subtext)}>Welcome, Dr. Anita Desai. Here&apos;s your supervision overview.</p>
      </div>

      <div className={kpiGrid}>
        <KPICard title="Projects Supervised" value={3} subtitle="3 active students" icon={<FolderGit2 className="h-5 w-5" />} color="blue" />
        <KPICard title="Needs Review" value={1} subtitle="Priya's submission" icon={<Eye className="h-5 w-5" />} color="yellow" />
        <KPICard title="Inactive > 7 days" value={1} subtitle="Karan Mehta" icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KPICard title="Upcoming Deadlines" value={2} subtitle="Feb 28, Mar 15" icon={<Calendar className="h-5 w-5" />} color="purple" />
      </div>

      <div className={mainGrid}>
        <div className="lg:col-span-2">
          <div className={card}>
            <div className={cn('flex items-center justify-between p-5', sectionBorder)}>
              <h2 className={cn('text-sm font-semibold', heading)}>Supervised Projects</h2>
              <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /> Filter</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={tableHead}>
                  <th className={cn('text-left py-3 px-5', thCell)}>Student / Project</th>
                  <th className={cn('text-left py-3 px-3', thCell)}>Status</th>
                  <th className={cn('text-left py-3 px-3 hidden md:table-cell', thCell)}>Progress</th>
                  <th className={cn('text-left py-3 px-3 hidden sm:table-cell', thCell)}>Last Push</th>
                  <th className={cn('text-left py-3 px-3', thCell)}>Actions</th>
                </tr></thead>
                <tbody>
                  {profProjects.map(p => (
                    <tr key={p.id} className={tableRow}>
                      <td className="py-3 px-5">
                        <p className={cn('font-medium', heading)}>{p.title}</p>
                        <p className={cn('text-xs', mutedText)}>{p.studentName} · {p.batch}</p>
                      </td>
                      <td className="py-3 px-3"><StatusPill status={p.status} /></td>
                      <td className="py-3 px-3 hidden md:table-cell w-36"><ProgressBar value={p.progress} size="sm" /></td>
                      <td className="py-3 px-3 hidden sm:table-cell"><InactivityBadge lastPush={p.lastPush} /></td>
                      <td className="py-3 px-3">
                        <Button variant="ghost" size="sm" onClick={() => onNavigate('professor-project-detail')}>
                          <Eye className="h-4 w-4" /> Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={card}>
          <div className={cn('p-5', sectionBorder)}>
            <h2 className={cn('text-sm font-semibold', heading)}>Activity Feed</h2>
          </div>
          <div className="p-5">
            <ActivityTimeline activities={mockActivities.filter(a =>
              a.project === 'E-Commerce Platform' || a.project === 'Library Management System' || a.project === 'Weather Dashboard'
            )} limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFESSOR PROJECT DETAIL
   ═══════════════════════════════════════════════════ */
export function ProfessorProjectDetail({ onNavigate: _onNavigate }: { onNavigate: (page: Page) => void }) {
  const [tab, setTab] = useState<'summary' | 'activity' | 'milestones' | 'files' | 'grade'>('summary');
  const project = mockProjects[0];
  const milestones = mockMilestones.filter(m => m.projectId === 'p1');
  const tabs = [
    { id: 'summary' as const, label: 'Summary' },
    { id: 'activity' as const, label: 'Activity' },
    { id: 'milestones' as const, label: 'Milestones Review' },
    { id: 'files' as const, label: 'Files' },
    { id: 'grade' as const, label: 'Grade & Feedback' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className={cn('text-2xl font-bold', heading)}>{project.title}</h1>
            <StatusPill status={project.status} />
          </div>
          <p className={cn('text-sm', subtext)}>Student: {project.studentName} · {project.batch}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm"><Terminal className="h-4 w-4" /> Clone</Button>
          <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Download ZIP</Button>
          <Button variant="danger" size="sm"><XCircle className="h-4 w-4" /> Request Changes</Button>
          <Button variant="success" size="sm"><CheckCircle2 className="h-4 w-4" /> Approve</Button>
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-[#30363d]">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition',
                tab === t.id ? 'border-orange-500 text-neutral-900 dark:text-[#f0f6fc]' : 'border-transparent text-neutral-500 dark:text-[#8b949e] hover:text-neutral-700 dark:hover:text-[#c9d1d9]'
              )}>{t.label}</button>
          ))}
        </nav>
      </div>

      {tab === 'summary' && (
        <div className={cn(mainGrid)}>
          <div className="lg:col-span-2 space-y-4">
            <div className={cn(card, 'p-5')}>
              <h3 className={cn('font-semibold mb-3', heading)}>Project Details</h3>
              <p className={cn('text-sm mb-4', bodyText)}>{project.description}</p>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><dt className={cn('mb-0.5', mutedText)}>Student</dt><dd className={cn('font-medium', heading)}>{project.studentName}</dd></div>
                <div><dt className={cn('mb-0.5', mutedText)}>Batch</dt><dd className={cn('font-medium', heading)}>{project.batch}</dd></div>
                <div><dt className={cn('mb-0.5', mutedText)}>Deadline</dt><dd className={cn('font-medium', heading)}>{project.deadline}</dd></div>
                <div><dt className={cn('mb-0.5', mutedText)}>Last Updated</dt><dd className={cn('font-medium', heading)}>{project.updatedAt}</dd></div>
              </dl>
              <div className="mt-4">
                <dt className={cn('text-sm mb-1', mutedText)}>Tech Stack</dt>
                <div className="flex flex-wrap gap-1.5">{project.techStack.map(t => <TechTag key={t} label={t} />)}</div>
              </div>
            </div>
            <div className={cn(card, 'p-5')}>
              <h3 className={cn('font-semibold mb-3', heading)}>Repository</h3>
              <div className={cn('flex items-center gap-2 p-3', infoBox)}>
                <GitBranch className="h-4 w-4 text-green-600 dark:text-green-400" />
                <code className={cn('text-xs flex-1 overflow-hidden text-ellipsis font-mono', bodyText)}>{project.repoUrl}</code>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700"><ExternalLink className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          <div>
            <div className={cn(card, 'p-5')}>
              <h3 className={cn('font-semibold mb-3', heading)}>Progress</h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <svg className="h-28 w-28 -rotate-90">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="10" className="text-neutral-100 dark:text-[#21262d]" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke="#2da44e" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${project.progress * 3.01} ${301 - project.progress * 3.01}`} />
                  </svg>
                  <span className={cn('absolute inset-0 flex items-center justify-center text-2xl font-bold', heading)}>{project.progress}%</span>
                </div>
              </div>
              <InactivityBadge lastPush={project.lastPush} />
            </div>
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className={cn(card, 'p-5')}>
          <h3 className={cn('font-semibold mb-4', heading)}>Commit / Push Timeline</h3>
          <ActivityTimeline activities={mockActivities.filter(a => a.project === 'E-Commerce Platform')} />
        </div>
      )}

      {tab === 'milestones' && (
        <div className={cn(card, 'divide-y divide-neutral-100 dark:divide-[#21262d]')}>
          {milestones.map((m, i) => (
            <div key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#21262d] text-xs font-bold text-neutral-500 dark:text-[#8b949e]">{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={cn('text-sm font-semibold', heading)}>{m.title}</h4>
                      <MilestoneStatusPill status={m.status} />
                    </div>
                    <p className={cn('text-xs', subtext)}>{m.description}</p>
                    <p className={cn('text-xs mt-1 flex items-center gap-1', mutedText)}><Calendar className="h-3 w-3" />Due: {m.dueDate}</p>
                  </div>
                </div>
                {(m.status === 'completed' || m.status === 'in-progress') && (
                  <div className="flex gap-2">
                    <Button variant="success" size="sm"><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                    <Button variant="danger" size="sm"><XCircle className="h-4 w-4" /> Reject</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'files' && (
        <div className={card}>
          <div className={cn('p-5 flex items-center justify-between', sectionBorder)}>
            <h3 className={cn('font-semibold', heading)}>Student Files</h3>
            <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Download All</Button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-[#21262d]">
            {[
              { name: 'Project_Proposal.pdf', size: '2.4 MB', date: 'Nov 5, 2024' },
              { name: 'Database_Schema.pdf', size: '1.1 MB', date: 'Dec 10, 2024' },
              { name: 'UI_Mockups.zip', size: '8.7 MB', date: 'Dec 22, 2024' },
            ].map(f => (
              <div key={f.name} className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50">
                <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', heading)}>{f.name}</p>
                  <p className={cn('text-xs', mutedText)}>{f.size} · {f.date}</p>
                </div>
                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'grade' && (
        <div className={cn(twoColGrid)}>
          <div className={cn(card, 'p-5')}>
            <h3 className={cn('font-semibold mb-4', heading)}>Rubric Scoring</h3>
            <div className="space-y-4">
              {[
                { criterion: 'Code Quality', max: 25 },
                { criterion: 'Functionality', max: 30 },
                { criterion: 'Documentation', max: 15 },
                { criterion: 'Presentation', max: 10 },
                { criterion: 'Innovation', max: 20 },
              ].map(r => (
                <div key={r.criterion} className="flex items-center gap-4">
                  <label className={cn('text-sm w-32', bodyText)}>{r.criterion}</label>
                  <input type="number" max={r.max} placeholder={`/ ${r.max}`} className={cn(inputClass, '!w-20 text-center')} />
                  <span className={cn('text-xs', mutedText)}>/ {r.max}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-3 border-t border-neutral-200 dark:border-[#30363d]">
                <label className={cn('text-sm font-bold w-32', heading)}>Total</label>
                <span className={cn('text-lg font-bold', heading)}>— / 100</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="success" onClick={async () => { try { await dataService.approveProject('p1', '85', 'Good work'); alert('Grade submitted!'); } catch { /* handled */ } }}>
                <Award className="h-4 w-4" /> Submit Grade
              </Button>
            </div>
          </div>
          <div className={card}>
            <div className={cn('p-5', sectionBorder)}><h3 className={cn('font-semibold', heading)}>Feedback</h3></div>
            <div className="p-5 space-y-3 max-h-64 overflow-auto">
              {mockComments.map(c => (
                <div key={c.id} className={cn('p-3 rounded-md', infoBox)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-semibold', heading)}>{c.user}</span>
                    <span className={cn('text-xs', mutedText)}>{c.timestamp}</span>
                  </div>
                  <p className={cn('text-sm', bodyText)}>{c.message}</p>
                </div>
              ))}
            </div>
            <div className={cn('p-5 flex gap-2 border-t border-neutral-100 dark:border-[#30363d]')}>
              <input type="text" placeholder="Add feedback..." className={inputClass} />
              <Button><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFESSOR REVIEWS
   ═══════════════════════════════════════════════════ */
export function ProfessorReviews({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="space-y-6">
      <h1 className={cn('text-2xl font-bold', heading)}>Pending Reviews</h1>
      <div className={cn(card, 'divide-y divide-neutral-100 dark:divide-[#21262d]')}>
        {[
          { student: 'Priya Patel', project: 'Library Management System', type: 'Final Submission', date: '1 day ago', urgent: true },
          { student: 'Rahul Sharma', project: 'E-Commerce Platform', type: 'Milestone: Product Catalog', date: '3 days ago', urgent: false },
        ].map(r => (
          <div key={r.student} className="flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50 transition cursor-pointer" onClick={() => onNavigate('professor-project-detail')}>
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white',
              r.urgent ? 'bg-yellow-500' : 'bg-blue-500'
            )}>
              {r.student.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <p className={cn('text-sm font-medium', heading)}>{r.student} — {r.type}</p>
              <p className={cn('text-xs', mutedText)}>{r.project} · {r.date}</p>
            </div>
            {r.urgent && <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2.5 py-0.5 text-xs font-medium">Urgent</span>}
            <Button variant="secondary" size="sm"><Eye className="h-4 w-4" /> Review</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFESSOR GRADES
   ═══════════════════════════════════════════════════ */
export function ProfessorGrades({ onNavigate: _onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="space-y-6">
      <h1 className={cn('text-2xl font-bold', heading)}>Grades</h1>
      <div className={cn(card, 'overflow-hidden')}>
        <table className="w-full text-sm">
          <thead><tr className={tableHead}>
            <th className={cn('text-left py-3 px-5', thCell)}>Student</th>
            <th className={cn('text-left py-3 px-3', thCell)}>Project</th>
            <th className={cn('text-left py-3 px-3', thCell)}>Score</th>
            <th className={cn('text-left py-3 px-3', thCell)}>Grade</th>
            <th className={cn('text-left py-3 px-3', thCell)}>Status</th>
          </tr></thead>
          <tbody>
            <tr className={tableRow}>
              <td className={cn('py-3 px-5 font-medium', heading)}>Sneha Gupta</td>
              <td className={cn('py-3 px-3', bodyText)}>Student Portal</td>
              <td className={cn('py-3 px-3 font-bold', heading)}>92/100</td>
              <td className="py-3 px-3"><span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-0.5 text-xs font-bold">A</span></td>
              <td className="py-3 px-3"><StatusPill status="approved" /></td>
            </tr>
            <tr className={tableRow}>
              <td className={cn('py-3 px-5 font-medium', heading)}>Priya Patel</td>
              <td className={cn('py-3 px-3', bodyText)}>Library Management System</td>
              <td className={cn('py-3 px-3', mutedText)}>—</td>
              <td className={cn('py-3 px-3', mutedText)}>—</td>
              <td className="py-3 px-3"><StatusPill status="submitted" /></td>
            </tr>
            <tr className={tableRow}>
              <td className={cn('py-3 px-5 font-medium', heading)}>Rahul Sharma</td>
              <td className={cn('py-3 px-3', bodyText)}>E-Commerce Platform</td>
              <td className={cn('py-3 px-3', mutedText)}>—</td>
              <td className={cn('py-3 px-3', mutedText)}>—</td>
              <td className="py-3 px-3"><StatusPill status="in-progress" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════ */
export function AdminDashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold', heading)}>Admin Dashboard</h1>
        <p className={cn('text-sm', subtext)}>System overview and management</p>
      </div>

      <div className={kpiGrid}>
        <KPICard title="Total Users" value={8} subtitle="6 students, 2 professors" icon={<Users className="h-5 w-5" />} color="blue" />
        <KPICard title="Active Projects" value={5} subtitle="3 in progress" icon={<FolderGit2 className="h-5 w-5" />} color="purple" />
        <KPICard title="Gitea Status" value="Online" subtitle="gitea.ignou.local" icon={<Server className="h-5 w-5" />} color="green" />
        <KPICard title="Pending Reviews" value={2} subtitle="Needs attention" icon={<Eye className="h-5 w-5" />} color="yellow" />
      </div>

      <div className={twoColGrid}>
        <div className={card}>
          <div className={cn('p-5 flex items-center justify-between', sectionBorder)}>
            <h2 className={cn('text-sm font-semibold', heading)}>Recent Activity</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('admin-audit-logs')}>View Logs <ArrowUpRight className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="p-5">
            <ActivityTimeline activities={mockActivities} limit={6} />
          </div>
        </div>

        <div className="space-y-6">
          <div className={cn(card, 'p-5')}>
            <h2 className={cn('text-sm font-semibold mb-4', heading)}>Projects by Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Draft', count: 1, color: 'bg-neutral-400', pct: 20 },
                { label: 'In Progress', count: 2, color: 'bg-blue-500', pct: 40 },
                { label: 'Submitted', count: 1, color: 'bg-yellow-500', pct: 20 },
                { label: 'Approved', count: 1, color: 'bg-green-500', pct: 20 },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className={cn('text-xs w-20', bodyText)}>{s.label}</span>
                  <div className="flex-1 h-2 bg-neutral-100 dark:bg-[#21262d] rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', s.color)} style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className={cn('text-xs font-medium w-6 text-right', heading)}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(card, 'p-5')}>
            <h2 className={cn('text-sm font-semibold mb-3', heading)}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => onNavigate('admin-users')}><Users className="h-4 w-4" /> Manage Users</Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => onNavigate('admin-batches')}><BookOpen className="h-4 w-4" /> Batches</Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => onNavigate('admin-gitea-settings')}><Server className="h-4 w-4" /> Gitea Config</Button>
              <Button variant="secondary" size="sm" className="justify-start" onClick={() => onNavigate('admin-audit-logs')}><FileText className="h-4 w-4" /> Audit Logs</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN USERS
   ═══════════════════════════════════════════════════ */
export function AdminUsers() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="space-y-6">
      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New User">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1', heading)}>Full Name</label>
                <input type="text" className={inputClass} />
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-1', heading)}>Email</label>
                <input type="email" className={inputClass} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1', heading)}>Role</label>
                <select className={selectClass}><option>Student</option><option>Professor</option><option>Admin</option></select>
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-1', heading)}>Department</label>
                <input type="text" className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => setShowModal(false)}>Create User</Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', heading)}>User Management</h1>
          <p className={cn('text-sm', subtext)}>{mockUsers.length} total users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary"><Upload className="h-4 w-4" /> Import CSV</Button>
          <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Add User</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-1.5 flex-1 min-w-[200px]">
          <Search className={cn('h-4 w-4', mutedText)} />
          <input type="text" placeholder="Search users..." className={cn('bg-transparent text-sm outline-none w-full', heading)} />
        </div>
        <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /> Filters</Button>
      </div>

      <div className={cn(card, 'overflow-hidden')}>
        <table className="w-full text-sm">
          <thead><tr className={tableHead}>
            <th className={cn('text-left py-3 px-5', thCell)}>Name</th>
            <th className={cn('text-left py-3 px-3 hidden sm:table-cell', thCell)}>Email</th>
            <th className={cn('text-left py-3 px-3', thCell)}>Role</th>
            <th className={cn('text-left py-3 px-3 hidden md:table-cell', thCell)}>Department</th>
            <th className={cn('text-left py-3 px-3', thCell)}>Actions</th>
          </tr></thead>
          <tbody>
            {mockUsers.map(u => (
              <tr key={u.id} className={tableRow}>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-[#30363d] flex items-center justify-center text-neutral-600 dark:text-[#c9d1d9] text-xs font-semibold">
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className={cn('font-medium', heading)}>{u.name}</p>
                      {u.batch && <p className={cn('text-xs', mutedText)}>{u.batch}</p>}
                    </div>
                  </div>
                </td>
                <td className={cn('py-3 px-3 hidden sm:table-cell', bodyText)}>{u.email}</td>
                <td className="py-3 px-3">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    u.role === 'admin' ? 'bg-neutral-200 dark:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9]' :
                    u.role === 'professor' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  )}>{u.role}</span>
                </td>
                <td className={cn('py-3 px-3 hidden md:table-cell', bodyText)}>{u.department}</td>
                <td className="py-3 px-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="!text-red-600 dark:!text-red-400">Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN BATCHES
   ═══════════════════════════════════════════════════ */
export function AdminBatches() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', heading)}>Batches & Courses</h1>
          <p className={cn('text-sm', subtext)}>Manage academic batches and student-professor mappings</p>
        </div>
        <Button><Plus className="h-4 w-4" /> Create Batch</Button>
      </div>

      <div className={threeColGrid}>
        {[
          { name: 'BCA-2024', students: 4, professor: 'Dr. Anita Desai', projects: 3, active: true },
          { name: 'MCA-2024', students: 2, professor: 'Dr. Vikram Singh', projects: 2, active: true },
          { name: 'BCA-2023', students: 15, professor: 'Dr. Anita Desai', projects: 15, active: false },
        ].map(b => (
          <div key={b.name} className={cn(cardHover, 'p-5')}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className={cn('font-semibold', heading)}>{b.name}</h3>
                <p className={cn('text-xs', mutedText)}>{b.professor}</p>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                b.active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-500 dark:text-[#8b949e]'
              )}>{b.active ? 'Active' : 'Archived'}</span>
            </div>
            <div className={cn('flex gap-4 text-sm', bodyText)}>
              <span className="flex items-center gap-1"><Users className={cn('h-3.5 w-3.5', mutedText)} />{b.students} students</span>
              <span className="flex items-center gap-1"><FolderGit2 className={cn('h-3.5 w-3.5', mutedText)} />{b.projects} projects</span>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-[#30363d] flex gap-2">
              <Button variant="ghost" size="sm">Manage</Button>
              <Button variant="ghost" size="sm">Assign Students</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN GITEA SETTINGS
   ═══════════════════════════════════════════════════ */
export function AdminGiteaSettings() {
  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold', heading)}>Gitea Server Configuration</h1>
        <p className={cn('text-sm', subtext)}>Configure connection to your self-hosted Gitea instance</p>
      </div>

      <div className={cn(card, 'p-6 space-y-5')}>
        <div className="flex items-center justify-between p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-400">Server Connected</p>
              <p className="text-xs text-green-600 dark:text-green-500">Last checked: 2 minutes ago</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /><span className="text-xs font-medium text-green-700 dark:text-green-400">Online</span></span>
        </div>

        <div>
          <label className={cn('block text-sm font-medium mb-1.5', heading)}>Gitea Base URL</label>
          <input type="url" defaultValue="https://gitea.ignou.local" className={inputClass} />
        </div>
        <div>
          <label className={cn('block text-sm font-medium mb-1.5', heading)}>API Token</label>
          <input type="password" defaultValue="gta_xxxxxxxxxxxxxxxxxxxx" className={inputClass} />
        </div>
        <div>
          <label className={cn('block text-sm font-medium mb-1.5', heading)}>Organization Template</label>
          <input type="text" defaultValue="ignou-projects" className={inputClass} />
        </div>
        <div>
          <label className={cn('block text-sm font-medium mb-1.5', heading)}>Default Team Permissions</label>
          <select className={selectClass}>
            <option>Write (push/pull)</option><option>Read only</option><option>Admin</option>
          </select>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-[#30363d]">
          <h4 className={cn('text-sm font-semibold mb-3', heading)}>Webhook Configuration</h4>
          <div className={cn('flex items-center justify-between p-3', infoBox)}>
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className={cn('text-sm', heading)}>Webhook Secret</span>
            </div>
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Configured</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button>Save Configuration</Button>
          <Button variant="secondary"><RefreshCw className="h-4 w-4" /> Test Connection</Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN AUDIT LOGS
   ═══════════════════════════════════════════════════ */
export function AdminAuditLogs() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', heading)}>Audit Logs</h1>
          <p className={cn('text-sm', subtext)}>System-wide event log for security and compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter className="h-4 w-4" /> Filter</Button>
          <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className={cn(card, 'p-5')}>
        <ActivityTimeline activities={mockActivities} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVITY PAGE (ALL ROLES)
   ═══════════════════════════════════════════════════ */
export function ActivityPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', heading)}>Activity Timeline</h1>
          <p className={cn('text-sm', subtext)}>All recent events across the system</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Push', 'Milestone', 'Review', 'Comment'].map(f => (
            <button key={f} className={cn('rounded-full px-3 py-1 text-xs font-medium border transition',
              f === 'All' ? 'bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117] border-neutral-900 dark:border-[#f0f6fc]' : 'bg-white dark:bg-[#161b22] text-neutral-500 dark:text-[#8b949e] border-neutral-300 dark:border-[#30363d] hover:bg-neutral-50 dark:hover:bg-[#21262d]'
            )}>{f}</button>
          ))}
        </div>
      </div>
      <div className={cn(card, 'p-5')}>
        <ActivityTimeline activities={mockActivities} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SETTINGS PAGE (ALL ROLES)
   ═══════════════════════════════════════════════════ */
export function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    try { await dataService.updateProfile({ name: 'Rahul Sharma' }); setToast('Profile saved!'); } catch { setToast('Failed to save'); }
    setSaving(false);
    setTimeout(() => setToast(''), 3000);
  };

  const handleChangePassword = async () => {
    setSaving(true);
    try { await dataService.changePassword('old', 'new'); setToast('Password updated!'); } catch { setToast('Failed to update password'); }
    setSaving(false);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <h1 className={cn('text-2xl font-bold', heading)}>Settings</h1>

      <div className={cn(card, 'p-6 space-y-5')}>
        <h3 className={cn('font-semibold', heading)}>Profile Information</h3>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-[#30363d] flex items-center justify-center text-neutral-600 dark:text-[#c9d1d9] text-xl font-semibold">RS</div>
          <Button variant="secondary" size="sm">Change Photo</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={cn('block text-sm font-medium mb-1', heading)}>Full Name</label>
            <input type="text" defaultValue="Rahul Sharma" className={inputClass} />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-1', heading)}>Email</label>
            <input type="email" defaultValue="rahul@ignou.ac.in" className={inputClass} />
          </div>
        </div>
      </div>

      <div className={cn(card, 'p-6 space-y-5')}>
        <h3 className={cn('font-semibold', heading)}>Change Password</h3>
        <div className="space-y-3">
          <div>
            <label className={cn('block text-sm font-medium mb-1', heading)}>Current Password</label>
            <input type="password" className={inputClass} />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-1', heading)}>New Password</label>
            <input type="password" className={inputClass} />
          </div>
        </div>
        <Button onClick={handleChangePassword} disabled={saving}>
          {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
        </Button>
      </div>

      <div className={cn(card, 'p-6 space-y-5')}>
        <h3 className={cn('font-semibold', heading)}>Connected Accounts</h3>
        <div className={cn('flex items-center justify-between p-3', infoBox)}>
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className={cn('text-sm font-medium', heading)}>Gitea Account</p>
              <p className={cn('text-xs', mutedText)}>Connected as @rahul</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>
        </div>
      </div>

      <div className={cn(card, 'p-6 space-y-5')}>
        <h3 className={cn('font-semibold', heading)}>Notifications</h3>
        <div className="space-y-3">
          {['Email notifications for push events', 'Email on feedback received', 'Portal notifications for deadlines', 'Weekly activity digest'].map(n => (
            <label key={n} className="flex items-center justify-between">
              <span className={cn('text-sm', bodyText)}>{n}</span>
              <input type="checkbox" defaultChecked className="rounded border-neutral-300 dark:border-[#30363d] text-blue-600 focus:ring-blue-500" />
            </label>
          ))}
        </div>
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFILE PAGE (ALL ROLES)
   ═══════════════════════════════════════════════════ */
export function ProfilePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className={cn('text-2xl font-bold', heading)}>Profile</h1>
      <div className={cn(card, 'p-6')}>
        <div className="flex items-center gap-5 mb-6">
          <div className="h-20 w-20 rounded-full bg-neutral-200 dark:bg-[#30363d] flex items-center justify-center text-neutral-600 dark:text-[#c9d1d9] text-2xl font-semibold">RS</div>
          <div>
            <h2 className={cn('text-xl font-bold', heading)}>Rahul Sharma</h2>
            <p className={cn('text-sm', subtext)}>rahul@ignou.ac.in</p>
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 text-xs font-medium mt-1">Student</span>
          </div>
        </div>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><dt className={cn('mb-0.5', mutedText)}>Department</dt><dd className={cn('font-medium', heading)}>Computer Science</dd></div>
          <div><dt className={cn('mb-0.5', mutedText)}>Batch</dt><dd className={cn('font-medium', heading)}>BCA-2024</dd></div>
          <div><dt className={cn('mb-0.5', mutedText)}>Active Projects</dt><dd className={cn('font-medium', heading)}>1</dd></div>
          <div><dt className={cn('mb-0.5', mutedText)}>Gitea Username</dt><dd className={cn('font-medium', heading)}>@rahul</dd></div>
        </dl>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   REUSABLE: FEEDBACK THREAD (Real API)
   ═══════════════════════════════════════════════════ */

function FeedbackThread({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    dataService.getFeedback(projectId).then((data: unknown[]) => {
      if (data && Array.isArray(data) && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setComments(data.map((d: any) => ({ id: d._id, user: d.author?.name || 'Unknown', userRole: d.author?.role || 'student', message: d.content, timestamp: d.createdAt })));
      }
      setLoaded(true);
    });
  }, [projectId]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await dataService.addFeedback(projectId, newComment.trim());
      setComments(prev => [...prev, { id: `c${Date.now()}`, user: 'You', userRole: 'student' as const, message: newComment.trim(), timestamp: 'Just now' }]);
      setNewComment('');
    } catch { /* handled */ }
    setSending(false);
  };

  return (
    <div className={card}>
      <div className={cn('p-5', sectionBorder)}>
        <h3 className={cn('font-semibold', heading)}>Feedback Thread</h3>
        {!loaded && <span className={cn('text-xs ml-2', mutedText)}>Loading...</span>}
      </div>
      <div className="p-5 space-y-4">
        {comments.map(c => (
          <div key={c.id} className={cn('flex gap-3', c.userRole === 'student' ? 'flex-row-reverse' : '')}>
            <div className={cn('h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white',
              c.userRole === 'professor' ? 'bg-purple-500' : 'bg-blue-500'
            )}>
              {c.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className={cn('max-w-lg rounded-lg p-3 text-sm',
              c.userRole === 'professor' ? 'bg-neutral-100 dark:bg-[#21262d] text-neutral-800 dark:text-[#c9d1d9]' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('font-semibold text-xs', heading)}>{c.user}</span>
                <span className={cn('text-xs', mutedText)}>{c.timestamp}</span>
              </div>
              <p>{c.message}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={cn('p-5 flex gap-2', 'border-t border-neutral-100 dark:border-[#30363d]')}>
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Type your reply..."
          className={inputClass}
        />
        <Button onClick={handleSend} disabled={sending || !newComment.trim()}>
          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STUDENT MESSAGES — Chat with Professor
   ═══════════════════════════════════════════════════ */

interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  senderName: string;
  text: string;
  time: string;
  read: boolean;
  type: 'text' | 'file' | 'system';
  fileName?: string;
  fileSize?: string;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  project: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  avatar: string;
}

const studentConversations: Conversation[] = [
  { id: 'c1', name: 'Dr. Anita Desai', role: 'Professor', project: 'E-Commerce Platform', lastMessage: 'Please update the progress report by Friday.', lastTime: '2 min ago', unread: 2, online: true, avatar: 'AD' },
  { id: 'c2', name: 'Dr. Vikram Singh', role: 'Professor', project: 'Weather Dashboard', lastMessage: 'Good work on the API integration!', lastTime: '1 day ago', unread: 0, online: false, avatar: 'VS' },
];

const professorConversations: Conversation[] = [
  { id: 'c1', name: 'Rahul Sharma', role: 'Student', project: 'E-Commerce Platform', lastMessage: 'I have pushed the updated code.', lastTime: '5 min ago', unread: 1, online: true, avatar: 'RS' },
  { id: 'c2', name: 'Priya Patel', role: 'Student', project: 'Library Management System', lastMessage: 'Can you review my milestone 3?', lastTime: '30 min ago', unread: 3, online: true, avatar: 'PP' },
  { id: 'c3', name: 'Karan Mehta', role: 'Student', project: 'Weather Dashboard', lastMessage: 'Thank you for the feedback!', lastTime: '2 days ago', unread: 0, online: false, avatar: 'KM' },
];

const mockChatMessages: Record<string, ChatMessage[]> = {
  c1: [
    { id: 'm1', sender: 'other', senderName: 'Dr. Anita Desai', text: 'Hi Rahul, how is the project going?', time: '10:30 AM', read: true, type: 'text' },
    { id: 'm2', sender: 'me', senderName: 'Rahul Sharma', text: 'Hi Professor! I have completed the product catalog module and payment integration is in progress.', time: '10:32 AM', read: true, type: 'text' },
    { id: 'm3', sender: 'other', senderName: 'Dr. Anita Desai', text: 'Great progress! Can you share the updated database schema?', time: '10:35 AM', read: true, type: 'text' },
    { id: 'm4', sender: 'me', senderName: 'Rahul Sharma', text: '', time: '10:40 AM', read: true, type: 'file', fileName: 'Database_Schema_v2.pdf', fileSize: '1.2 MB' },
    { id: 'm5', sender: 'other', senderName: 'Dr. Anita Desai', text: 'Thanks! I will review this and get back to you.', time: '10:42 AM', read: true, type: 'text' },
    { id: 'm6', sender: 'other', senderName: 'Dr. Anita Desai', text: 'I reviewed the schema. The user table looks good but please add an index on the product_category field for better query performance.', time: '2:15 PM', read: true, type: 'text' },
    { id: 'm7', sender: 'me', senderName: 'Rahul Sharma', text: 'Sure, I will add that. I have also pushed the updated code with the cart functionality.', time: '2:20 PM', read: true, type: 'text' },
    { id: 'm8', sender: 'other', senderName: 'Dr. Anita Desai', text: 'Please update the progress report by Friday.', time: '4:00 PM', read: false, type: 'text' },
    { id: 'm9', sender: 'other', senderName: 'Dr. Anita Desai', text: 'Also make sure the README has setup instructions for the reviewer.', time: '4:01 PM', read: false, type: 'text' },
  ],
  c2: [
    { id: 'm10', sender: 'other', senderName: 'Dr. Vikram Singh', text: 'The weather API integration looks clean. Good work!', time: 'Yesterday', read: true, type: 'text' },
    { id: 'm11', sender: 'me', senderName: 'Rahul Sharma', text: 'Thank you Professor! I will work on the charting next.', time: 'Yesterday', read: true, type: 'text' },
  ],
};

function ChatView({ conversations, userType }: { conversations: Conversation[]; userType: 'student' | 'professor' }) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(mockChatMessages);
  const [showMobileList, setShowMobileList] = useState(true);

  const selectedConvo = conversations.find(c => c.id === selectedChat);
  const currentMessages = selectedChat ? (messages[selectedChat] || []) : [];

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedChat) return;
    const text = messageInput.trim();
    setMessageInput('');
    
    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: 'me',
      senderName: userType === 'student' ? 'Rahul Sharma' : 'Dr. Anita Desai',
      text,
      time: 'Just now',
      read: false,
      type: 'text',
    };
    setMessages(prev => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMsg],
    }));
    
    // Send to real API (fire and forget — message is already shown optimistically)
    try { await dataService.sendMessage(selectedChat, text); } catch { /* shown locally anyway */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn(card, 'flex h-[calc(100vh-180px)] min-h-[500px] overflow-hidden')}>
      {/* Conversation List */}
      <div className={cn(
        'w-full sm:w-80 border-r border-neutral-200 dark:border-[#30363d] flex flex-col shrink-0',
        selectedChat && !showMobileList ? 'hidden sm:flex' : 'flex'
      )}>
        <div className={cn('p-4 border-b border-neutral-200 dark:border-[#30363d]')}>
          <h2 className={cn('text-sm font-semibold mb-3', heading)}>Conversations</h2>
          <div className="flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-1.5">
            <Search className={cn('h-4 w-4', mutedText)} />
            <input type="text" placeholder="Search conversations..." className={cn('bg-transparent text-sm outline-none w-full', heading)} />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {conversations.map(convo => (
            <button
              key={convo.id}
              onClick={() => { setSelectedChat(convo.id); setShowMobileList(false); }}
              className={cn(
                'w-full flex items-start gap-3 p-4 text-left transition border-b border-neutral-50 dark:border-[#21262d]',
                selectedChat === convo.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 !border-l-blue-500'
                  : 'hover:bg-neutral-50 dark:hover:bg-[#21262d] border-l-2 border-l-transparent'
              )}
            >
              <div className="relative shrink-0">
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold',
                  convo.role === 'Professor' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                )}>
                  {convo.avatar}
                </div>
                {convo.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-[#161b22]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={cn('text-sm font-semibold truncate', heading)}>{convo.name}</span>
                  <span className={cn('text-[10px] shrink-0 ml-2', mutedText)}>{convo.lastTime}</span>
                </div>
                <p className={cn('text-xs mb-1', mutedText)}>{convo.project}</p>
                <p className={cn('text-xs truncate', convo.unread > 0 ? 'font-medium text-neutral-700 dark:text-[#c9d1d9]' : subtext)}>{convo.lastMessage}</p>
              </div>
              {convo.unread > 0 && (
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold mt-1">
                  {convo.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        'flex-1 flex flex-col',
        !selectedChat || showMobileList ? 'hidden sm:flex' : 'flex'
      )}>
        {selectedConvo ? (
          <>
            {/* Chat Header */}
            <div className={cn('flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-[#30363d]')}>
              <button
                onClick={() => setShowMobileList(true)}
                className="sm:hidden p-1 rounded hover:bg-neutral-100 dark:hover:bg-[#21262d]"
              >
                <ArrowUpRight className={cn('h-5 w-5 rotate-[225deg]', subtext)} />
              </button>
              <div className="relative">
                <div className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold',
                  selectedConvo.role === 'Professor' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                )}>
                  {selectedConvo.avatar}
                </div>
                {selectedConvo.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-[#161b22]" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={cn('text-sm font-semibold', heading)}>{selectedConvo.name}</h3>
                <p className={cn('text-xs', selectedConvo.online ? 'text-green-600 dark:text-green-400' : mutedText)}>
                  {selectedConvo.online ? 'Online' : 'Offline'} · {selectedConvo.project}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className={cn('p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-[#21262d]', subtext)}>
                  <FolderGit2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* System message */}
              <div className="flex justify-center">
                <span className={cn('text-[10px] px-3 py-1 rounded-full', 'bg-neutral-100 dark:bg-[#21262d]', mutedText)}>
                  Conversation about {selectedConvo.project}
                </span>
              </div>

              {currentMessages.map(msg => (
                <div key={msg.id} className={cn('flex', msg.sender === 'me' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[75%] sm:max-w-[65%]',
                    msg.sender === 'me' ? 'order-2' : 'order-1'
                  )}>
                    {msg.type === 'file' ? (
                      <div className={cn(
                        'rounded-lg p-3 border',
                        msg.sender === 'me'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white dark:bg-[#21262d] border-neutral-200 dark:border-[#30363d]'
                      )}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{msg.fileName}</p>
                            <p className={cn('text-xs', msg.sender === 'me' ? 'text-blue-100' : mutedText)}>{msg.fileSize}</p>
                          </div>
                          <Download className="h-4 w-4 shrink-0 cursor-pointer hover:opacity-70" />
                        </div>
                        <p className={cn('text-[10px] mt-1.5 text-right', msg.sender === 'me' ? 'text-blue-200' : mutedText)}>
                          {msg.time}
                          {msg.sender === 'me' && (
                            <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className={cn(
                        'rounded-lg px-3.5 py-2.5',
                        msg.sender === 'me'
                          ? 'bg-blue-500 text-white'
                          : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-800 dark:text-[#c9d1d9]'
                      )}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={cn('text-[10px] mt-1.5 text-right', msg.sender === 'me' ? 'text-blue-200' : mutedText)}>
                          {msg.time}
                          {msg.sender === 'me' && (
                            <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className={cn('p-4 border-t border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22]')}>
              <div className="flex items-end gap-2">
                <button className={cn('p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-[#21262d] shrink-0 mb-0.5', subtext)}>
                  <Upload className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className={cn(
                      'w-full rounded-lg border border-neutral-300 dark:border-[#30363d] px-4 py-2.5 text-sm outline-none resize-none',
                      'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      'bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-[#f0f6fc]',
                      'placeholder:text-neutral-400 dark:placeholder:text-[#484f58]'
                    )}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className={cn(
                    'p-2.5 rounded-lg shrink-0 mb-0.5 transition',
                    messageInput.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58] cursor-not-allowed'
                  )}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <p className={cn('text-[10px] mt-1.5 ml-10', mutedText)}>Press Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        ) : (
          /* Empty State — No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-[#21262d] flex items-center justify-center">
                  <MessageSquare className={cn('h-8 w-8', mutedText)} />
                </div>
              </div>
              <h3 className={cn('text-lg font-semibold mb-1', heading)}>Select a conversation</h3>
              <p className={cn('text-sm', subtext)}>
                Choose a conversation from the list to start chatting
                {userType === 'student' ? ' with your professor' : ' with your students'}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentMessages() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className={cn('text-2xl font-bold', heading)}>Messages</h1>
        <p className={cn('text-sm', subtext)}>Chat with your professors about your projects</p>
      </div>
      <ChatView conversations={studentConversations} userType="student" />
    </div>
  );
}

export function ProfessorMessages() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className={cn('text-2xl font-bold', heading)}>Messages</h1>
        <p className={cn('text-sm', subtext)}>Chat with your students about their projects</p>
      </div>
      <ChatView conversations={professorConversations} userType="professor" />
    </div>
  );
}
