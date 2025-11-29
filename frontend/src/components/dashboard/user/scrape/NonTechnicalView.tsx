"use client";

import { useScrapeForm } from "./ScrapeFormContext";

const TASKS = [
    { id: "summary", label: "📝 Summarize Content", prompt: "Summarize the main content of this page in simple terms." },
    { id: "extract", label: "🔍 Extract Key Info", prompt: "Extract the most important facts and figures from this page." },
    { id: "rewrite", label: "✍️ Rewrite for Blog", prompt: "Rewrite the content of this page as a blog post." },
    { id: "faq", label: "❓ Generate FAQ", prompt: "Generate a list of Frequently Asked Questions based on this page." },
    { id: "insights", label: "💡 Key Insights", prompt: "Identify the top 5 key insights or takeaways from this page." },
];

export function NonTechnicalView() {
    const {
        url, setUrl,
        task, setTask,
        useOwnProvider, setUseOwnProvider,
        loading
    } = useScrapeForm();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* URL Input */}
            <div className="space-y-3">
                <label className="block text-lg font-medium text-white">
                    Website URL
                </label>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    disabled={loading}
                    className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-500 text-lg transition-all"
                />
            </div>

            {/* Task Selection */}
            <div className="space-y-3">
                <label className="block text-lg font-medium text-white">
                    What should we do with it?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {TASKS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTask(t.prompt)}
                            disabled={loading}
                            className={`p-4 rounded-xl border text-left transition-all duration-200 ${task === t.prompt
                                ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-900/20"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                                }`}
                        >
                            <div className="font-medium">{t.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* LLM Choice */}
            <div className="space-y-3">
                <label className="block text-lg font-medium text-white">
                    AI Processor
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setUseOwnProvider(false)}
                        disabled={loading}
                        className={`p-4 rounded-xl border text-center transition-all ${!useOwnProvider
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                            }`}
                    >
                        <div className="font-medium">Use Platform Default</div>
                        <div className="text-xs opacity-70 mt-1">Best for most tasks</div>
                    </button>
                    <button
                        onClick={() => setUseOwnProvider(true)}
                        disabled={loading}
                        className={`p-4 rounded-xl border text-center transition-all ${useOwnProvider
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                            }`}
                    >
                        <div className="font-medium">Use My Provider</div>
                        <div className="text-xs opacity-70 mt-1">Bring your own keys</div>
                    </button>
                </div>
            </div>

            {/* Simple Provider Config (Only if "Use My Provider" is selected) */}
            {useOwnProvider && (
                <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Provider</label>
                            <select className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="grok">Grok (xAI)</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="mistral">Mistral AI</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Model</label>
                            <input
                                type="text"
                                placeholder="e.g. gpt-4o"
                                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">API Key</label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
