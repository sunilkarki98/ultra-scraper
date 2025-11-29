"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    RefreshCw,
    Trash2,
    RotateCcw,
    CheckCircle,
    XCircle,
    Clock,
    Loader,
} from "lucide-react";
import { adminService } from "../../../lib/api/services/admin.service";
import toast from "react-hot-toast";
import { storage, STORAGE_KEYS } from "../../../lib/storage";

interface Job {
    id: string;
    name: string;
    data: { url?: string };
    progress: number;
    failedReason?: string;
    timestamp: number;
    finishedOn?: number;
    processedOn?: number;
    attemptsMade: number;
    status: string;
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>("active");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const storedKey = storage.get(STORAGE_KEYS.ADMIN_API_KEY);
        if (storedKey) {
            fetchJobs("active");
        }
    }, []);

    const fetchJobs = async (status: string) => {
        setLoading(true);
        try {
            const data = await adminService.getJobs(status);
            if (data.success) {
                setJobs(data.jobs);
            } else {
                toast.error("Failed to fetch jobs");
            }
        } catch {
            toast.error("Network error: Unable to fetch jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (id: string) => {
        try {
            await adminService.retryJob(id);
            toast.success("Job queued for retry!");
            fetchJobs(selectedStatus);
        } catch (error: any) {
            toast.error(error.message || "Failed to retry job");
        }
    };

    const handleClean = async () => {
        try {
            await adminService.cleanQueue(selectedStatus);
            toast.success(`Cleaned ${selectedStatus} jobs!`);
            fetchJobs(selectedStatus);
        } catch (error: any) {
            toast.error(error.message || "Failed to clean queue");
        }
    };

    const statusOptions = [
        { value: "active", label: "Active", icon: Loader, color: "blue" },
        { value: "waiting", label: "Waiting", icon: Clock, color: "yellow" },
        { value: "completed", label: "Completed", icon: CheckCircle, color: "green" },
        { value: "failed", label: "Failed", icon: XCircle, color: "red" },
    ];

    const filteredJobs = jobs.filter((job) =>
        job.data?.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const config = statusOptions.find((s) => s.value === status);
        if (!config) return null;

        const Icon = config.icon;
        const colors = {
            blue: "bg-blue-100 text-blue-700 border-blue-200",
            yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
            green: "bg-green-100 text-green-700 border-green-200",
            red: "bg-red-100 text-red-700 border-red-200",
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors[config.color as keyof typeof colors]}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
                    <p className="text-gray-500 mt-1">Monitor and manage all scraping jobs</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by URL or Job ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {statusOptions.map((option) => {
                            const Icon = option.icon;
                            const isActive = selectedStatus === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setSelectedStatus(option.value);
                                        fetchJobs(option.value);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchJobs(selectedStatus)}
                            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={handleClean}
                            className="p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                        >
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-600 font-medium">Loading jobs...</p>
                        </div>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">No jobs found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search term</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Job Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Attempts
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredJobs.map((job, index) => (
                                    <motion.tr
                                        key={job.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-md">
                                                    {job.data?.url || job.name}
                                                </p>
                                                <p className="text-xs text-gray-500 font-mono">ID: {job.id}</p>
                                                {job.failedReason && (
                                                    <p className="text-xs text-red-600 mt-1">Error: {job.failedReason}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(selectedStatus)}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{job.attemptsMade}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {new Date(job.timestamp).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {selectedStatus === "failed" && (
                                                <button
                                                    onClick={() => handleRetry(job.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Retry
                                                </button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats Footer */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{filteredJobs.length}</span> jobs
                    </p>
                    <p className="text-sm text-gray-600">
                        Last updated: <span className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
