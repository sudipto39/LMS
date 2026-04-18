// import { useState, useCallback, useEffect } from 'react';
// import { Button } from '@/components/ui';
// import { 
//   Mail, Lock, Layers, Moon, Sun, User, ChevronLeft, 
//   BookOpen, Hash, Globe, Calendar, AlertTriangle, Eye, EyeOff,
//   ShieldCheck, Check
// } from '@/components/Icons';
// import { Phone } from 'lucide-react';
// import {
//   validateSignupStep1, validateSignupStep2, checkPasswordStrength,
//   checkRateLimit, sanitizeInput, preventClickjacking,
//   type SignupFormData, type PasswordStrength
// } from '@/utils/security';
// import type { Page } from '@/types';

// export function Signup({ onNavigate, goBack, darkMode, setDarkMode }: { 
//   onNavigate: (page: Page) => void; 
//   goBack: () => void;
//   darkMode: boolean; 
//   setDarkMode: (v: boolean) => void;
// }) {
//   const [formData, setFormData] = useState<SignupFormData>({
//     fullName: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     phoneNumber: '',
//     department: '',
//     session: '',
//     university: '',
//     rollNo: '',
//     termsAccepted: false,
//   });

//   const [step, setStep] = useState<1 | 2>(1);
//   // const [showSuccess, setShowSuccess] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
//   const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState('');

//   // Anti-clickjacking
//   useEffect(() => {
//     try { preventClickjacking(); } catch { /* handled */ }
//   }, []);

//   // Update password strength on password change
//   useEffect(() => {
//     if (formData.password) {
//       setPasswordStrength(checkPasswordStrength(formData.password));
//     } else {
//       setPasswordStrength(null);
//     }
//   }, [formData.password]);

//   const updateField = useCallback((field: keyof SignupFormData, value: string | boolean) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     // Clear error for this field
//     setErrors(prev => {
//       const next = { ...prev };
//       delete next[field];
//       return next;
//     });
//     setSubmitError('');
//   }, []);

//   // Sanitize text inputs (not password or select)
//   const updateTextField = useCallback((field: keyof SignupFormData, value: string) => {
//     const sanitized = field === 'password' || field === 'confirmPassword' ? value : sanitizeInput(value);
//     updateField(field, sanitized);
//   }, [updateField]);

//   const handleStep1Next = useCallback(() => {
//     const result = validateSignupStep1(formData);
//     if (!result.valid) {
//       setErrors(result.errors);
//       return;
//     }
//     setErrors({});
//     setStep(2);
//   }, [formData]);

//   const handleSubmit = useCallback(() => {
//     const result = validateSignupStep2(formData);
//     if (!result.valid) {
//       setErrors(result.errors);
//       return;
//     }

//     // Rate limit signups
//     const rateCheck = checkRateLimit('signup', 3, 300000); // 3 per 5 min
//     if (!rateCheck.allowed) {
//       setSubmitError(`Too many signup attempts. Please wait ${rateCheck.retryAfter} seconds.`);
//       return;
//     }

//     setIsSubmitting(true);
//     setSubmitError('');

//     // Call real API (falls back to demo if backend unavailable)
//     import('@/services/dataService').then(async ({ default: ds }) => {
//       try {
//         const response = await ds.register({
//           fullName: formData.fullName,
//           email: formData.email,
//           password: formData.password,
//           passwordConfirm: formData.confirmPassword,
//           phone: formData.phoneNumber,
//           university: formData.university,
//           department: formData.department,
//           session: formData.session,
//           rollNumber: formData.rollNo,
//           role: 'student',
//         });
        
//         // Clear any existing auth data first
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
        
//         // Store authentication token and user data from the response
//         // Backend returns: { status, token, data: { user } }
//         if (response.token) {
//           localStorage.setItem('token', response.token);
//           console.log('Token stored after registration');
//         }
        
//         // Extract user from nested data structure
//         const user = response.data?.user || response.user;
//         if (user) {
//           localStorage.setItem('user', JSON.stringify(user));
//           console.log('User stored after registration:', user.name || user.fullName);
//         } else {
//           console.warn('No user data in registration response');
//         }
        
