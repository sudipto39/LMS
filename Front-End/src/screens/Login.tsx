import { useState } from 'react';
import { Button } from '@/components/ui';
import { Mail, Lock, Layers, GitBranch, Shield, ArrowUpRight, Moon, Sun, ChevronLeft } from '@/components/Icons';
import type { Role, Page } from '@/types';

export function Login({ onLogin, onNavigate, goBack, darkMode, setDarkMode }: { 
  onLogin: (role: Role) => void; 
  onNavigate: (page: Page) => void;
  goBack: () => void;
  darkMode: boolean; 
  setDarkMode: (v: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 dark:bg-[#010409] relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 border border-white/20">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">GiteaForge</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Manage Projects.<br />Track Progress.<br />Collaborate Securely.
          </h2>
          <p className="text-neutral-400 text-base leading-relaxed max-w-md mb-8">
            Your institute's private project management portal with self-hosted Gitea integration. All code stays on your servers.
          </p>
          <div className="space-y-4">
            {[
              { icon: <GitBranch className="h-5 w-5" />, text: 'Private Git repositories on institute server' },
              { icon: <Shield className="h-5 w-5" />, text: 'Role-based access for students & professors' },
              { icon: <ArrowUpRight className="h-5 w-5" />, text: 'Real-time progress tracking & review' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-neutral-300">
                <div className="rounded-md bg-white/10 p-2 border border-white/10">{f.icon}</div>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50 dark:bg-[#0d1117] relative">
        {/* Top buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-[#f0f6fc] font-medium transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-[#30363d] text-neutral-500 dark:text-[#8b949e] transition"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 dark:bg-[#f0f6fc]">
              <Layers className="h-4.5 w-4.5 text-white dark:text-[#0d1117]" />
            </div>
            <span className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc]">GiteaForge</span>
          </div>

          {showForgot ? (
            <div className="rounded-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-8">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-1">Reset Password</h2>
              <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-6">Enter your email to receive a reset link.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1">Email</label>
                  <div className="flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white dark:bg-[#0d1117]">
                    <Mail className="h-4 w-4 text-neutral-400 dark:text-[#484f58]" />
                    <input type="email" placeholder="you@ignou.ac.in" className="w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]" />
                  </div>
                </div>
                <Button className="w-full">Send Reset Link</Button>
                <button onClick={() => setShowForgot(false)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center">
                  Back to login
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-8">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-1">Welcome back</h2>
              <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-6">Sign in to your GiteaForge account</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1">Email</label>
                  <div className="flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white dark:bg-[#0d1117]">
                    <Mail className="h-4 w-4 text-neutral-400 dark:text-[#484f58]" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@ignou.ac.in" className="w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1">Password</label>
                  <div className="flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white dark:bg-[#0d1117]">
                    <Lock className="h-4 w-4 text-neutral-400 dark:text-[#484f58]" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-[#8b949e]">
                    <input type="checkbox" className="rounded border-neutral-300 dark:border-[#30363d] text-blue-600 focus:ring-blue-500" />
                    Remember me
                  </label>
                  <button onClick={() => setShowForgot(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <Button className="w-full" onClick={() => onLogin('student')}>
                  Sign in
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200 dark:border-[#30363d]" /></div>
                  <div className="relative flex justify-center"><span className="bg-white dark:bg-[#161b22] px-3 text-xs text-neutral-400 dark:text-[#8b949e]">or continue with</span></div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] px-4 py-2 text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] hover:bg-neutral-50 dark:hover:bg-[#30363d] transition">
                  <GitBranch className="h-4 w-4 text-green-600" />
                  Login with Gitea
                </button>
              </div>

              {/* Sign up link */}
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-[#30363d] text-center">
                <p className="text-sm text-neutral-500 dark:text-[#8b949e]">
                  Don&apos;t have an account?{' '}
                  <button onClick={() => onNavigate('signup')} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Request Account
                  </button>
                </p>
              </div>

              {/* Demo login buttons */}
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-[#30363d]">
                <p className="text-xs text-neutral-400 dark:text-[#8b949e] text-center mb-3">Quick demo login:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => onLogin('student')} className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                    Student
                  </button>
                  <button onClick={() => onLogin('professor')} className="rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 text-xs font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition">
                    Professor
                  </button>
                  <button onClick={() => onLogin('admin')} className="rounded-md border border-neutral-300 dark:border-[#30363d] bg-neutral-100 dark:bg-[#21262d] px-3 py-2 text-xs font-medium text-neutral-700 dark:text-[#c9d1d9] hover:bg-neutral-200 dark:hover:bg-[#30363d] transition">
                    Admin
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
