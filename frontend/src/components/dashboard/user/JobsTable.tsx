import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/user/useAuth";
import { userService } from "../../../lib/api/services/user.service";
import { Job } from "../../../types/user";
import toast from "react-hot-toast";

export function JobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getJobs();
      if (data.success) {
        setJobs(data.data || []);
      }
    } catch {
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-900/50 text-green-400 border border-green-500/30";
      case "failed":
        return "bg-red-900/50 text-red-400 border border-red-500/30";
      case "processing":
        return "bg-blue-900/50 text-blue-400 border border-blue-500/30 animate-pulse";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <div className="px-6 py-6 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">📜 Job History</h3>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Refresh jobs"
        >
          🔄 Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">URL</th>
              <th className="px-6 py-4 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin">⚙️</div>
                    Loading jobs...
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  No jobs found. Start a scrape to see results here.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium truncate max-w-xs" title={job.url}>
                      {job.url}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{job.id}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