//         setIsSubmitting(false);
//         // Redirect to student dashboard after successful registration
//         onNavigate('student-dashboard');
//       } catch (error) {
//         setIsSubmitting(false);
//         setSubmitError('Registration failed. Please try again or contact admin.');
//         console.error('Registration error:', error);
//       }
//     });
//   }, [formData]);

//   // Handle Enter key
//   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       if (step === 1) handleStep1Next();
//       else handleSubmit();
//     }
//   }, [step, handleStep1Next, handleSubmit]);

//   const inputWrap = (hasError: boolean) =>
//     `flex items-center gap-2 rounded-md border px-3 py-2.5 focus-within:ring-2 bg-white dark:bg-[#0d1117] transition ${
//       hasError
//         ? 'border-red-400 dark:border-red-700 focus-within:ring-red-500 focus-within:border-red-500'
//         : 'border-neutral-300 dark:border-[#30363d] focus-within:ring-blue-500 focus-within:border-blue-500'
//     }`;
//   const inputField = "w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]";
//   const labelClass = "block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1.5";
//   const iconClass = "h-4 w-4 text-neutral-400 dark:text-[#484f58] shrink-0";
//   const errorClass = "text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1";

//   // Commented out success card - now redirects directly to dashboard
//   // if (showSuccess) {
//   //   return (
//   //     <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0d1117] p-4">
//   //       <div className="w-full max-w-md text-center">
//   //         <div className="rounded-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-10">
//   //           <div className="flex items-center justify-center mb-4">
//   //             <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
//   //               <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
//   //             </div>
//   //           </div>
//   //           <h2 className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-2">Account Request Submitted!</h2>
//   //           <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-2">
//   //             Your registration request has been sent to the administrator for approval.
//   //           </p>
//   //           <p className="text-xs text-neutral-400 dark:text-[#484f58] mb-6">
//   //             You&apos;ll receive an email at <span className="font-medium text-neutral-600 dark:text-[#8b949e]">{formData.email}</span> once your account is activated.
//   //           </p>
//   //           <Button className="w-full" onClick={() => onNavigate('login')}>
//   //             Go to Login
//   //           </Button>
//   //         </div>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   return (
//     <div className="min-h-screen flex" onKeyDown={handleKeyDown}>
//       {/* Left Panel */}
//       <div className="hidden lg:flex lg:w-5/12 bg-neutral-900 dark:bg-[#010409] relative overflow-hidden">
//         <div className="relative z-10 flex flex-col justify-center px-16">
//           <div className="flex items-center gap-3 mb-10">
//             <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 border border-white/20">
//               <Layers className="h-6 w-6 text-white" />
//             </div>
//             <span className="text-2xl font-bold text-white">GiteaForge</span>
//           </div>
//           <h2 className="text-3xl font-bold text-white leading-snug mb-4">
//             Create Your<br />Student Account
//           </h2>
//           <p className="text-neutral-400 text-base leading-relaxed max-w-md mb-8">
//             Register to access your institute&apos;s project management portal. Once approved by admin, you&apos;ll be able to create projects and link repositories.
//           </p>
//           <div className="space-y-4">
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold">1</div>
//               <span className="text-neutral-300 text-sm">Fill in your personal & academic details</span>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold">2</div>
//               <span className="text-neutral-300 text-sm">Admin reviews and approves your account</span>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold">3</div>
//               <span className="text-neutral-300 text-sm">Login and start managing your projects</span>
//             </div>
//           </div>

//           {/* Security info */}
//           <div className="mt-10 p-4 rounded-md border border-white/10 bg-white/5">
//             <div className="flex items-center gap-2 text-neutral-300 mb-2">
//               <ShieldCheck className="h-4 w-4 text-green-400" />
//               <span className="text-sm font-medium">Your data is secure</span>
//             </div>
//             <ul className="text-xs text-neutral-400 space-y-1 ml-6">
//               <li>• Passwords are encrypted at rest</li>
//               <li>• All connections use HTTPS</li>
//               <li>• Data stays on institute servers</li>
//             </ul>
//           </div>
//         </div>
//       </div>

