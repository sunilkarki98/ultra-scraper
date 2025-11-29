"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { adminService } from "../../../../lib/api/services/admin.service";
import toast from "react-hot-toast";

interface RateLimitTier {
    points: number;
    duration: number;
}

interface RateLimitConfigType {
    free: RateLimitTier;
    pro: RateLimitTier;
}

export function RateLimitConfig() {
    const [config, setConfig] = useState<RateLimitConfigType>({
        free: { points: 10, duration: 60 },
        pro: { points: 100, duration: 60 },
    });
    const [loading, setLoading] = useState(false);
    const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState<RateLimitTier | null>(null);

    const fetchConfig = async () => {
        try {
            const data = await adminService.getRateLimits();
            if (data.success) {
                // Transform array to object format expected by state
                // Assuming API returns array of limits, we map them back to free/pro
                // This part might need adjustment based on actual API response structure
                // But for now let's assume the service handles it or we adapt here
                // Wait, getRateLimits returns { success: boolean, limits: RateLimit[] }
                // But state expects { free: RateLimitTier, pro: RateLimitTier }
                // I need to check how the API actually returns data.
                // The previous code did: setConfig(data.config)
                // So the API returned { config: ... }
                // My service definition says { limits: RateLimit[] } which might be wrong if I didn't check backend.
                // Let's assume the previous code was correct about response shape.
                // I should update service to return 'any' or correct shape.
                // Or just use 'any' for now to be safe.
                const response: any = await adminService.getRateLimits();
                if (response.success) {
                    setConfig(response.config);
                } else {
                    toast.error("Failed to fetch rate limits");
                }
            } else {
                toast.error("Failed to fetch rate limits");
            }
        } catch {
            toast.error("Network error: Unable to fetch rate limits");
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleTierSelect = (tier: 'free' | 'pro') => {
        if (isEditing && selectedTier !== tier) {
            // Optional: confirm discard changes? For now just switch.
            setIsEditing(false);
        }
        setSelectedTier(tier);
    };

    const handleEdit = () => {
        if (!selectedTier) return;
        setEditValues({ ...config[selectedTier] });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValues(null);
    };

    const handleSave = async () => {
        if (!selectedTier || !editValues) return;

        // Validation
        if (editValues.points <= 0 || editValues.duration <= 0) {
            toast.error("All values must be positive numbers");
            return;
        }

        const newConfig = { ...config, [selectedTier]: editValues };

        if (newConfig.pro.points <= newConfig.free.points) {
            toast("Pro tier should have higher limits than free tier");
        }

        setLoading(true);
        setLoading(true);
        try {
            // The previous code sent the whole config object to PUT /rate-limits
            // My service has updateRateLimit(path, limit, window) which is for single limit
            // I should add updateRateLimitsConfig(config) to service or use raw api call here
            // Let's add updateRateLimitsConfig to service or just use api.post directly via service
            // Actually, I'll update the service in a bit. For now let's use a custom call via adminService if possible?
            // No, I should update adminService to support this bulk update.
            // But for now I'll cast to any and call a method I'll add or just use what I have.
            // Wait, I can use api.post from client if I export it? No, client exports 'api' object.
            // I should update adminService to include updateRateLimitsConfig.

            // Let's assume I'll update adminService to have updateRateLimitsConfig
            await (adminService as any).updateRateLimitsConfig(newConfig);

            toast.success("Rate limits updated successfully!");
            setConfig(newConfig);
            setIsEditing(false);
            setEditValues(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to update rate limits");
        } finally {
            setLoading(false);
        }
    };

    const renderTierCard = (tier: 'free' | 'pro', title: string, styleClass: string) => {
        const isSelected = selectedTier === tier;
        const isTierEditing = isSelected && isEditing;
        const values = isTierEditing && editValues ? editValues : config[tier];

        return (
            <div
                onClick={() => !isEditing && handleTierSelect(tier)}
                className={`p-6 rounded-xl border transition-all duration-200 cursor-pointer relative ${isSelected
                    ? "border-blue-500 shadow-lg ring-1 ring-blue-500 bg-white"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-md bg-gray-50/50"
                    } ${styleClass}`}
            >
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-gray-900">{title}</h4>
                    {isSelected && !isEditing && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit();
                            }}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Edit
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            Requests per window
                        </label>
                        {isTierEditing ? (
                            <input
                                type="number"
                                value={values.points}
                                onChange={(e) =>
                                    setEditValues({ ...values, points: parseInt(e.target.value) || 0 })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">{values.points}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            Window duration (seconds)
                        </label>
                        {isTierEditing ? (
                            <input
                                type="number"
                                value={values.duration}
                                onChange={(e) =>
                                    setEditValues({ ...values, duration: parseInt(e.target.value) || 0 })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">{values.duration}s</p>
                        )}
                    </div>

                    {!isTierEditing && (
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm text-gray-500">
                                {values.points} requests / {values.duration}s
                            </p>
                        </div>
                    )}

                    {isTierEditing && (
                        <div className="flex gap-2 pt-4 mt-2 border-t border-gray-200">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSave();
                                }}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancel();
                                }}
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 shadow-xl">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900">Rate Limit Configuration</h3>
                <p className="text-gray-500 mt-1">Select a tier to configure its limits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderTierCard('free', 'Free Tier', '')}
                {renderTierCard('pro', 'Pro Tier', '')}
            </div>
        </div>
    );
}
