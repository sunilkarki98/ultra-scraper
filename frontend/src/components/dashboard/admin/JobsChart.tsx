import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

interface JobsChartProps {
    data: { time: string; completed: number; failed: number; active: number }[];
}

export function JobsChart({ data }: JobsChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Jobs Over Time</h3>
                    <p className="text-sm text-gray-500">Last 24 hours</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">+15.3%</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        }}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorCompleted)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="failed"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorFailed)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
