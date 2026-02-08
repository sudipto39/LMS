import { cn } from '@/utils/cn';
import type { Role, Page } from '@/types';
import {
  LayoutDashboard, FolderGit2, Activity, Settings, User,
  Users, BookOpen, Server, FileText, Award,
  ListChecks, Eye, ChevronLeft, FolderOpen, Globe,
  Layers, Send
} from './Icons';
import { type ReactNode } from 'react';

interface NavItem {
  label: string;
  icon: ReactNode;
  page: Page;
}

function getNavItems(role: Role): NavItem[] {
  if (role === 'student') {
    return [
      { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, page: 'student-dashboard' },
      { label: 'My Projects', icon: <FolderGit2 className="h-5 w-5" />, page: 'student-projects' },
      { label: 'Create Project', icon: <FolderOpen className="h-5 w-5" />, page: 'student-create-project' },
      { label: 'Milestones', icon: <ListChecks className="h-5 w-5" />, page: 'student-project-detail' },
      { label: 'Submissions', icon: <Send className="h-5 w-5" />, page: 'student-submissions' },
      { label: 'Activity', icon: <Activity className="h-5 w-5" />, page: 'activity' },
      { label: 'Settings', icon: <Settings className="h-5 w-5" />, page: 'settings' },
      { label: 'Profile', icon: <User className="h-5 w-5" />, page: 'student-profile' },
    ];
  }
  if (role === 'professor') {
    return [
      { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, page: 'professor-dashboard' },
      { label: 'Supervised Projects', icon: <FolderGit2 className="h-5 w-5" />, page: 'professor-projects' },
      { label: 'Reviews', icon: <Eye className="h-5 w-5" />, page: 'professor-reviews' },
      { label: 'Grades', icon: <Award className="h-5 w-5" />, page: 'professor-grades' },
      { label: 'Activity Feed', icon: <Activity className="h-5 w-5" />, page: 'activity' },
      { label: 'Settings', icon: <Settings className="h-5 w-5" />, page: 'settings' },
      { label: 'Profile', icon: <User className="h-5 w-5" />, page: 'professor-profile' },
    ];
  }
  return [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, page: 'admin-dashboard' },
    { label: 'Users', icon: <Users className="h-5 w-5" />, page: 'admin-users' },
    { label: 'Batches / Courses', icon: <BookOpen className="h-5 w-5" />, page: 'admin-batches' },
    { label: 'Gitea Settings', icon: <Server className="h-5 w-5" />, page: 'admin-gitea-settings' },
    { label: 'Audit Logs', icon: <FileText className="h-5 w-5" />, page: 'admin-audit-logs' },
    { label: 'Activity', icon: <Activity className="h-5 w-5" />, page: 'activity' },
    { label: 'Settings', icon: <Settings className="h-5 w-5" />, page: 'settings' },
    { label: 'Profile', icon: <User className="h-5 w-5" />, page: 'admin-profile' },
  ];
}

export function Sidebar({ role, currentPage, onNavigate, open, onClose }: {
  role: Role; currentPage: Page; onNavigate: (page: Page) => void;
  open: boolean; onClose: () => void;
}) {
  const items = getNavItems(role);
  const roleLabel = role === 'student' ? 'Student' : role === 'professor' ? 'Professor' : 'Admin';

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed left-0 top-0 z-50 flex h-full w-60 flex-col border-r border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 dark:border-[#30363d] px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 dark:bg-[#f0f6fc]">
              <Layers className="h-4.5 w-4.5 text-white dark:text-[#0d1117]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900 dark:text-[#f0f6fc] leading-tight">GiteaForge</h1>
              <p className="text-[10px] text-neutral-400 dark:text-[#8b949e] font-medium uppercase tracking-wider">{roleLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden rounded-md p-1 hover:bg-neutral-100 dark:hover:bg-[#30363d]">
            <ChevronLeft className="h-5 w-5 text-neutral-400 dark:text-[#8b949e]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-2 space-y-0.5">
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-neutral-400 dark:text-[#484f58] uppercase tracking-widest">Navigation</p>
          {items.map((item) => (
            <button
              key={item.page}
              onClick={() => { onNavigate(item.page); onClose(); }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                currentPage === item.page
                  ? 'bg-neutral-100 dark:bg-[#21262d] text-neutral-900 dark:text-[#f0f6fc]'
                  : 'text-neutral-600 dark:text-[#8b949e] hover:bg-neutral-50 dark:hover:bg-[#21262d] hover:text-neutral-900 dark:hover:text-[#f0f6fc]'
              )}
            >
              <span className={cn(currentPage === item.page ? 'text-neutral-700 dark:text-[#c9d1d9]' : 'text-neutral-400 dark:text-[#484f58]')}>
                {item.icon}
              </span>
              {item.label}
              {currentPage === item.page && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-[#30363d] p-3">
          <div className="rounded-md bg-neutral-50 dark:bg-[#0d1117] p-3 border border-neutral-200 dark:border-[#30363d]">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-neutral-500 dark:text-[#8b949e]" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-[#c9d1d9]">Gitea Server</span>
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-[#8b949e] font-mono">gitea.ignou.local</p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
