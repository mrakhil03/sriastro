import { useEffect, useState } from 'react';
import { CheckCircle2, Hourglass, IndianRupee, Receipt, Sun } from 'lucide-react';
import { api, errorMessage } from '../api';
import { Avatar, Button, Card, EmptyState, ErrorState, Loading, PageHeader, StatCard } from '../components/ui';
import type { MoneySummary, TransactionItem } from '../types';
import { dayKey, dayLabel, formatClock, formatDate, inr } from '../utils';
import { Link } from 'react-router-dom';

const PAGE = 30;

export default function Transactions() {
  const [summary, setSummary] = useState<MoneySummary | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true); setError('');
    api.get('/admin/transactions', { params: { page: 1, pageSize: PAGE } })
      .then((r) => { setSummary(r.data.summary); setItems(r.data.items); setTotal(r.data.total); })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [tick]);

  async function loadMore() {
    setMore(true);
    try {
      const r = await api.get('/admin/transactions', { params: { page: Math.floor(items.length / PAGE) + 1, pageSize: PAGE } });
      setItems((x) => [...x, ...r.data.items.filter((n: TransactionItem) => !x.some((o) => o.id === n.id))]);
    } catch (e) { setError(errorMessage(e)); } finally { setMore(false); }
  }

  if (loading && !summary) return <Loading label="Loading transactions..." />;
  if (error && !summary) return <ErrorState message={error} onRetry={() => setTick((t) => t + 1)} />;

  // group by calendar day (items are already newest first)
  const groups: { key: string; label: string; rows: TransactionItem[] }[] = [];
  for (const t of items) {
    const k = dayKey(t.createdAt);
    const last = groups[groups.length - 1];
    last && last.key === k ? last.rows.push(t) : groups.push({ key: k, label: dayLabel(t.createdAt), rows: [t] });
  }

  return (
    <>
      <PageHeader title="Transactions" subtitle="Every payment you have marked as received." />
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Collection" value={inr(summary.totalCollection)} icon={IndianRupee} accent />
          <StatCard label="Today's Collection" value={inr(summary.todayCollection)} icon={Sun} />
          <StatCard label="Total Transactions" value={summary.totalTransactions} icon={Receipt} />
          <StatCard label="Pending Collection" value={inr(summary.pendingCollection)} icon={Hourglass} />
        </div>
      )}

      {items.length === 0 ? (
        <Card className="mt-8"><EmptyState icon={Receipt} title="No Transactions Yet" text="Paid transactions will appear here." /></Card>
      ) : (
        <div className="mt-8 max-w-2xl">
          {groups.map((g) => (
            <section key={g.key} className="mb-7" aria-label={g.label}>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{g.label}</h2>
              <ul className="space-y-3">
                {g.rows.map((t) => (
                  <li key={t.id}>
                    <Link to={`/admin/clients/${t.clientId}`} className="block">
                      <Card className="p-4 sm:p-5 hover:border-brand/50 transition-colors">
                        <div className="flex items-start gap-3.5">
                          <Avatar name={t.clientName} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{t.clientName}</p>
                            <p className="text-sm text-muted truncate">{t.description}</p>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold tracking-tight">{inr(t.amount)}</p>
                        </div>
                        <div className="mt-3 pl-[3.625rem] flex items-center justify-between gap-2 text-sm">
                          <span className="text-muted">{g.label === 'Today' || g.label === 'Yesterday' ? g.label : formatDate(t.createdAt)} • {formatClock(t.createdAt)}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-ok"><CheckCircle2 className="size-4" aria-hidden /> Paid</span>
                        </div>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {items.length < total && <div className="text-center"><Button variant="secondary" onClick={loadMore} loading={more}>{more ? 'Loading transactions...' : 'Load more'}</Button></div>}
          {error && <p role="alert" className="text-center text-sm text-bad mt-3">{error}</p>}
        </div>
      )}
    </>
  );
}
