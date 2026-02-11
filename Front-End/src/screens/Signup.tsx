import { useState } from 'react';
import { Button } from '@/components/ui';
import { 
  Mail, Lock, Layers, Moon, Sun, User, ChevronLeft, 
  BookOpen, Hash, Globe, Calendar
} from '@/components/Icons';
import { Phone } from 'lucide-react';
import type { Page } from '@/types';

export function Signup({ onNavigate, goBack, darkMode, setDarkMode }: { 
  onNavigate: (page: Page) => void; 
  goBack: () => void;
  darkMode: boolean; 
  setDarkMode: (v: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    department: '',
    session: '',
    university: '',
    rollNo: '',
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const inputWrap = "flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white dark:bg-[#0d1117] transition";
  const inputField = "w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]";
  const labelClass = "block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1.5";
  const iconClass = "h-4 w-4 text-neutral-400 dark:text-[#484f58] shrink-0";

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0d1117] p-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-10">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-2">Account Request Submitted!</h2>
            <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-6">
              Your registration request has been sent to the administrator for approval. You&apos;ll receive an email once your account is activated.
            </p>
            <Button className="w-full" onClick={() => onNavigate('login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-neutral-900 dark:bg-[#010409] relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 border border-white/20">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">GiteaForge</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Create Your<br />Student Account
          </h2>
          <p className="text-neutral-400 text-base leading-relaxed max-w-md mb-8">
            Register to access your institute&apos;s project management portal. Once approved by admin, you&apos;ll be able to create projects and link repositories.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold">1</div>
              <span className="text-neutral-300 text-sm">Fill in your personal & academic details</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold">2</div>
              <span className="text-neutral-300 text-sm">Admin reviews and approves your account</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold">3</div>
              <span className="text-neutral-300 text-sm">Login and start managing your projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-neutral-50 dark:bg-[#0d1117] relative overflow-auto">
        {/* Top buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-[#f0f6fc] font-medium transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Login
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-[#30363d] text-neutral-500 dark:text-[#8b949e] transition"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <div className="w-full max-w-lg mt-12">
          <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 dark:bg-[#f0f6fc]">
              <Layers className="h-4.5 w-4.5 text-white dark:text-[#0d1117]" />
            </div>
            <span className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc]">GiteaForge</span>
          </div>

          <div className="rounded-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-1">Create Account</h2>
            <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-6">
              {step === 1 ? 'Step 1 of 2 — Personal Information' : 'Step 2 of 2 — Academic Details'}
            </p>

            {/* Step indicators */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step >= 1 ? 'bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117]' : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]'
                }`}>1</div>
                <span className={`text-sm font-medium ${step >= 1 ? 'text-neutral-900 dark:text-[#f0f6fc]' : 'text-neutral-400 dark:text-[#484f58]'}`}>Personal</span>
              </div>
              <div className={`w-12 h-px ${step >= 2 ? 'bg-neutral-400 dark:bg-[#8b949e]' : 'bg-neutral-200 dark:bg-[#30363d]'}`} />
              <div className="flex items-center gap-2 flex-1">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step >= 2 ? 'bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117]' : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]'
                }`}>2</div>
                <span className={`text-sm font-medium ${step >= 2 ? 'text-neutral-900 dark:text-[#f0f6fc]' : 'text-neutral-400 dark:text-[#484f58]'}`}>Academic</span>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <div className={inputWrap}>
                    <User className={iconClass} />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={e => updateField('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      className={inputField}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <div className={inputWrap}>
                    <Mail className={iconClass} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder="you@ignou.ac.in"
                      className={inputField}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <div className={inputWrap}>
                    <Phone className={iconClass} />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={e => updateField('phoneNumber', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputField}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className={inputWrap}>
                    <Lock className={iconClass} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => updateField('password', e.target.value)}
                      placeholder="Min. 8 characters"
                      className={inputField}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <div className={inputWrap}>
                    <Lock className={iconClass} />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => updateField('confirmPassword', e.target.value)}
                      placeholder="Re-enter your password"
                      className={inputField}
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button className="w-full mt-2" onClick={() => setStep(2)}>
                  Next: Academic Details →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {/* University */}
                <div>
                  <label className={labelClass}>University *</label>
                  <div className={inputWrap}>
                    <Globe className={iconClass} />
                    <input
                      type="text"
                      value={formData.university}
                      onChange={e => updateField('university', e.target.value)}
                      placeholder="e.g., IGNOU"
                      className={inputField}
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className={labelClass}>Department *</label>
                  <div className={inputWrap}>
                    <BookOpen className={iconClass} />
                    <select
                      value={formData.department}
                      onChange={e => updateField('department', e.target.value)}
                      className={`${inputField} cursor-pointer`}
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics">Electronics & Communication</option>
                      <option value="Mechanical">Mechanical Engineering</option>
                      <option value="Civil">Civil Engineering</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Session */}
                <div>
                  <label className={labelClass}>Session / Batch *</label>
                  <div className={inputWrap}>
                    <Calendar className={iconClass} />
                    <select
                      value={formData.session}
                      onChange={e => updateField('session', e.target.value)}
                      className={`${inputField} cursor-pointer`}
                    >
                      <option value="">Select Session</option>
                      <option value="2024-25">2024-25</option>
                      <option value="2023-24">2023-24</option>
                      <option value="2022-23">2022-23</option>
                      <option value="2025-26">2025-26</option>
                    </select>
                  </div>
                </div>

                {/* Roll Number */}
                <div>
                  <label className={labelClass}>Roll Number / Enrollment No. *</label>
                  <div className={inputWrap}>
                    <Hash className={iconClass} />
                    <input
                      type="text"
                      value={formData.rollNo}
                      onChange={e => updateField('rollNo', e.target.value)}
                      placeholder="e.g., 2024BCA001"
                      className={inputField}
                    />
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 text-sm text-neutral-600 dark:text-[#8b949e] pt-1">
                  <input type="checkbox" className="rounded border-neutral-300 dark:border-[#30363d] text-blue-600 focus:ring-blue-500 mt-0.5" />
                  <span>I agree to the <button className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</button> and <button className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</button></span>
                </label>

                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button className="flex-1" onClick={() => setShowSuccess(true)}>
                    Create Account
                  </Button>
                </div>
              </div>
            )}

            {/* Already have account */}
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-[#30363d] text-center">
              <p className="text-sm text-neutral-500 dark:text-[#8b949e]">
                Already have an account?{' '}
                <button onClick={() => onNavigate('login')} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