//       {/* Right Panel */}
//       <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-neutral-50 dark:bg-[#0d1117] relative overflow-auto">
//         {/* Top buttons */}
//         <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
//           <button
//             onClick={goBack}
//             className="flex items-center gap-1 text-sm text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-[#f0f6fc] font-medium transition"
//           >
//             <ChevronLeft className="h-4 w-4" />
//             Back to Login
//           </button>
//           <button
//             onClick={() => setDarkMode(!darkMode)}
//             className="rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-[#30363d] text-neutral-500 dark:text-[#8b949e] transition"
//             aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
//           >
//             {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
//           </button>
//         </div>

//         <div className="w-full max-w-lg mt-12">
//           <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
//             <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 dark:bg-[#f0f6fc]">
//               <Layers className="h-4.5 w-4.5 text-white dark:text-[#0d1117]" />
//             </div>
//             <span className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc]">GiteaForge</span>
//           </div>

//           <div className="rounded-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-6 sm:p-8">
//             <h2 className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-1">Create Account</h2>
//             <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-6">
//               {step === 1 ? 'Step 1 of 2 — Personal Information' : 'Step 2 of 2 — Academic Details'}
//             </p>

//             {/* Step indicators */}
//             <div className="flex items-center gap-3 mb-6">
//               <div className="flex items-center gap-2 flex-1">
//                 <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
//                   step >= 1 ? 'bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117]' : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]'
//                 }`}>1</div>
//                 <span className={`text-sm font-medium ${step >= 1 ? 'text-neutral-900 dark:text-[#f0f6fc]' : 'text-neutral-400 dark:text-[#484f58]'}`}>Personal</span>
//               </div>
//               <div className={`w-12 h-px ${step >= 2 ? 'bg-neutral-400 dark:bg-[#8b949e]' : 'bg-neutral-200 dark:bg-[#30363d]'}`} />
//               <div className="flex items-center gap-2 flex-1">
//                 <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
//                   step >= 2 ? 'bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117]' : 'bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]'
//                 }`}>2</div>
//                 <span className={`text-sm font-medium ${step >= 2 ? 'text-neutral-900 dark:text-[#f0f6fc]' : 'text-neutral-400 dark:text-[#484f58]'}`}>Academic</span>
//               </div>
//             </div>

//             {/* Submit error */}
//             {submitError && (
//               <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-4 flex items-start gap-2">
//                 <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
//                 <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
//               </div>
//             )}

//             {step === 1 && (
//               <div className="space-y-4">
//                 {/* Full Name */}
//                 <div>
//                   <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.fullName)}>
//                     <User className={iconClass} />
//                     <input
//                       type="text"
//                       value={formData.fullName}
//                       onChange={e => updateTextField('fullName', e.target.value)}
//                       placeholder="Enter your full name"
//                       className={inputField}
//                       maxLength={100}
//                       autoComplete="name"
//                       aria-invalid={!!errors.fullName}
//                     />
//                   </div>
//                   {errors.fullName && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.fullName}</p>}
//                 </div>

//                 {/* Email */}
//                 <div>
//                   <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.email)}>
//                     <Mail className={iconClass} />
//                     <input
//                       type="email"
//                       value={formData.email}
//                       onChange={e => updateTextField('email', e.target.value)}
//                       placeholder="you@ignou.ac.in"
//                       className={inputField}
//                       maxLength={254}
//                       autoComplete="email"
//                       aria-invalid={!!errors.email}
//                     />
//                   </div>
//                   {errors.email && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.email}</p>}
//                 </div>

//                 {/* Phone Number */}
//                 <div>
//                   <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.phoneNumber)}>
//                     <Phone className={iconClass} />
//                     <input
//                       type="tel"
//                       value={formData.phoneNumber}
//                       onChange={e => updateTextField('phoneNumber', e.target.value)}
//                       placeholder="+91 98765 43210"
//                       className={inputField}
//                       maxLength={20}
//                       autoComplete="tel"
//                       aria-invalid={!!errors.phoneNumber}
//                     />
//                   </div>
//                   {errors.phoneNumber && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.phoneNumber}</p>}
//                 </div>

