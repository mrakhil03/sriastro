import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { errorMessage } from '../api';
import { useAuth } from '../auth';
import Logo from '../components/Logo';
import { Button, Card, Field, inputClass } from '../components/ui';

export default function AdminLogin() {
  const { email: current, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (current) return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setError(''); setLoading(true);
    try { await login(email.trim(), password); navigate(from, { replace: true }); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-gradient-to-b from-brand-50/60 to-canvas">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo size="lg" /></div>
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">SriAstro Admin</h1>
          <p className="mt-1.5 text-muted">Sign in to manage your astrology practice.</p>
          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            <Field label="Email" htmlFor="email">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-gray-400" aria-hidden />
                <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass(!!error)} />
              </div>
            </Field>
            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-gray-400" aria-hidden />
                <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass(!!error)} />
              </div>
            </Field>
            {error && <p role="alert" className="rounded-xl bg-red-50 text-bad text-sm px-4 py-3">{error}</p>}
            <Button type="submit" loading={loading} className="w-full h-12 text-base">{loading ? 'Signing in...' : 'Sign In'}</Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm"><Link to="/" className="text-muted hover:text-ink">← Back to SriAstro</Link></p>
      </div>
    </div>
  );
}
