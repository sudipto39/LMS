import { cn } from '@/utils/cn';
import type { ProjectStatus, MilestoneStatus, ActivityItem } from '@/types';
import {
  GitCommit, GitBranch, MessageSquare, Send, CheckCircle2, Eye, Star,
  Award, Clock, AlertTriangle, Server, Zap, CircleDot, Search, Bell,
  Moon, Sun, Menu, User, LogOut, ChevronDown, X
} from './Icons';
import { type ReactNode, useState } from 'react';

/* ── Status Pills (GitHub-style flat) ── */
const statusColors: Record<ProjectStatus, string> = {
  'draft': 'bg-neutral-100 dark:bg-[#21262d] text-neutral-600 dark:text-[#8b949e] border-neutral-300 dark:border-[#30363d]',
  'in-progress': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
  'submitted': 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
  'approved': 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800',
  'rejected': 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
};

const milestoneColors: Record<MilestoneStatus, string> = {
  'pending': 'bg-neutral-100 dark:bg-[#21262d] text-neutral-600 dark:text-[#8b949e] border-neutral-300 dark:border-[#30363d]',
  'in-progress': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
  'completed': 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800',
  'approved': 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800',
  'rejected': 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', statusColors[status])}>
      <CircleDot className="h-3 w-3" />
      {status.replace('-', ' ')}
    </span>
  );
}

export function MilestoneStatusPill({ status }: { status: MilestoneStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', milestoneColors[status])}>
      {status.replace('-', ' ')}
    </span>
  );
}

/* ── KPI Card ── */
export function KPICard({ title, value, subtitle, icon, color = 'blue' }: {
  title: string; value: string | number; subtitle?: string; icon: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const bgMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-5 transition hover:border-neutral-300 dark:hover:border-[#484f58]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-[#8b949e]">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-[#f0f6fc]">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-neutral-400 dark:text-[#484f58]">{subtitle}</p>}
        </div>
        <div className={cn('rounded-md p-2', bgMap[color])}>{icon}</div>
      </div>
    </div>
  );
}

/* ── Progress Bar ── */
export function ProgressBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-blue-500' : value >= 25 ? 'bg-yellow-500' : 'bg-neutral-400';
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-[#21262d]', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-neutral-500 dark:text-[#8b949e] min-w-[2rem] text-right">{value}%</span>
    </div>
  );
}