//                 {/* Password */}
//                 <div>
//                   <label className={labelClass}>Password <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.password)}>
//                     <Lock className={iconClass} />
//                     <input
//                       type={showPassword ? 'text' : 'password'}
//                       value={formData.password}
//                       onChange={e => updateTextField('password', e.target.value)}
//                       placeholder="Min. 8 characters"
//                       className={inputField}
//                       maxLength={128}
//                       autoComplete="new-password"
//                       aria-invalid={!!errors.password}
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="text-neutral-400 dark:text-[#484f58] hover:text-neutral-600 dark:hover:text-[#8b949e] transition"
//                       aria-label={showPassword ? 'Hide password' : 'Show password'}
//                       tabIndex={-1}
//                     >
//                       {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                     </button>
//                   </div>
//                   {errors.password && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.password}</p>}

//                   {/* Password Strength Meter */}
//                   {passwordStrength && formData.password && (
//                     <div className="mt-2 space-y-1.5">
//                       <div className="flex gap-1">
//                         {[1, 2, 3, 4, 5].map(i => (
//                           <div
//                             key={i}
//                             className={`h-1.5 flex-1 rounded-full transition-all ${
//                               i <= passwordStrength.score ? passwordStrength.color : 'bg-neutral-200 dark:bg-[#21262d]'
//                             }`}
//                           />
//                         ))}
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className={`text-xs font-medium ${
//                           passwordStrength.score <= 1 ? 'text-red-500' :
//                           passwordStrength.score <= 2 ? 'text-orange-500' :
//                           passwordStrength.score <= 3 ? 'text-yellow-600' :
//                           passwordStrength.score <= 4 ? 'text-blue-500' : 'text-green-500'
//                         }`}>
//                           {passwordStrength.label}
//                         </span>
//                         {passwordStrength.valid && (
//                           <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
//                             <Check className="h-3 w-3" /> Strong enough
//                           </span>
//                         )}
//                       </div>
//                       {passwordStrength.suggestions.length > 0 && !passwordStrength.valid && (
//                         <ul className="text-xs text-neutral-500 dark:text-[#8b949e] space-y-0.5">
//                           {passwordStrength.suggestions.map((s, i) => (
//                             <li key={i} className="flex items-center gap-1">
//                               <span className="text-neutral-300 dark:text-[#484f58]">•</span> {s}
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Confirm Password */}
//                 <div>
//                   <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.confirmPassword)}>
//                     <Lock className={iconClass} />
//                     <input
//                       type={showConfirmPassword ? 'text' : 'password'}
//                       value={formData.confirmPassword}
//                       onChange={e => updateTextField('confirmPassword', e.target.value)}
//                       placeholder="Re-enter your password"
//                       className={inputField}
//                       maxLength={128}
//                       autoComplete="new-password"
//                       aria-invalid={!!errors.confirmPassword}
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                       className="text-neutral-400 dark:text-[#484f58] hover:text-neutral-600 dark:hover:text-[#8b949e] transition"
//                       aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
//                       tabIndex={-1}
//                     >
//                       {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                     </button>
//                   </div>
//                   {errors.confirmPassword && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.confirmPassword}</p>}
//                   {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
//                     <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
//                       <Check className="h-3 w-3" /> Passwords match
//                     </p>
//                   )}
//                 </div>

//                 <Button className="w-full mt-2" onClick={handleStep1Next}>
//                   Next: Academic Details →
//                 </Button>
//               </div>
//             )}

//             {step === 2 && (
//               <div className="space-y-4">
//                 {/* University */}
//                 <div>
//                   <label className={labelClass}>University <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.university)}>
//                     <Globe className={iconClass} />
//                     <input
//                       type="text"
//                       value={formData.university}
//                       onChange={e => updateTextField('university', e.target.value)}
//                       placeholder="e.g., IGNOU"
//                       className={inputField}
//                       maxLength={200}
//                       autoComplete="organization"
//                       aria-invalid={!!errors.university}
//                     />
//                   </div>
//                   {errors.university && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.university}</p>}
//                 </div>

