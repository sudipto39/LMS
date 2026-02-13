import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Mail, Lock, Layers, GitBranch, Shield, ArrowUpRight, Moon, Sun, ChevronLeft, AlertTriangle, Eye, EyeOff } from '@/components/Icons';
import { validateLogin, validateEmail, checkRateLimit, sanitizeInput, preventClickjacking } from '@/utils/security';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [forgotError, setForgotError] = useState('');
  const [loginAttemptError, setLoginAttemptError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Anti-clickjacking on mount
  useEffect(() => {
    try { preventClickjacking(); } catch { /* handled inside */ }
  }, []);

  // Clear errors on input change
  const handleEmailChange = useCallback((val: string) => {
    setEmail(sanitizeInput(val));
    setErrors(prev => ({ ...prev, email: undefined }));
    setLoginAttemptError('');
  }, []);

  const handlePasswordChange = useCallback((val: string) => {
    setPassword(val); // Don't sanitize password (it may contain special chars)
    setErrors(prev => ({ ...prev, password: undefined }));
    setLoginAttemptError('');
  }, []);

  const handleLogin = useCallback(() => {
    // Validate inputs
    const validation = validateLogin(email, password);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Client-side rate limiting — max 5 attempts per minute
    const rateCheck = checkRateLimit('login', 5, 60000);
    if (!rateCheck.allowed) {
      setLoginAttemptError(`Too many login attempts. Please wait ${rateCheck.retryAfter} seconds.`);
      return;
    }

    setIsSubmitting(true);
    setLoginAttemptError('');

    // Try real API first, fall back to demo mode
    import('@/services/dataService').then(async ({ default: ds }) => {
      try {
        const result = await ds.login(email, password);
        setIsSubmitting(false);
        const role = result.user?.role || 'student';
        // Store tokens for authenticated API calls
        if (result.token && result.token !== 'demo-token') {
          localStorage.setItem('giteaforge_token', result.token);
          localStorage.setItem('giteaforge_refresh_token', result.refreshToken);
        }
        onLogin(role as 'student' | 'professor' | 'admin');
      } catch {
        setIsSubmitting(false);
        setLoginAttemptError('Invalid email or password. Please try again.');
      }
    });
  }, [email, password, onLogin]);

  const handleForgotPassword = useCallback(() => {
    const emailResult = validateEmail(forgotEmail);
    if (!emailResult.valid) {
      setForgotError(emailResult.error);
      return;
    }

    const rateCheck = checkRateLimit('forgot-password', 3, 120000);
    if (!rateCheck.allowed) {
      setForgotError(`Too many attempts. Please wait ${rateCheck.retryAfter} seconds.`);
      return;
    }

    setForgotError('');
    setForgotSuccess(true);
  }, [forgotEmail]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showForgot) handleForgotPassword();
      else handleLogin();
    }
  }, [showForgot, handleForgotPassword, handleLogin]);

  const inputWrap = (hasError: boolean) =>
    `flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 bg-white dark:bg-[#0d1117] transition ${
      hasError
        ? 'border-red-400 dark:border-red-700 focus-within:ring-red-500 focus-within:border-red-500'
        : 'border-neutral-300 dark:border-[#30363d] focus-within:ring-blue-500 focus-within:border-blue-500'
    }`;

  return (
    <div className="min-h-screen flex" onKeyDown={handleKeyDown}>
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
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
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

              {forgotSuccess ? (
                <div className="space-y-4">
                  <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                    <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                      If an account with that email exists, you'll receive a password reset link shortly.
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Check your spam folder if you don't see it within a few minutes.
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => { setShowForgot(false); setForgotSuccess(false); setForgotEmail(''); }}>
                    Back to login
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1">Email</label>
                    <div className={inputWrap(!!forgotError)}>
                      <Mail className="h-4 w-4 text-neutral-400 dark:text-[#484f58]" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
                        placeholder="you@ignou.ac.in"
                        className="w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]"
                        autoComplete="email"
                        maxLength={254}
                      />
                    </div>
                    {forgotError && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />{forgotError}
                      </p>
                    )}
                  </div>
                  <Button className="w-full" onClick={handleForgotPassword}>Send Reset Link</Button>
                  <button
                    onClick={() => { setShowForgot(false); setForgotError(''); }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
                  >
                    Back to login
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-8">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-1">Welcome back</h2>
              <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-6">Sign in to your GiteaForge account</p>

              {/* Rate limit / general error */}
              {loginAttemptError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{loginAttemptError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1">Email</label>
                  <div className={inputWrap(!!errors.email)}>
                    <Mail className="h-4 w-4 text-neutral-400 dark:text-[#484f58]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => handleEmailChange(e.target.value)}
                      placeholder="you@ignou.ac.in"
                      className="w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]"
                      autoComplete="email"
                      maxLength={254}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />{errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1">Password</label>
                  <div className={inputWrap(!!errors.password)}>
                    <Lock className="h-4 w-4 text-neutral-400 dark:text-[#484f58]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => handlePasswordChange(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]"
                      autoComplete="current-password"
                      maxLength={128}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-neutral-400 dark:text-[#484f58] hover:text-neutral-600 dark:hover:text-[#8b949e] transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />{errors.password}
                    </p>
                  )}
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

                <Button className="w-full" onClick={handleLogin} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Signing in...
                    </span>
                  ) : 'Sign in'}
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
