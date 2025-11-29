"use client";

import { useState } from "react";
import { useAuth } from "../../../hooks/user/useAuth";
import { userService } from "../../../lib/api/services/user.service";
import toast from "react-hot-toast";
import { GuidanceTooltip } from "./GuidanceTooltip";
import { Bot, Link as LinkIcon, Plus, Trash2 } from "lucide-react";

type Mode = "prompt" | "url";
type LLMSource = "default" | "own-api" | "webhook";

export const SimpleScrapeInterface = () => {
    const [mode, setMode] = useState<Mode>("prompt");
    const [llmSource, setLLMSource] = useState<LLMSource>("default");
    const [prompt, setPrompt] = useState("");
    const [urls, setUrls] = useState<string[]>([""]);
    const [contentSelectors, setContentSelectors] = useState({
        emails: false,
        phones: false,
        text: true,
        tables: false,
        links: false,
    });
    const [showGuidance, setShowGuidance] = useState(true);
    const [loading, setLoading] = useState(false);

    const { token } = useAuth();

    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        if (newMode === "prompt") {
            setShowGuidance(true);
        }
    };

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
        if (mode === "prompt" && !prompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }

        if (mode === "url" && !urls[0].trim()) {
            toast.error("Please enter at least one URL");
            return;
        }

        setLoading(true);
        try {
            const options: any = {
                mode: "simple",
                workflow: "scraper-llm",
            };

            if (mode === "prompt") {
                options.aiPrompt = prompt;
                // Use first URL if provided, otherwise it's a pure prompt
                const targetUrl = urls[0].trim() || "https://example.com";

                const data = await userService.scrape(targetUrl, options);
                if (data.success) {
                    toast.success(`Scrape started! Job ID: ${data.jobId}`);
                }
            } else {
                // URL mode - handle multiple URLs
                const validUrls = urls.filter(u => u.trim());

                // Build content extraction prompt based on selectors
                const selectedContent = Object.entries(contentSelectors)
                    .filter(([_, selected]) => selected)
                    .map(([type]) => type)
                    .join(", ");

                options.aiPrompt = `Extract the following content: ${selectedContent}`;

                // For now, scrape the first URL (multiple URL support needs backend enhancement)
                const data = await userService.scrape(validUrls[0], options);
                if (data.success) {
                    toast.success(`Scrape started! Job ID: ${data.jobId}`);
                }
            }

            // Reset form
            setPrompt("");
            setUrls([""]);
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
                        🚀 Start Scraping
                    </h2>
                    <p className="text-gray-600">
                        Extract data from any website in seconds
                    </p>
                </div>

                {/* LLM Source Selector */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI Provider
                    </label>
                    <select
                        value={llmSource}
                        onChange={(e) => setLLMSource(e.target.value as LLMSource)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        <option value="default">Default (SaaS-managed)</option>
                        <option value="own-api">My API Key</option>
                        <option value="webhook">Custom Webhook</option>
                    </select>
                </div>

                {/* Mode Toggle */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => handleModeChange("prompt")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${mode === "prompt"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <Bot className="w-4 h-4" />
                            Prompt Mode
                        </button>
                        <button
                            onClick={() => handleModeChange("url")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${mode === "url"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <LinkIcon className="w-4 h-4" />
                            URL Mode
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {mode === "prompt" ? (
                        <>
                            {showGuidance && <GuidanceTooltip onDismiss={() => setShowGuidance(false)} />}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        What do you want to extract?
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Example: Extract all product names, prices, and descriptions from this page"
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows={5}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Website URL (optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={urls[0]}
                                        onChange={(e) => updateUrl(0, e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
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
                    )}
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
