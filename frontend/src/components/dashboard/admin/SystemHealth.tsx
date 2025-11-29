import { motion } from "framer-motion";
import { Activity, TrendingUp, Zap } from "lucide-react";
import { QueueStats } from "../../../types/admin";

interface SystemHealthProps {
    stats: QueueStats;
}

export function SystemHealth({ stats }: SystemHealthProps) {
    const successRate =
        stats.total > 0
            ? ((stats.completed / (stats.completed + stats.failed)) * 100).toFixed(1)
            : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl"
        >
            <h3 className="text-lg font-bold text-gray-900 mb-6">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                        <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Avg Processing Time</p>
                        <p className="text-2xl font-bold text-gray-900">2.3s</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total Processed</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stats.total.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
