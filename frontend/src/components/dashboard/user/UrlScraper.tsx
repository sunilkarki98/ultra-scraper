"use client";

import { useState } from "react";
import { useAuth } from "../../../hooks/user/useAuth";
import { userService } from "../../../lib/api/services/user.service";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

export const UrlScraper = () => {
    const [urls, setUrls] = useState<string[]>([""]);
    const [contentSelectors, setContentSelectors] = useState({
        emails: false,
        phones: false,
        text: true,
        tables: false,
        links: false,
        images: true,
        videos: false,
    });
    const [loading, setLoading] = useState(false);

    const { token } = useAuth();

    const addUrl = () => {
        setUrls([...urls, ""]);
    };

    const removeUrl = (index: number) => {
        if (urls.length > 1) {
            setUrls(urls.filter((_, i) => i !== index));
        }
    };

    const updateUrl = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const handleSubmit = async () => {
        if (!urls[0].trim()) {
            toast.error("Please enter at least one URL");
            return;
        }

        setLoading(true);
        try {
            const validUrls = urls.filter(u => u.trim());

            const options: any = {
                mode: "simple",
                workflow: "scraper-llm",
                contentSelectors: contentSelectors, // Send content selectors to backend
            };

            // For now, scrape the first URL (multiple URL support needs backend enhancement)
            const data = await userService.scrape(validUrls[0], options);
            if (data.success) {
                toast.success(`Scrape started! Job ID: ${data.jobId}`);
                // Reset form
                setUrls([""]);
            }
        } catch (error: any) {
            toast.error(error.message || "Scraping failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        🔗 URL Scraping
                    </h2>
                    <p className="text-gray-600">
                        Extract data from one or multiple websites
                    </p>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website URLs
                        </label>
                        {urls.map((url, index) => (
                            <div key={index} className="flex gap-2 mb-3">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => updateUrl(index, e.target.value)}
                                    placeholder={`https://example${index > 0 ? index + 1 : ""}.com`}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {urls.length > 1 && (
                                    <button
                                        onClick={() => removeUrl(index)}
                                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={addUrl}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add another URL
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            What content to extract?
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(contentSelectors).map(([key, value]) => (
                                <label
                                    key={key}
                                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) =>
                                            setContentSelectors({
                                                ...contentSelectors,
                                                [key]: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {key}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">🔄</span>
                                Processing...
                            </>
                        ) : (
                            <>
                                🚀 Start Scraping
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
