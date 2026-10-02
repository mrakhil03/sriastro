import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Hourglass, IndianRupee, Users, Wallet } from 'lucide-react';
import { useApi } from '../hooks';
import { Avatar, buttonClass, Card, EmptyState, ErrorState, Loading, PageHeader, PaymentBadge, StatCard } from '../components/ui';
import Pagination from '../components/Pagination';
import type { Paged, PaymentItem } from '../types';
import { cn, formatDate, inr } from '../utils';

interface Res extends Paged<PaymentItem> { summary: { totalCollected: number; paidCustomers: number; pendingCustomers: number; pendingAmount: number } }
const tabs = [['ALL', 'All'], ['PAID', 'Paid'], ['NOT_PAID', 'Not Paid']] as const;

export default function Payments() {
  const [status, setStatus] = useState<'ALL' | 'PAID' | 'NOT_PAID'>('ALL');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]);
  const { data, error, loading, reload } = useApi<Res>('/admin/payments', { status, page, pageSize: 15 });

  if (!data) return error ? <ErrorState message={error.message} onRetry={reload} /> : <Loading label="Loading payments..." />;
  const s = data.summary;

  return (
    <>
      <PageHeader title="Payments" subtitle="Who has paid and who is still pending." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Collected" value={inr(s.totalCollected)} icon={IndianRupee} accent />
        <StatCard label="Paid Customers" value={s.paidCustomers} icon={CheckCircle2} />
        <StatCard label="Pending Customers" value={s.pendingCustomers} icon={Users} />
        <StatCard label="Pending Amount" value={inr(s.pendingAmount)} icon={Hourglass} />
      </div>

      <div role="tablist" aria-label="Payment status" className="inline-flex bg-white border border-line rounded-xl p-1 mt-8 mb-4">
        {tabs.map(([v, l]) => (
          <button key={v} role="tab" aria-selected={status === v} onClick={() => setStatus(v)}
            className={cn('px-4 h-9 rounded-lg text-sm font-semibold transition-colors', status === v ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>{l}</button>
        ))}
      </div>

      {data.items.length === 0 ? (
        <Card><EmptyState icon={Wallet} title="No payments to show" text="Customers will appear here once they submit their details." /></Card>
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <Card className="divide-y divide-line">
            {data.items.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <Avatar name={p.name} />
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-sm text-muted">{p.paidAt ? `Paid ${formatDate(p.paidAt)}` : `Submitted ${formatDate(p.createdAt)}`}</p>
                </div>
                <p className="font-bold sm:w-24 sm:text-right">{p.amount > 0 ? inr(p.amount) : '—'}</p>
                <div className="sm:w-28"><PaymentBadge status={p.paymentStatus} /></div>
                <Link to={`/admin/clients/${p.id}`} className={buttonClass('secondary', 'h-9 px-3 ml-auto sm:ml-0')}>{p.paymentStatus === 'PAID' ? 'View' : 'Manage'}</Link>
              </div>
            ))}
          </Card>
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
        </div>
      )}
    </>
  );
}