//                 {/* Department */}
//                 <div>
//                   <label className={labelClass}>Department <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.department)}>
//                     <BookOpen className={iconClass} />
//                     <select
//                       value={formData.department}
//                       onChange={e => updateField('department', e.target.value)}
//                       className={`${inputField} cursor-pointer`}
//                       aria-invalid={!!errors.department}
//                     >
//                       <option value="">Select Department</option>
//                       <option value="Computer Science">Computer Science</option>
//                       <option value="Information Technology">Information Technology</option>
//                       <option value="Electronics">Electronics & Communication</option>
//                       <option value="Mechanical">Mechanical Engineering</option>
//                       <option value="Civil">Civil Engineering</option>
//                       <option value="Mathematics">Mathematics</option>
//                       <option value="Physics">Physics</option>
//                       <option value="Other">Other</option>
//                     </select>
//                   </div>
//                   {errors.department && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.department}</p>}
//                 </div>

//                 {/* Session */}
//                 <div>
//                   <label className={labelClass}>Session / Batch <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.session)}>
//                     <Calendar className={iconClass} />
//                     <select
//                       value={formData.session}
//                       onChange={e => updateField('session', e.target.value)}
//                       className={`${inputField} cursor-pointer`}
//                       aria-invalid={!!errors.session}
//                     >
//                       <option value="">Select Session</option>
//                       <option value="2025-26">2025-26</option>
//                       <option value="2024-25">2024-25</option>
//                       <option value="2023-24">2023-24</option>
//                       <option value="2022-23">2022-23</option>
//                     </select>
//                   </div>
//                   {errors.session && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.session}</p>}
//                 </div>

//                 {/* Roll Number */}
//                 <div>
//                   <label className={labelClass}>Roll Number / Enrollment No. <span className="text-red-500">*</span></label>
//                   <div className={inputWrap(!!errors.rollNo)}>
//                     <Hash className={iconClass} />
//                     <input
//                       type="text"
//                       value={formData.rollNo}
//                       onChange={e => updateTextField('rollNo', e.target.value)}
//                       placeholder="e.g., 2024BCA001"
//                       className={inputField}
//                       maxLength={30}
//                       aria-invalid={!!errors.rollNo}
//                     />
//                   </div>
//                   {errors.rollNo && <p className={errorClass}><AlertTriangle className="h-3 w-3" />{errors.rollNo}</p>}
//                 </div>

//                 {/* Terms */}
//                 <div>
//                   <label className="flex items-start gap-2 text-sm text-neutral-600 dark:text-[#8b949e] pt-1">
//                     <input
//                       type="checkbox"
//                       checked={formData.termsAccepted}
//                       onChange={e => updateField('termsAccepted', e.target.checked)}
//                       className="rounded border-neutral-300 dark:border-[#30363d] text-blue-600 focus:ring-blue-500 mt-0.5"
//                     />
//                     <span>I agree to the <button type="button" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</button> and <button type="button" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</button></span>
//                   </label>
//                   {errors.termsAccepted && <p className={`${errorClass} ml-6`}><AlertTriangle className="h-3 w-3" />{errors.termsAccepted}</p>}
//                 </div>

//                 <div className="flex gap-3 pt-1">
//                   <Button variant="secondary" className="flex-1" onClick={() => { setStep(1); setErrors({}); }}>
//                     ← Back
//                   </Button>
//                   <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
//                     {isSubmitting ? (
//                       <span className="flex items-center gap-2">
//                         <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
//                         Submitting...
//                       </span>
//                     ) : 'Create Account'}
//                   </Button>
//                 </div>
//               </div>
//             )}

