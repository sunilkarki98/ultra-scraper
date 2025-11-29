import { motion } from "framer-motion";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { QueueStats } from "../../../types/admin";

interface StatsCardsProps {
    stats: QueueStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
    const statCards = [
        {
            title: "Active Jobs",
            value: stats.active,
            change: "+12%",
            icon: Activity,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            title: "Completed",
            value: stats.completed,
            change: "+23%",
            icon: CheckCircle2,
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-50",
            textColor: "text-green-600",
        },
        {
            title: "Failed",
            value: stats.failed,
            change: "-5%",
            icon: XCircle,
            color: "from-red-500 to-red-600",
            bgColor: "bg-red-50",
            textColor: "text-red-600",
        },
        {
            title: "Waiting",
            value: stats.waiting,
            change: "+8%",
            icon: Clock,
            color: "from-yellow-500 to-yellow-600",
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {card.value.toLocaleString()}
                                </p>
                                <p className={`text-sm mt-2 ${card.textColor} font-medium`}>
                                    {card.change} from last hour
                                </p>
                            </div>
                            <div
                                className={`p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform`}
                            >
                                <Icon className={`w-6 h-6 ${card.textColor}`} />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
