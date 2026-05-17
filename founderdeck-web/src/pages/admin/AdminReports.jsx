import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/reports');
      setReports(data.data ?? []);
    } catch {
      toast.error('Could not load reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const markReviewed = async (report) => {
    try {
      await api.patch(`/admin/reports/${report.id}/review`);
      setReports((current) => current.map((item) => (item.id === report.id ? { ...item, is_reviewed: true } : item)));
    } catch {
      toast.error('Could not mark report reviewed.');
    }
  };

  const deleteReportedComment = async (report) => {
    try {
      await api.delete(`/admin/comments/${report.reportable_id}`);
      setReports((current) => current.filter((item) => item.id !== report.id));
      toast.success('Comment deleted.');
    } catch {
      toast.error('Could not delete comment.');
    }
  };

  return (
    <div className="space-y-6 text-[#111111]">
      <div>
        <h1 className="text-3xl font-display font-black text-[#111111] uppercase tracking-tight">Reports</h1>
        <p className="mt-1 text-sm font-semibold text-gray-500">Review community reports and moderation notes.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-52 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF5C00]" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center font-semibold text-gray-400">No reports yet.</div>
        ) : reports.map((report) => (
          <div key={report.id} className="flex flex-col gap-3 border-b border-black/5 p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold text-[#111111]">{report.reason}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Reporter: {report.reporter?.name ?? 'Member'}
              </p>
              {report.reportable_type?.includes('Comment') && (
                <span className="mt-1 inline-block rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-600">
                  Comment report
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {report.reportable_type?.includes('Comment') && (
                <button
                  type="button"
                  onClick={() => deleteReportedComment(report)}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/15 px-5 py-2 text-xs font-bold text-white transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Comment</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => markReviewed(report)}
                disabled={report.is_reviewed}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-[#FF5C00] hover:bg-[#E65300] shadow-md shadow-[#FF5C00]/15 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="h-4 w-4" />
                <span>{report.is_reviewed ? 'Reviewed' : 'Mark reviewed'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
