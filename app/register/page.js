'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, UserPlus, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft, CheckCircle2, Wrench, AlertCircle, LifeBuoy } from 'lucide-react';
import { BrandPanel } from '@/components/login/BrandPanel';
import { FloatingField } from '@/components/login/FloatingField';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { triggerBackendWarning, BACKEND_READY } from '@/lib/backendWarning';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s-]{7,15}$/;
const ROLES = [
  { value: 'USER', label: 'Customer', description: 'Book local services', icon: User },
  { value: 'TECHNICIAN', label: 'Technician', description: 'Put your skills to work', icon: Wrench },
];

export default function RegisterPage() {
  const { register, loginWithGoogle, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', role: 'USER', agreeTerms: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const busy = isLoading || googleLoading || authLoading;
  const isTechnician = formData.role === 'TECHNICIAN';
  const passwordLongEnough = formData.password.length >= 8 && formData.password.length <= 100;
  const passwordsMatch = !!formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined, ...(name === 'password' ? { confirmPassword: undefined } : {}) }));
  };

  const validate = () => {
    const errors = {};
    if (formData.fullName.trim().length < 3) errors.fullName = 'Enter your full name (at least 3 characters).';
    if (!EMAIL_RE.test(formData.email.trim())) errors.email = 'Please enter a valid email address.';
    if (!PHONE_RE.test(formData.phoneNumber.trim())) errors.phoneNumber = 'Please enter a valid phone number.';
    if (!passwordLongEnough) errors.password = 'Use a password between 8 and 100 characters.';
    if (!passwordsMatch) errors.confirmPassword = 'Please enter the same password again.';
    if (!formData.agreeTerms) errors.agreeTerms = 'Please agree to the Terms of Service & Privacy Policy.';
    setFieldErrors(errors);
    const firstError = Object.keys(errors)[0];
    if (firstError) document.getElementById(`register-${firstError}`)?.focus();
    return !firstError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setServerError('');
    if (!validate()) return;
    if (!BACKEND_READY) {
      triggerBackendWarning(formData.role);
      return;
    }
    setIsLoading(true);
    try {
      const account = await register({
        name: formData.fullName.trim(), email: formData.email.trim().toLowerCase(),
        phone: formData.phoneNumber.trim(), password: formData.password, role: formData.role,
      });
      toast.success(`Account created successfully for ${account.name}! Redirecting...`);
    } catch (err) {
      const message = err?.message || 'Registration failed. Please try again.';
      setServerError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (busy) return;
    if (!BACKEND_READY) {
      triggerBackendWarning(formData.role);
      return;
    }
    setGoogleLoading(true);
    setServerError('');
    try {
      await loginWithGoogle(formData.role);
    } catch (err) {
      setServerError(err?.message || 'Could not connect with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const visibilityButton = (visible, toggle, label) => (
    <button type="button" onClick={() => toggle((value) => !value)} disabled={busy}
      aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} aria-pressed={visible}
      className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 cursor-pointer">
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-[#f4f8f6]">
      <BrandPanel variant="register" />
      <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_100%_0%,rgba(34,197,94,0.12),transparent_30%),linear-gradient(135deg,#ffffff_0%,#f7fbf8_55%,#effaf4_100%)] px-4 py-6 sm:px-6 sm:py-10 lg:flex-1 lg:px-8 xl:px-12">
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-teal-400/10 blur-[110px]" aria-hidden="true" />
        <nav aria-label="Registration navigation" className="relative mb-6 flex w-full max-w-[480px] items-center justify-between gap-3">
          <Link href="/" className="group inline-flex items-center gap-2 rounded-lg text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:text-sm">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Home
          </Link>
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-full border border-emerald-600 bg-slate-900 object-contain p-0.5" />
            <span className="text-[10px] font-black tracking-tight text-slate-900 sm:text-xs">PHIDIM SERVICE</span>
          </Link>
          <span className="hidden items-center gap-1.5 text-[11px] font-medium text-slate-500 lg:inline-flex"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Your local service network</span>
        </nav>

        <section aria-labelledby="register-heading" className="relative w-full max-w-[480px] space-y-5 rounded-[32px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_24px_60px_rgba(6,78,59,0.12)] backdrop-blur-xl sm:p-8">
          <header className="space-y-2.5 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-600/20 bg-gradient-to-br from-emerald-600/10 to-teal-400/10 shadow-xs">
              {isTechnician ? <Wrench className="h-6 w-6 text-emerald-600" /> : <UserPlus className="h-7 w-7 text-emerald-600" />}
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">A local connection. More possibilities.</p>
              <h1 id="register-heading" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{isTechnician ? 'Join as a technician' : 'Create your account'}</h1>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-500">{isTechnician ? 'Connect with local customers and manage your service work in one place.' : 'Good service starts here. Find local experts and keep every booking in one place.'}</p>
            </div>
          </header>

          <fieldset disabled={busy}>
            <legend className="mb-2 text-[11px] font-bold text-slate-600">I’m joining as a</legend>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              {ROLES.map(({ value, label, description, icon: Icon }) => (
                <label key={value} className="relative min-w-0 cursor-pointer">
                  <input type="radio" name="role" value={value} checked={formData.role === value} onChange={handleChange} className="peer sr-only" />
                  <span className={`flex h-full items-center gap-2 rounded-xl border px-2.5 py-3 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-disabled:opacity-60 sm:px-3 ${formData.role === value ? 'border-emerald-200 bg-white text-emerald-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-white/60'}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0"><span className="block text-xs font-bold">{label}</span><span className="mt-0.5 block text-[10px] leading-snug text-slate-500">{description}</span></span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {serverError && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5" aria-label="Create account">
            <FloatingField id="register-fullName" name="fullName" label="Full name" icon={User} autoComplete="name" value={formData.fullName} onChange={handleChange} error={fieldErrors.fullName} valid={formData.fullName.trim().length >= 3} disabled={busy} />
            <FloatingField id="register-email" name="email" label="Email address" type="email" icon={Mail} autoComplete="email" value={formData.email} onChange={handleChange} error={fieldErrors.email} valid={EMAIL_RE.test(formData.email.trim())} disabled={busy} />
            <FloatingField id="register-phoneNumber" name="phoneNumber" label="Phone number" type="tel" inputMode="tel" icon={Phone} autoComplete="tel" value={formData.phoneNumber} onChange={handleChange} error={fieldErrors.phoneNumber} valid={PHONE_RE.test(formData.phoneNumber.trim())} disabled={busy} />
            <FloatingField id="register-password" name="password" label="Password" type={showPassword ? 'text' : 'password'} icon={Lock} autoComplete="new-password" value={formData.password} onChange={handleChange} error={fieldErrors.password} disabled={busy} right={visibilityButton(showPassword, setShowPassword, 'password')} />
            <p className={`flex items-center gap-1.5 px-1 text-[11px] ${passwordLongEnough ? 'text-emerald-600' : 'text-slate-500'}`}><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />Use 8–100 characters for your password</p>
            <FloatingField id="register-confirmPassword" name="confirmPassword" label="Confirm password" type={showConfirmPassword ? 'text' : 'password'} icon={Lock} autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} error={fieldErrors.confirmPassword} disabled={busy} right={visibilityButton(showConfirmPassword, setShowConfirmPassword, 'confirm password')} />
            {passwordsMatch && <p role="status" className="flex items-center gap-1.5 px-1 text-[11px] text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Passwords match</p>}
            <div className="pt-1">
              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-slate-500">
                <input id="register-agreeTerms" name="agreeTerms" type="checkbox" checked={formData.agreeTerms} onChange={handleChange} disabled={busy} aria-invalid={!!fieldErrors.agreeTerms} aria-describedby={fieldErrors.agreeTerms ? 'register-terms-error' : undefined} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" />
                <span>I agree to the <a href="#" className="font-bold text-emerald-700 hover:underline">Terms of Service</a> &amp; <a href="#" className="font-bold text-emerald-700 hover:underline">Privacy Policy</a>.</span>
              </label>
              {fieldErrors.agreeTerms && <p id="register-terms-error" role="alert" className="mt-1.5 text-[11px] font-bold text-rose-600">{fieldErrors.agreeTerms}</p>}
            </div>
            <button type="submit" disabled={busy} className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#16A34A] to-[#15803D] text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60">
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Creating your account...</> : <><span>Create {isTechnician ? 'technician ' : ''}account</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="flex items-center gap-3" aria-hidden="true"><div className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Or continue with</span><div className="h-px flex-1 bg-slate-200" /></div>
          <button type="button" onClick={handleGoogleSignUp} disabled={busy} className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:opacity-60">
            {googleLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600/40 border-t-emerald-600" /> : <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>}
            {googleLoading ? 'Connecting with Google...' : 'Continue with Google'}
          </button>
          <p className="text-center text-xs text-slate-500">Already have an account? <Link href="/login" className="ml-1 font-bold text-emerald-600 hover:text-emerald-800 hover:underline">Sign in <ArrowRight className="inline h-3.5 w-3.5" /></Link></p>
        </section>
        <a href="https://wa.me/9779862772457" target="_blank" rel="noopener noreferrer" className="relative mt-6 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-emerald-700"><LifeBuoy className="h-3.5 w-3.5" />Need a hand? Contact Phidim Service</a>
        <p className="relative mt-3 text-center text-[10px] text-slate-400">&copy; {new Date().getFullYear()} Phidim Service · Panchthar, Koshi, Nepal</p>
      </main>
    </div>
  );
}
