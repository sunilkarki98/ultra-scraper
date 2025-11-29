"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function ActivityPage() {
    const activities = [
        {
            id: "1",
            type: "success",
            message: "Job completed successfully",
            details: "Scraped https://example.com",
            timestamp: "2 minutes ago",
        },
        {
            id: "2",
            type: "error",
            message: "Job failed after 3 attempts",
            details: "Timeout error on https://slow-site.com",
            timestamp: "5 minutes ago",
        },
        {
            id: "3",
            type: "info",
            message: "New user registered",
            details: "user@example.com joined with Free plan",
            timestamp: "10 minutes ago",
        },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case "error":
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-blue-600" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "success":
                return "bg-green-50 border-green-200";
            case "error":
                return "bg-red-50 border-red-200";
            default:
                return "bg-blue-50 border-blue-200";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
                <p className="text-gray-500 mt-1">Real-time system activity and events</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <div className="space-y-4">
                    {activities.map((activity, index) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-start gap-4 p-4 rounded-xl border ${getColor(activity.type)}`}
                        >
                            <div className="mt-0.5">{getIcon(activity.type)}</div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{activity.message}</p>
                                <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                                <p className="text-xs text-gray-500 mt-2">{activity.timestamp}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
