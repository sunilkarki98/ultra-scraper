import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { QueueStats } from "../../../types/admin";

interface StatusDistributionProps {
    stats: QueueStats;
}

export function StatusDistribution({ stats }: StatusDistributionProps) {
    const pieData = [
        { name: "Completed", value: stats.completed, color: "#10b981" },
        { name: "Active", value: stats.active, color: "#3b82f6" },
        { name: "Failed", value: stats.failed, color: "#ef4444" },
        { name: "Waiting", value: stats.waiting, color: "#f59e0b" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl"
        >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Status Distribution</h3>
            <p className="text-sm text-gray-500 mb-6">Current queue breakdown</p>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
                {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