/* ── Activity Icon ── */
export function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const map: Record<string, { icon: ReactNode; bg: string }> = {
    push: { icon: <GitCommit className="h-4 w-4" />, bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
    milestone: { icon: <CheckCircle2 className="h-4 w-4" />, bg: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
    comment: { icon: <MessageSquare className="h-4 w-4" />, bg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' },
    submission: { icon: <Send className="h-4 w-4" />, bg: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' },
    review: { icon: <Eye className="h-4 w-4" />, bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
    grade: { icon: <Award className="h-4 w-4" />, bg: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' },
    repo: { icon: <GitBranch className="h-4 w-4" />, bg: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
    login: { icon: <User className="h-4 w-4" />, bg: 'bg-neutral-100 dark:bg-[#21262d] text-neutral-600 dark:text-[#8b949e]' },
  };
  const item = map[type] || map.login;
  return <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', item.bg)}>{item.icon}</div>;
}

/* ── Activity Timeline ── */
export function ActivityTimeline({ activities, limit }: { activities: ActivityItem[]; limit?: number }) {
  const items = limit ? activities.slice(0, limit) : activities;
  return (
    <div className="space-y-0">
      {items.map((a, i) => (
        <div key={a.id} className="flex gap-3 py-3 group">
          <div className="flex flex-col items-center">
            <ActivityIcon type={a.type} />
            {i < items.length - 1 && <div className="mt-1 w-px flex-1 bg-neutral-200 dark:bg-[#30363d]" />}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-sm text-neutral-900 dark:text-[#f0f6fc]">
              <span className="font-semibold">{a.user}</span>
              {a.project && <span className="text-neutral-500 dark:text-[#8b949e]"> on <span className="font-medium text-neutral-700 dark:text-[#c9d1d9]">{a.project}</span></span>}
            </p>
            <p className="text-sm text-neutral-600 dark:text-[#8b949e] mt-0.5">{a.message}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-neutral-400 dark:text-[#484f58] flex items-center gap-1"><Clock className="h-3 w-3" />{a.timestamp}</span>
              {a.branch && <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"><GitBranch className="h-3 w-3" />{a.branch}</span>}
              {a.commitHash && <span className="text-xs font-mono text-neutral-400 dark:text-[#484f58]">{a.commitHash}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tag ── */
export function TechTag({ label }: { label: string }) {
  return <span className="inline-flex rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">{label}</span>;
}

/* ── Inactivity Badge ── */
export function InactivityBadge({ lastPush }: { lastPush: string }) {
  const daysMatch = lastPush.match(/(\d+)\s*day/);
  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  if (lastPush === 'Never') return <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium"><AlertTriangle className="h-3 w-3" />No push</span>;
  if (days >= 10) return <span className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 font-medium"><AlertTriangle className="h-3 w-3" />Inactive {days}d</span>;
  return <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-[#484f58]"><Clock className="h-3 w-3" />{lastPush}</span>;
}

/* ── Button (GitHub-style) ── */
export function Button({ children, variant = 'primary', size = 'md', className, onClick, disabled }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg'; className?: string; onClick?: () => void; disabled?: boolean;
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const variants = {
    primary: 'bg-[#2da44e] text-white hover:bg-[#298e46] focus:ring-[#2da44e] border border-[#1a7f37]/20',
    secondary: 'bg-neutral-50 dark:bg-[#21262d] text-neutral-700 dark:text-[#c9d1d9] border border-neutral-300 dark:border-[#30363d] hover:bg-neutral-100 dark:hover:bg-[#30363d] focus:ring-blue-500',
    ghost: 'text-neutral-600 dark:text-[#8b949e] hover:bg-neutral-100 dark:hover:bg-[#21262d] focus:ring-neutral-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-red-700/20',
    success: 'bg-[#2da44e] text-white hover:bg-[#298e46] focus:ring-[#2da44e] border border-[#1a7f37]/20',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return <button className={cn(base, variants[variant], sizes[size], className)} onClick={onClick} disabled={disabled}>{children}</button>;
}

/* ── Empty State ── */
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-neutral-100 dark:bg-[#21262d] p-4 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-[#f0f6fc]">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-[#8b949e] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Toast ── */
export function Toast({ message, type = 'success', onClose }: {
  message: string; type?: 'success' | 'error' | 'info'; onClose: () => void;
}) {
  const colors = {
    success: 'bg-white dark:bg-[#161b22] border-green-300 dark:border-green-800 text-green-800 dark:text-green-400',
    error: 'bg-white dark:bg-[#161b22] border-red-300 dark:border-red-800 text-red-800 dark:text-red-400',
    info: 'bg-white dark:bg-[#161b22] border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-400'
  };
  const icons = { success: <CheckCircle2 className="h-5 w-5 text-green-500" />, error: <AlertTriangle className="h-5 w-5 text-red-500" />, info: <Zap className="h-5 w-5 text-blue-500" /> };
  return (
    <div className={cn('fixed top-4 right-4 z-50 flex items-center gap-3 rounded-md border px-4 py-3 shadow-lg animate-slide-in', colors[type])}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
    </div>
  );
}

/* ── Topbar (GitHub-style with dark mode toggle) ── */
export function Topbar({ sidebarOpen, setSidebarOpen, darkMode, setDarkMode, userName, userRole, onLogout }: {
  sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void;
  darkMode: boolean; setDarkMode: (v: boolean) => void;
  userName: string; userRole: string; onLogout: () => void;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-[#30363d]">
          <Menu className="h-5 w-5 text-neutral-600 dark:text-[#8b949e]" />
        </button>
        <div className="hidden lg:flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] bg-neutral-50 dark:bg-[#0d1117] px-3 py-1.5 w-80">
          <Search className="h-4 w-4 text-neutral-400 dark:text-[#484f58]" />
          <input type="text" placeholder="Search projects, students..." className="bg-transparent text-sm outline-none w-full text-neutral-700 dark:text-[#c9d1d9] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]" />
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="relative rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-[#30363d] text-neutral-500 dark:text-[#8b949e] transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className="relative h-5 w-5">
            <Sun className={cn("h-5 w-5 absolute inset-0 transition-all duration-300", darkMode ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")} />
            <Moon className={cn("h-5 w-5 absolute inset-0 transition-all duration-300", darkMode ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
          </div>
        </button>
        <div className="relative">
          <button onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }} className="relative rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-[#30363d] text-neutral-500 dark:text-[#8b949e]">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-xl z-50">
              <div className="p-4 border-b border-neutral-100 dark:border-[#30363d]"><h3 className="font-semibold text-sm text-neutral-900 dark:text-[#f0f6fc]">Notifications</h3></div>
              <div className="p-3 space-y-1 max-h-60 overflow-auto">
                <div className="flex gap-3 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-[#21262d] cursor-pointer">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-2 h-8 w-8 flex items-center justify-center"><GitCommit className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                  <div><p className="text-xs text-neutral-700 dark:text-[#c9d1d9]"><b>Rahul Sharma</b> pushed 3 commits</p><p className="text-xs text-neutral-400 dark:text-[#484f58]">2 hours ago</p></div>
                </div>
                <div className="flex gap-3 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-[#21262d] cursor-pointer">
                  <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/40 p-2 h-8 w-8 flex items-center justify-center"><Send className="h-4 w-4 text-yellow-700 dark:text-yellow-400" /></div>
                  <div><p className="text-xs text-neutral-700 dark:text-[#c9d1d9]"><b>Priya Patel</b> submitted for review</p><p className="text-xs text-neutral-400 dark:text-[#484f58]">1 day ago</p></div>
                </div>
                <div className="flex gap-3 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-[#21262d] cursor-pointer">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-2 h-8 w-8 flex items-center justify-center"><Star className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
                  <div><p className="text-xs text-neutral-700 dark:text-[#c9d1d9]"><b>Dr. Vikram</b> graded Student Portal</p><p className="text-xs text-neutral-400 dark:text-[#484f58]">3 days ago</p></div>
                </div>
              </div>
              <div className="p-3 border-t border-neutral-100 dark:border-[#30363d]"><button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline w-full text-center">View all notifications</button></div>
            </div>
          )}
        </div>
        <div className="h-5 w-px bg-neutral-200 dark:bg-[#30363d] mx-1" />
        <div className="relative">
          <button onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-[#21262d]">
            <div className="h-7 w-7 rounded-full bg-neutral-200 dark:bg-[#30363d] flex items-center justify-center text-neutral-600 dark:text-[#c9d1d9] text-xs font-semibold">
              {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] leading-tight">{userName}</p>
              <p className="text-xs text-neutral-400 dark:text-[#484f58] capitalize">{userRole}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-neutral-400 dark:text-[#484f58] hidden sm:block" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-12 w-56 rounded-lg border border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-xl z-50">
              <div className="p-3 border-b border-neutral-100 dark:border-[#30363d]">
                <p className="text-sm font-medium text-neutral-700 dark:text-[#c9d1d9]">{userName}</p>
                <p className="text-xs text-neutral-400 dark:text-[#484f58] capitalize">{userRole}</p>
              </div>
              <div className="p-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-[#8b949e] hover:bg-neutral-50 dark:hover:bg-[#21262d] rounded-md"><User className="h-4 w-4" /> Profile</button>
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"><LogOut className="h-4 w-4" /> Log out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Card Skeleton ── */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-neutral-200 dark:bg-[#30363d] rounded w-24" />
          <div className="h-6 bg-neutral-200 dark:bg-[#30363d] rounded w-48" />
          <div className="h-3 bg-neutral-100 dark:bg-[#21262d] rounded w-32 mt-2" />
        </div>
        <div className="h-10 w-10 bg-neutral-200 dark:bg-[#30363d] rounded-md" />
      </div>
    </div>
  );
}

/* ── Table Skeleton ── */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-neutral-100 dark:bg-[#21262d] rounded-t-lg mb-1" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-neutral-50 dark:bg-[#161b22] border-b border-neutral-100 dark:border-[#30363d] flex items-center px-4 gap-4">
          <div className="h-4 bg-neutral-200 dark:bg-[#30363d] rounded w-1/4" />
          <div className="h-4 bg-neutral-200 dark:bg-[#30363d] rounded w-1/6" />
          <div className="h-4 bg-neutral-200 dark:bg-[#30363d] rounded w-1/6" />
          <div className="h-4 bg-neutral-100 dark:bg-[#21262d] rounded w-1/5" />
        </div>
      ))}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative w-full rounded-lg bg-white dark:bg-[#161b22] shadow-2xl border border-neutral-200 dark:border-[#30363d]', widths[size])}>
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-[#30363d] px-5 py-3">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-[#f0f6fc]">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-neutral-100 dark:hover:bg-[#30363d]"><X className="h-5 w-5 text-neutral-400 dark:text-[#8b949e]" /></button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

/* ── Gitea Badge ── */
export function GiteaBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400">
      <Server className="h-3.5 w-3.5" />
      Private Server + Gitea
    </div>
  );
}
