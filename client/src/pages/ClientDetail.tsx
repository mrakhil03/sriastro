import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../api';
import { useApi } from '../hooks';
import { Avatar, Button, buttonClass, Card, ErrorState, Loading, Modal, PaymentBadge, ReadingBadge, useToast } from '../components/ui';
import type { Client } from '../types';
import { formatDob, formatTime12, inr, stamp } from '../utils';

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-3 border-b border-line last:border-0">
    <dt className="sm:w-40 text-sm text-muted">{label}</dt>
    <dd className="font-medium break-words">{value}</dd>
  </div>
);

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, reload } = useApi<{ client: Client }>(`/admin/clients/${id}`);
  const [busy, setBusy] = useState<'' | 'amount' | 'pay' | 'read' | 'delete'>('');
  const [amountOpen, setAmountOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState('');
  const [prediction, setPrediction] = useState('');
  const [predictionBusy, setPredictionBusy] = useState(false);
  const [predictionError, setPredictionError] = useState('');

  const c = data?.client;
  useEffect(() => { if (amountOpen && c) { setAmountInput(c.amount > 0 ? String(c.amount) : ''); setAmountError(''); } }, [amountOpen, c]);
  useEffect(() => { setPrediction(c?.prediction ?? ''); }, [c?.id, c?.prediction]);

  if (!c) {
    if (error) return (
      <>
        <Link to="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4"><ArrowLeft className="size-4" /> Clients</Link>
        <ErrorState message={error.status === 404 ? 'Client not found. They may have been deleted.' : error.message} onRetry={error.status === 404 ? undefined : reload} />
      </>
    );
    return <Loading label="Loading client..." />;
  }
  const paid = c.paymentStatus === 'PAID';
  const done = c.readingStatus === 'COMPLETED';

  async function saveAmount(e: FormEvent) {
    e.preventDefault();
    const n = Number(amountInput);
    if (amountInput.trim() === '' || !Number.isFinite(n) || n < 0) { setAmountError('Enter a valid amount, e.g. 500'); return; }
    setBusy('amount');
    try { await api.patch(`/admin/clients/${id}/amount`, { amount: n }); toast.success('✓ Amount saved'); setAmountOpen(false); reload(); }
    catch (err) { setAmountError(errorMessage(err)); }
    finally { setBusy(''); }
  }
  async function markPaid() {
    setBusy('pay');
    try {
      const r = await api.patch(`/admin/clients/${id}/pay`);
      r.data.alreadyPaid ? toast.success('Already marked as paid') : toast.success('✓ Payment marked as paid');
      reload();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(''); }
  }
  async function markCompleted() {
    setBusy('read');
    try { await api.patch(`/admin/clients/${id}/complete`); toast.success('✓ Birth chart marked as completed'); reload(); }
    catch (err) { toast.error(errorMessage(err)); } finally { setBusy(''); }
  }
  async function savePrediction() {
    setPredictionBusy(true);
    setPredictionError('');
    try {
      await api.patch(`/admin/clients/${id}/prediction`, { prediction });
      setPrediction(prediction.trim());
      toast.success('✓ Prediction saved');
      reload();
    } catch (err) {
      setPredictionError(errorMessage(err));
    } finally {
      setPredictionBusy(false);
    }
  }
  async function remove() {
    setBusy('delete');
    try { await api.delete(`/admin/clients/${id}`); toast.success('✓ Customer deleted successfully'); navigate('/admin/clients', { replace: true }); }
    catch (err) { toast.error(errorMessage(err)); setBusy(''); setDeleteOpen(false); }
  }

  return (
    <>
      <Link to="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4"><ArrowLeft className="size-4" /> Clients</Link>

      <div className="flex items-center gap-4 mb-6">
        <Avatar name={c.name} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{c.name}</h1>
          <div className="flex flex-wrap gap-2 mt-1.5"><PaymentBadge status={c.paymentStatus} /><ReadingBadge status={c.readingStatus} /></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-5 sm:p-6 lg:col-span-3">
          <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
          <dl>
            <Row label="Name" value={c.name} />
            <Row label="Date of Birth" value={formatDob(c.dateOfBirth)} />
            <Row label="Birth Time" value={formatTime12(c.birthTime)} />
            <Row label="Birth Place" value={c.birthPlace} />
            <Row label="Submission Date" value={stamp(c.createdAt)} />
          </dl>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Payment</h2>
            <p className="mt-3 text-sm text-muted">Amount</p>
            <p className="text-3xl font-bold tracking-tight">{inr(c.amount)}</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="secondary" onClick={() => setAmountOpen(true)} disabled={paid}><Pencil className="size-4" /> Set Amount</Button>
              {paid ? (
                <Button disabled className="!opacity-100 !bg-green-50 !text-green-700 border border-green-200"><CheckCircle2 className="size-4" /> ✓ Paid</Button>
              ) : (
                <Button onClick={markPaid} loading={busy === 'pay'} disabled={c.amount <= 0}>{busy === 'pay' ? 'Updating...' : 'Mark as Paid'}</Button>
              )}
              {!paid && c.amount <= 0 && <p className="text-xs text-muted">Set an amount first to mark this payment as paid.</p>}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Birth Chart Reading</h2>
            <p className="mt-3 text-sm text-muted">Reading Status</p>
            <p className="text-xl font-bold">{done ? '✓ Completed' : 'Not Read'}</p>
            {!done && (
              <Button className="mt-4 w-full" onClick={markCompleted} loading={busy === 'read'}>
                <BookOpen className="size-4" /> {busy === 'read' ? 'Updating...' : 'Mark as Completed'}
              </Button>
            )}
          </Card>

          <Button variant="secondary" className="w-full !text-bad !border-red-200 hover:!bg-red-50" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete Customer
          </Button>
        </div>
      </div>

      <Card className="p-5 sm:p-6 mt-4">
        <h2 className="text-lg font-semibold">Prediction / Research Notes</h2>
        <p className="mt-1 text-sm text-muted">Private notes for this client. Only signed-in admins can view or edit them.</p>
        <textarea
          id="prediction"
          value={prediction}
          maxLength={10_000}
          disabled={predictionBusy}
          onChange={(e) => { setPrediction(e.target.value); setPredictionError(''); }}
          rows={8}
          aria-label="Prediction and research notes"
          className="mt-4 w-full rounded-xl border border-line bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-brand focus:ring-brand/25"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">{prediction.length.toLocaleString()} / 10,000 characters</span>
          <Button onClick={savePrediction} loading={predictionBusy} disabled={predictionBusy || prediction === (c.prediction ?? '')}>
            {predictionBusy ? 'Saving...' : 'Save prediction'}
          </Button>
        </div>
        {predictionError && <p role="alert" className="mt-3 text-sm text-bad">{predictionError}</p>}
      </Card>

      <Modal open={amountOpen} onClose={() => busy !== 'amount' && setAmountOpen(false)} title="Set Amount">
        <form onSubmit={saveAmount} noValidate>
          <label htmlFor="amount" className="block text-sm font-medium mb-1.5">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden>₹</span>
            <input id="amount" type="number" inputMode="decimal" min="0" step="0.01" autoFocus placeholder="500" value={amountInput}
              onChange={(e) => { setAmountInput(e.target.value); setAmountError(''); }}
              className="w-full h-12 rounded-xl border border-line pl-9 pr-4 text-base focus:outline-none focus:ring-2 focus:border-brand focus:ring-brand/25" />
          </div>
          {amountError && <p role="alert" className="mt-2 text-sm text-bad">{amountError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAmountOpen(false)} disabled={busy === 'amount'}>Cancel</Button>
            <Button type="submit" loading={busy === 'amount'}>{busy === 'amount' ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => busy !== 'delete' && setDeleteOpen(false)} title="Delete Customer?">
        <p className="text-muted">Are you sure you want to permanently delete this customer and their related transaction history?</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={busy === 'delete'}>Cancel</Button>
          <Button variant="danger" onClick={remove} loading={busy === 'delete'}>{busy === 'delete' ? 'Deleting...' : 'Delete Customer'}</Button>
        </div>
      </Modal>
    </>
  );
}
