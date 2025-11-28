"use client";

import { useEffect, useState } from "react";

interface QueueStats {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
}

interface Job {
    id: string;
    name: string;
    data: any;
    progress: number;
    failedReason?: string;
    timestamp: number;
    finishedOn?: number;
    processedOn?: number;
    attemptsMade: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [loadingJobs, setLoadingJobs] = useState(false);

    useEffect(() => {
        // In a real app, you'd get this from a secure context or auth provider
        const storedKey = localStorage.getItem("userApiKey");
        if (storedKey) setApiKey(storedKey);
    }, []);

    const fetchStats = async () => {
        if (!apiKey) return;

        try {
            setLoading(true);
            // Assuming backend is on port 3000 and proxied or CORS allowed
            const res = await fetch("http://localhost:3000/admin/queues/stats", {
                headers: {
                    "X-API-Key": apiKey,
                },
            });
            const data = await res.json();

            if (data.success) {
                setStats(data.stats);
                setError("");
            } else {
                setError(data.error || "Failed to fetch stats");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async (status: string) => {
        if (!apiKey) return;
        try {
            setLoadingJobs(true);
            setSelectedStatus(status);
            const res = await fetch(`http://localhost:3000/admin/queues/jobs/${status}`, {
                headers: { "X-API-Key": apiKey },
            });
            const data = await res.json();
            if (data.success) {
                setJobs(data.jobs);
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoadingJobs(false);
        }
    };

    const retryJob = async (id: string) => {
        if (!apiKey) return;
        try {
            await fetch(`http://localhost:3000/admin/queues/jobs/${id}/retry`, {
                method: "POST",
                headers: { "X-API-Key": apiKey },
            });
            if (selectedStatus) fetchJobs(selectedStatus);
            fetchStats();
        } catch (error) {
            console.error("Failed to retry job", error);
        }
    };

    const cleanQueue = async () => {
        if (!apiKey || !selectedStatus) return;
        if (!confirm(`Are you sure you want to clean all ${selectedStatus} jobs?`)) return;
        try {
            await fetch(`http://localhost:3000/admin/queues/jobs/${selectedStatus}`, {
                method: "DELETE",
                headers: { "X-API-Key": apiKey },
            });
            fetchJobs(selectedStatus);
            fetchStats();
        } catch (error) {
            console.error("Failed to clean queue", error);
        }
    };

    useEffect(() => {
        if (apiKey) {
            fetchStats();
            const interval = setInterval(fetchStats, 5000); // Poll every 5s
            return () => clearInterval(interval);
        }
    }, [apiKey]);

    if (!apiKey) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Admin Access</h2>
                    <input
                        type="text"
                        placeholder="Enter Admin API Key"
                        className="w-full p-2 border rounded mb-4"
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            localStorage.setItem("userApiKey", e.target.value);
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">System Status</h1>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {loading && !stats ? (
                    <p>Loading...</p>
                ) : stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        <StatCard title="Active" value={stats.active} color="bg-green-500" onClick={() => fetchJobs('active')} />
                        <StatCard title="Waiting" value={stats.waiting} color="bg-yellow-500" onClick={() => fetchJobs('waiting')} />
                        <StatCard title="Completed" value={stats.completed} color="bg-blue-500" onClick={() => fetchJobs('completed')} />
                        <StatCard title="Failed" value={stats.failed} color="bg-red-500" onClick={() => fetchJobs('failed')} />
                        <StatCard title="Delayed" value={stats.delayed} color="bg-gray-500" onClick={() => fetchJobs('delayed')} />
                    </div>
                ) : null}

                {selectedStatus && (
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold capitalize text-gray-900">{selectedStatus} Jobs</h2>
                            <button
                                onClick={cleanQueue}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                            >
                                Clean All
                            </button>
                        </div>

                        {loadingJobs ? (
                            <p className="text-gray-600">Loading jobs...</p>
                        ) : (
                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                <ul className="divide-y divide-gray-200">
                                    {jobs.map((job) => (
                                        <li key={job.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="truncate flex-1">
                                                    <p className="text-sm font-medium text-indigo-600 truncate">{job.data.url || job.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {job.id} | Attempts: {job.attemptsMade} | {new Date(job.timestamp).toLocaleString()}</p>
                                                    {job.failedReason && (
                                                        <p className="text-xs text-red-500 mt-1">Error: {job.failedReason}</p>
                                                    )}
                                                </div>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    {selectedStatus === 'failed' && (
                                                        <button
                                                            onClick={() => retryJob(job.id)}
                                                            className="ml-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-indigo-200"
                                                        >
                                                            Retry
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {jobs.length === 0 && <li className="p-4 text-center text-gray-500">No jobs found</li>}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, color, onClick }: { title: string; value: number; color: string; onClick?: () => void }) {
    return (
        <div
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-transform hover:scale-105`}
            onClick={onClick}
        >
            <div className="p-5">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
                        {/* Icon placeholder */}
                        <div className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-gray-900">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
