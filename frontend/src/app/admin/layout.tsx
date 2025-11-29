"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    ListChecks,
    Users,
    Globe,
    Zap,
    Brain,
    Activity,
    LogOut,
} from "lucide-react";
import { storage, STORAGE_KEYS } from "../../lib/storage";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [apiKey, setApiKey] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check localStorage for existing API key
        const storedKey = storage.get(STORAGE_KEYS.ADMIN_API_KEY);
        if (storedKey) {
            setApiKey(storedKey);
            setIsAuthenticated(true);
        }
    }, []);

    const handleApiKeyChange = (key: string) => {
        setApiKey(key);
        storage.set(STORAGE_KEYS.ADMIN_API_KEY, key);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        storage.remove(STORAGE_KEYS.ADMIN_API_KEY);
        setApiKey("");
        setIsAuthenticated(false);
    };

    // Show gatekeeper if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-white text-2xl font-bold">U</span>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Admin Access Required
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">
                            Enter your admin API key to access the panel
                        </p>
                    </div>
                    <input
                        type="password"
                        placeholder="Enter Admin API Key"
                        className="w-full p-4 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value) {
                                handleApiKeyChange(e.currentTarget.value);
                            }
                        }}
                    />
                </motion.div>
            </div>
        );
    }

    const navigation = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Jobs", href: "/admin/jobs", icon: ListChecks },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Proxies", href: "/admin/proxies", icon: Globe },
        { name: "Rate Limits", href: "/admin/rate-limits", icon: Zap },
        { name: "LLM Config", href: "/admin/llm", icon: Brain },
        { name: "Activity", href: "/admin/activity", icon: Activity },
    ];

    const isActive = (href: string) => {
        if (href === "/admin") {
            return pathname === href;
        }
        return pathname?.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200/50">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl font-bold">U</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Ultra-Scraper
                            </h1>
                            <p className="text-xs text-gray-500">Admin Panel</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                        : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                                            }`}
                                    />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-gray-200/50">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                A
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
                                <p className="text-xs text-gray-500 truncate">admin@ultra-scraper.com</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="ml-64">
                <main className="p-8">{children}</main>
            </div>
        </div>
    );
}
