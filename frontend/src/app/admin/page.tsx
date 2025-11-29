"use client";

import { motion } from "framer-motion";
import { RefreshCw, Download } from "lucide-react";
import { useAdminStats } from "../../hooks/admin/useAdminStats";
import { StatsCards } from "../../components/dashboard/admin/StatsCards";
import { JobsChart } from "../../components/dashboard/admin/JobsChart";
import { StatusDistribution } from "../../components/dashboard/admin/StatusDistribution";
import { SystemHealth } from "../../components/dashboard/admin/SystemHealth";

export default function AdminDashboard() {
    const { stats, loading, historicalData, refreshStats } = useAdminStats();


    if (loading || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">
                        Monitor your scraping operations in real-time
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={refreshStats}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all shadow-blue-500/30"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <JobsChart data={historicalData} />
                <StatusDistribution stats={stats} />
            </div>

            {/* System Health */}
            <SystemHealth stats={stats} />
        </div>
    );
}
