import { FormEvent, useState } from 'react';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Button, Card, Field, PageHeader, useToast } from '../components/ui';

const input = 'w-full h-12 rounded-xl border border-line bg-white px-4 text-base focus:outline-none focus:ring-2 focus:border-brand focus:ring-brand/25';

export default function Settings() {
  const { email } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!current) return setError('Enter your current password.');
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('New passwords do not match.');
    setError(''); setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      toast.success('✓ Password updated');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your admin account." />
      <div className="grid gap-4 max-w-xl">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="mt-3 text-sm text-muted">Signed in as</p>
          <p className="font-medium break-all">{email}</p>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Change password</h2>
          <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
            <Field label="Current password" htmlFor="cur"><input id="cur" type="password" autoComplete="current-password" className={input} value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
            <Field label="New password" htmlFor="new"><input id="new" type="password" autoComplete="new-password" className={input} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
            <Field label="Confirm new password" htmlFor="conf"><input id="conf" type="password" autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
            {error && <p role="alert" className="rounded-xl bg-red-50 text-bad text-sm px-4 py-3">{error}</p>}
            <Button type="submit" loading={saving}>{saving ? 'Saving...' : 'Update password'}</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
