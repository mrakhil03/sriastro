import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Hourglass, IndianRupee, Inbox, Users } from 'lucide-react';
import { useApi } from '../hooks';
import { Avatar, Card, EmptyState, ErrorState, Loading, PageHeader, PaymentBadge, StatCard, ReadingBadge } from '../components/ui';
import type { Client } from '../types';
import { formatDob, formatTime12, inr, stamp } from '../utils';

interface Dash {
  totalClients: number; newRequests: number; totalCollection: number; pendingCollection: number;
  completedReadings: number; pendingReadings: number; recent: Client[];
}

export default function Dashboard() {
  const { data, error, loading, reload } = useApi<Dash>('/admin/dashboard');
  if (!data) return error ? <ErrorState message={error.message} onRetry={reload} /> : <Loading label="Loading dashboard..." />;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="An overview of your practice." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total Clients" value={data.totalClients} icon={Users} />
        <StatCard label="New Requests" value={data.newRequests} icon={Inbox} />
        <StatCard label="Total Collection" value={inr(data.totalCollection)} icon={IndianRupee} accent />
        <StatCard label="Pending Collection" value={inr(data.pendingCollection)} icon={Hourglass} />
        <StatCard label="Completed Readings" value={data.completedReadings} icon={CheckCircle2} />
        <StatCard label="Pending Readings" value={data.pendingReadings} icon={BookOpen} />
      </div>

      <div className="flex items-center justify-between mt-10 mb-3">
        <h2 className="text-lg font-semibold">Recent requests</h2>
        <Link to="/admin/requests" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
      </div>
      <Card className="divide-y divide-line">
        {data.recent.length === 0 ? (
          <EmptyState icon={Users} title="No Clients Yet" text="Customer birth details will appear here after submission." />
        ) : data.recent.map((c) => (
          <Link key={c.id} to={`/admin/clients/${c.id}`} className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-canvas first:rounded-t-2xl last:rounded-b-2xl">
            <Avatar name={c.name} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{c.name}</p>
              <p className="text-sm text-muted truncate">{formatDob(c.dateOfBirth)} • {formatTime12(c.birthTime)} • {c.birthPlace}</p>
              <p className="text-xs text-muted mt-0.5">{stamp(c.createdAt)}</p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1"><PaymentBadge status={c.paymentStatus} /><ReadingBadge status={c.readingStatus} /></div>
          </Link>
        ))}
      </Card>
    </>
  );
}
