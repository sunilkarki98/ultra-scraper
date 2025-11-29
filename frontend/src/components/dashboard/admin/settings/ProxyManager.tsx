"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { adminService } from "../../../../lib/api/services/admin.service";
import toast from "react-hot-toast";

interface ProxyStatus {
    url: string;
    failures: number;
    lastUsed: number;
    disabledUntil: number;
}

export function ProxyManager() {
    const [proxies, setProxies] = useState<ProxyStatus[]>([]);
    const [newProxyUrl, setNewProxyUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchProxies = async () => {
        try {
            const data = await adminService.getProxies();
            if (data.success) {
                setProxies(data.proxies);
            } else {
                toast.error("Failed to fetch proxies");
            }
        } catch {
            toast.error("Network error: Unable to fetch proxies");
        }
    };

    useEffect(() => {
        fetchProxies();
    }, []);

    const handleAddProxy = async () => {
        if (!newProxyUrl) return;

        // Basic URL validation
        if (!newProxyUrl.startsWith("http://") && !newProxyUrl.startsWith("https://")) {
            toast.error("Proxy URL must start with http:// or https://");
            return;
        }

        setLoading(true);
        try {
            await adminService.addProxy(newProxyUrl);
            toast.success("Proxy added successfully!");
            setNewProxyUrl("");
            fetchProxies();
        } catch (error: any) {
            toast.error(error.message || "Failed to add proxy");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveProxy = async (url: string) => {
        try {
            await adminService.deleteProxy(url);
            toast.success("Proxy removed successfully!");
            fetchProxies();
        } catch (error: any) {
            toast.error(error.message || "Failed to remove proxy");
        }
    };

    const isProxyActive = (proxy: ProxyStatus) => {
        return proxy.disabledUntil < Date.now();
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Proxy Management</h3>

            {/* Add Proxy Form */}
            <div className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={newProxyUrl}
                    onChange={(e) => setNewProxyUrl(e.target.value)}
                    placeholder="http://user:pass@host:port"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleAddProxy}
                    disabled={loading || !newProxyUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Proxy
                </button>
            </div>

            {/* Proxy List */}
            <div className="space-y-3">
                {proxies.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        No proxies configured. Add one to get started.
                    </p>
                ) : (
                    proxies.map((proxy, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                {isProxyActive(proxy) ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{proxy.url}</p>
                                    <p className="text-sm text-gray-500">
                                        Failures: {proxy.failures} | Last used:{" "}
                                        {proxy.lastUsed
                                            ? new Date(proxy.lastUsed).toLocaleString()
                                            : "Never"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveProxy(proxy.url)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
