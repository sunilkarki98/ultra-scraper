import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../lib/api/services/admin.service";
import { storage, STORAGE_KEYS } from "../../lib/storage";
import { QueueStats } from "../../types/admin";

interface HistoricalDataPoint {
    time: string;
    completed: number;
    failed: number;
    active: number;
}

export function useAdminStats() {
    const [apiKey, setApiKey] = useState("");
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

    const generateHistoricalData = useCallback((currentStats: QueueStats) => {
        // Generate mock historical data for charts
        const hours = 24;
        const data: HistoricalDataPoint[] = [];
        for (let i = hours; i >= 0; i--) {
            data.push({
                time: `${i}h ago`,
                completed: Math.floor(Math.random() * 100) + currentStats.completed / 10,
                failed: Math.floor(Math.random() * 20),
                active: Math.floor(Math.random() * 30),
            });
        }
        setHistoricalData(data);
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getQueueStats();

            if (data.success) {
                setStats(data.stats);
                generateHistoricalData(data.stats);
                setError(null);
            } else {
                setError("Failed to fetch stats");
            }
        } catch {
            console.error('Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    }, [generateHistoricalData]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const interval = setInterval(() => fetchStats(), 30000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleApiKeyChange = (key: string) => {
        setApiKey(key);
        storage.set(STORAGE_KEYS.ADMIN_API_KEY, key);
    };

    const refreshStats = () => {
        fetchStats();
    };

    return {
        apiKey,
        stats,
        loading,
        error,
        historicalData,
        handleApiKeyChange,
        refreshStats,
    };
}