//             {/* Already have account */}
//             <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-[#30363d] text-center">
//               <p className="text-sm text-neutral-500 dark:text-[#8b949e]">
//                 Already have an account?{' '}
//                 <button onClick={() => onNavigate('login')} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
//                   Sign in
//                 </button>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// src/screens/Signup.tsx
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui";
import {
  Mail, Lock, Layers, Moon, Sun, User, ChevronLeft,
  BookOpen, Hash, Globe, Calendar, AlertTriangle, Eye, EyeOff,
  ShieldCheck, Check,
} from "@/components/Icons";
import { Phone } from "lucide-react";
import {
  validateSignupStep1, checkPasswordStrength,
  checkRateLimit, sanitizeInput, preventClickjacking,
  type SignupFormData, type PasswordStrength,
} from "@/utils/security";
import type { Page } from "@/types";
import type { Course, Batch } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/api/client";
import batchesAPI from "@/api/batches";

// ─── Extended form data with academic fields ──────────────────────────────────
interface ExtendedFormData extends SignupFormData {
  courseId: string;
  batchId: string;
}

// ─── Step 2 validation (replaces security.ts version which had session/uni) ───
function validateStep2(data: ExtendedFormData): {
  valid: boolean;
  errors: Partial<Record<keyof ExtendedFormData, string>>;
} {
  const errors: Partial<Record<keyof ExtendedFormData, string>> = {};
  if (!data.rollNo?.trim()) errors.rollNo = "University ID is required";
  if (!data.department?.trim()) errors.department = "Department is required";
  if (!data.courseId) errors.courseId = "Please select a course";
  if (!data.batchId) errors.batchId = "Please select a batch";
  if (!data.termsAccepted) errors.termsAccepted = "You must accept the terms";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function Signup({
  onNavigate, goBack, darkMode, setDarkMode,
}: {
  onNavigate: (page: Page) => void;
  goBack: () => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}) {
  const { register } = useAuth();

  const [formData, setFormData] = useState<ExtendedFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    department: "",
    session: "",
    university: "",
    rollNo: "",
    termsAccepted: false,
    courseId: "",
    batchId: "",
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ExtendedFormData, string>>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Course/Batch dropdown state
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  useEffect(() => {
    try { preventClickjacking(); } catch { /* handled */ }
  }, []);

  // Load courses on step 2 mount
  useEffect(() => {
    if (step === 2) {
      setLoadingCourses(true);
      batchesAPI
        .getCourses()
        .then((res) => setCourses(res.data.data))
        .catch(() => setCourses([]))
        .finally(() => setLoadingCourses(false));
    }
  }, [step]);

  // Load batches when course selected
  useEffect(() => {
    if (!formData.courseId) {
      setBatches([]);
      return;
    }
    setLoadingBatches(true);
    batchesAPI
      .getBatchesByCourse(formData.courseId)
      .then((res) => setBatches(res.data.data))
      .catch(() => setBatches([]))
      .finally(() => setLoadingBatches(false));
  }, [formData.courseId]);

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const updateField = useCallback(
    (field: keyof ExtendedFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setSubmitError("");
    },
    []
  );

  const updateTextField = useCallback(
    (field: keyof ExtendedFormData, value: string) => {
      const sanitized =
        field === "password" || field === "confirmPassword"
          ? value
          : sanitizeInput(value);
      updateField(field, sanitized);
    },
    [updateField]
  );

  const handleStep1Next = useCallback(() => {
    const result = validateSignupStep1(formData);
    if (!result.valid) {
      setErrors(result.errors as Partial<Record<keyof ExtendedFormData, string>>);
      return;
    }
    setErrors({});
    setStep(2);
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    const result = validateStep2(formData);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    const rateCheck = checkRateLimit("signup", 3, 300000);
    if (!rateCheck.allowed) {
      setSubmitError(
        `Too many signup attempts. Please wait ${rateCheck.retryAfter} seconds.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await register({
        name: formData.fullName,
        universityId: formData.rollNo,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        role: "STUDENT",
        batchId: formData.batchId || undefined,
      });

      // Registration successful — redirect to login
      onNavigate("login");
    } catch (err) {
      setSubmitError(
        getErrorMessage(err) ||
          "Registration failed. Please try again or contact admin."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, register, onNavigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (step === 1) handleStep1Next();
        else handleSubmit();
      }
    },
    [step, handleStep1Next, handleSubmit]
  );

  const inputWrap = (hasError: boolean) =>
    `flex items-center gap-2 rounded-md border px-3 py-2.5 focus-within:ring-2 bg-white dark:bg-[#0d1117] transition ${
      hasError
        ? "border-red-400 dark:border-red-700 focus-within:ring-red-500 focus-within:border-red-500"
        : "border-neutral-300 dark:border-[#30363d] focus-within:ring-blue-500 focus-within:border-blue-500"
    }`;

  const inputField =
    "w-full text-sm outline-none bg-transparent text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]";
  const labelClass =
    "block text-sm font-medium text-neutral-700 dark:text-[#c9d1d9] mb-1.5";
  const iconClass = "h-4 w-4 text-neutral-400 dark:text-[#484f58] shrink-0";
  const errorClass =
    "text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1";

  return (
    <div className="min-h-screen flex" onKeyDown={handleKeyDown}>
      {/* Left Panel — untouched */}
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
            Register to access your institute's project management portal. Once
            approved by admin, you'll be able to create projects and link
            repositories.
          </p>
          <div className="space-y-4">
            {[
              "Fill in your personal & academic details",
              "Admin reviews and approves your account",
              "Login and start managing your projects",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-neutral-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 p-4 rounded-md border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-neutral-300 mb-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">Your data is secure</span>
            </div>
            <ul className="text-xs text-neutral-400 space-y-1 ml-6">
              <li>• Passwords are encrypted at rest</li>
              <li>• All connections use HTTPS</li>
              <li>• Data stays on institute servers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-neutral-50 dark:bg-[#0d1117] relative overflow-auto">
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
            <span className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc]">
              GiteaForge
            </span>
          </div>

          <div className="rounded-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-[#f0f6fc] mb-1">
              Create Account
            </h2>
            <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-6">
              {step === 1
                ? "Step 1 of 2 — Personal Information"
                : "Step 2 of 2 — Academic Details"}
            </p>

            {/* Step indicators */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    step >= 1
                      ? "bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117]"
                      : "bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]"
                  }`}
                >
                  1
                </div>
                <span
                  className={`text-sm font-medium ${
                    step >= 1
                      ? "text-neutral-900 dark:text-[#f0f6fc]"
                      : "text-neutral-400 dark:text-[#484f58]"
                  }`}
                >
                  Personal
                </span>
              </div>
              <div
                className={`w-12 h-px ${
                  step >= 2
                    ? "bg-neutral-400 dark:bg-[#8b949e]"
                    : "bg-neutral-200 dark:bg-[#30363d]"
                }`}
              />
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    step >= 2
                      ? "bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117]"
                      : "bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-sm font-medium ${
                    step >= 2
                      ? "text-neutral-900 dark:text-[#f0f6fc]"
                      : "text-neutral-400 dark:text-[#484f58]"
                  }`}
                >
                  Academic
                </span>
              </div>
            </div>

            {submitError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  {submitError}
                </p>
              </div>
            )}

            {/* ─── Step 1 ─────────────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className={labelClass}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!errors.fullName)}>
                    <User className={iconClass} />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateTextField("fullName", e.target.value)}
                      placeholder="Enter your full name"
                      className={inputField}
                      maxLength={100}
                      autoComplete="name"
                    />
                  </div>
                  {errors.fullName && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!errors.email)}>
                    <Mail className={iconClass} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateTextField("email", e.target.value)}
                      placeholder="you@example.com"
                      className={inputField}
                      maxLength={254}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClass}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!errors.phoneNumber)}>
                    <Phone className={iconClass} />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        updateTextField("phoneNumber", e.target.value)
                      }
                      placeholder="9876543210"
                      className={inputField}
                      maxLength={10}
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!errors.password)}>
                    <Lock className={iconClass} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        updateTextField("password", e.target.value)
                      }
                      placeholder="Min. 8 characters"
                      className={inputField}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-neutral-400 hover:text-neutral-600 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                  {passwordStrength && formData.password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i <= passwordStrength.score
                                ? passwordStrength.color
                                : "bg-neutral-200 dark:bg-[#21262d]"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength.score <= 1
                              ? "text-red-500"
                              : passwordStrength.score <= 2
                                ? "text-orange-500"
                                : passwordStrength.score <= 3
                                  ? "text-yellow-600"
                                  : passwordStrength.score <= 4
                                    ? "text-blue-500"
                                    : "text-green-500"
                          }`}
                        >
                          {passwordStrength.label}
                        </span>
                        {passwordStrength.valid && (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Check className="h-3 w-3" /> Strong enough
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelClass}>
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!errors.confirmPassword)}>
                    <Lock className={iconClass} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        updateTextField("confirmPassword", e.target.value)
                      }
                      placeholder="Re-enter your password"
                      className={inputField}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-neutral-400 hover:text-neutral-600 transition"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword &&
                    !errors.confirmPassword && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                </div>

                <Button className="w-full mt-2" onClick={handleStep1Next}>
                  Next: Academic Details →
                </Button>
              </div>
            )}

            {/* ─── Step 2 ─────────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                {/* University ID / Roll Number */}
                <div>
                  <label className={labelClass}>
                    University ID / Roll Number{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!errors.rollNo)}>
                    <Hash className={iconClass} />
                    <input
                      type="text"
                      value={formData.rollNo}
                      onChange={(e) =>
                        updateTextField("rollNo", e.target.value)
                      }
                      placeholder="e.g., TNU2023020100049"
                      className={inputField}
                      maxLength={30}
                    />
                  </div>
                  {errors.rollNo && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.rollNo}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className={labelClass}>
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!errors.department)}>
                    <BookOpen className={iconClass} />
                    <select
                      value={formData.department}
                      onChange={(e) => updateField("department", e.target.value)}
                      className={`${inputField} cursor-pointer`}
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">
                        Information Technology
                      </option>
                      <option value="Electronics">
                        Electronics & Communication
                      </option>
                      <option value="Mechanical">Mechanical Engineering</option>
                      <option value="Civil">Civil Engineering</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {errors.department && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.department}
                    </p>
                  )}
                </div>

                {/* Course dropdown — loaded from API */}
                <div>
                  <label className={labelClass}>
                    Course <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!(errors as Record<string, string>)["courseId"])}>
                    <Globe className={iconClass} />
                    <select
                      value={formData.courseId}
                      onChange={(e) => {
                        updateField("courseId", e.target.value);
                        updateField("batchId", "");
                      }}
                      className={`${inputField} cursor-pointer`}
                      disabled={loadingCourses}
                    >
                      <option value="">
                        {loadingCourses ? "Loading courses..." : "Select Course"}
                      </option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(errors as Record<string, string>)["courseId"] && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {(errors as Record<string, string>)["courseId"]}
                    </p>
                  )}
                </div>

                {/* Batch dropdown — filtered by course */}
                <div>
                  <label className={labelClass}>
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <div className={inputWrap(!!(errors as Record<string, string>)["batchId"])}>
                    <Calendar className={iconClass} />
                    <select
                      value={formData.batchId}
                      onChange={(e) => updateField("batchId", e.target.value)}
                      className={`${inputField} cursor-pointer`}
                      disabled={!formData.courseId || loadingBatches}
                    >
                      <option value="">
                        {!formData.courseId
                          ? "Select a course first"
                          : loadingBatches
                            ? "Loading batches..."
                            : "Select Batch"}
                      </option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.startYear}–{b.endYear})
                        </option>
                      ))}
                    </select>
                  </div>
                  {(errors as Record<string, string>)["batchId"] && (
                    <p className={errorClass}>
                      <AlertTriangle className="h-3 w-3" />
                      {(errors as Record<string, string>)["batchId"]}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-2 text-sm text-neutral-600 dark:text-[#8b949e] pt-1">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) =>
                        updateField("termsAccepted", e.target.checked)
                      }
                      className="rounded border-neutral-300 dark:border-[#30363d] mt-0.5"
                    />
                    <span>
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className={`${errorClass} ml-6`}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.termsAccepted}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setStep(1);
                      setErrors({});
                    }}
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-[#30363d] text-center">
              <p className="text-sm text-neutral-500 dark:text-[#8b949e]">
                Already have an account?{" "}
                <button
                  onClick={() => onNavigate("login")}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
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