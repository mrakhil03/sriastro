import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { useApi } from '../hooks';
import { Avatar, buttonClass, Card, EmptyState, ErrorState, Loading, PageHeader } from '../components/ui';
import type { Client } from '../types';
import { formatDate, formatDob, formatTime12 } from '../utils';

interface Res { pendingCount: number; completedCount: number; pending: Client[]; completed: Client[] }

function List({ rows, cta }: { rows: Client[]; cta: string }) {
  return (
    <Card className="divide-y divide-line">
      {rows.map((c) => (
        <div key={c.id} className="flex items-center gap-3 sm:gap-4 p-4">
          <Avatar name={c.name} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{c.name}</p>
            <p className="text-sm text-muted truncate">{formatDob(c.dateOfBirth)} • {formatTime12(c.birthTime)} • {c.birthPlace}</p>
            <p className="text-xs text-muted mt-0.5">Submitted {formatDate(c.createdAt)}</p>
          </div>
          <Link to={`/admin/clients/${c.id}`} className={buttonClass('secondary', 'h-9 px-3')}>{cta}</Link>
        </div>
      ))}
    </Card>
  );
}

export default function Readings() {
  const { data, error, reload } = useApi<Res>('/admin/readings');
  if (!data) return error ? <ErrorState message={error.message} onRetry={reload} /> : <Loading label="Loading readings..." />;

  return (
    <>
      <PageHeader title="Readings" subtitle="Track which birth charts are waiting and which are done." />

      <h2 className="text-lg font-semibold mb-3">Pending Readings <span className="text-muted font-normal">({data.pendingCount})</span></h2>
      {data.pending.length === 0
        ? <Card><EmptyState icon={BookOpen} title="No Pending Readings" text="All current readings have been completed." /></Card>
        : <><List rows={data.pending} cta="Open" />{data.pendingCount > data.pending.length && <p className="text-sm text-muted mt-2">Showing the oldest {data.pending.length}. Complete some to see the rest.</p>}</>}

      <h2 className="text-lg font-semibold mt-10 mb-3">Completed Readings <span className="text-muted font-normal">({data.completedCount})</span></h2>
      {data.completed.length === 0
        ? <Card><EmptyState icon={CheckCircle2} title="No Completed Readings" text="Completed readings will appear here." /></Card>
        : <List rows={data.completed} cta="View" />}
    </>
  );
}
