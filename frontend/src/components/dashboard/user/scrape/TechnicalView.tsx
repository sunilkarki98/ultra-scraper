"use client";

import { useScrapeForm, OutputFormat } from "./ScrapeFormContext";
import { Settings2, Database, Bot, FileJson } from "lucide-react";

export function TechnicalView() {
    const {
        url, setUrl,
        workflow, setWorkflow,
        llmConfig, setLlmConfig,
        outputFormat, setOutputFormat,
        customPrompt, setCustomPrompt,
        loading
    } = useScrapeForm();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Workflow Selection */}
            <div className="grid grid-cols-3 gap-4">
                <button
                    onClick={() => setWorkflow("scraper-only")}
                    className={`p-4 rounded-xl border text-left transition-all ${workflow === "scraper-only"
                        ? "bg-purple-600/20 border-purple-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                        }`}
                >
                    <Database className="w-6 h-6 mb-2" />
                    <div className="font-medium">Scraper Only</div>
                    <div className="text-xs opacity-70 mt-1">Raw HTML/Text</div>
                </button>
                <button
                    onClick={() => setWorkflow("scraper-llm")}
                    className={`p-4 rounded-xl border text-left transition-all ${workflow === "scraper-llm"
                        ? "bg-purple-600/20 border-purple-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                        }`}
                >
                    <Bot className="w-6 h-6 mb-2" />
                    <div className="font-medium">Scraper + LLM</div>
                    <div className="text-xs opacity-70 mt-1">Process Content</div>
                </button>
                <button
                    onClick={() => setWorkflow("llm-only")}
                    className={`p-4 rounded-xl border text-left transition-all ${workflow === "llm-only"
                        ? "bg-purple-600/20 border-purple-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                        }`}
                >
                    <Settings2 className="w-6 h-6 mb-2" />
                    <div className="font-medium">LLM Only</div>
                    <div className="text-xs opacity-70 mt-1">Direct Prompt</div>
                </button>
            </div>

            {/* URL Input (Hidden for LLM Only) */}
            {workflow !== "llm-only" && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">Target URL</label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white font-mono text-sm"
                    />
                </div>
            )}

            {/* LLM Configuration (Hidden for Scraper Only) */}
            {workflow !== "scraper-only" && (
                <div className="space-y-6 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-purple-400" />
                        LLM Configuration
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Provider</label>
                            <select
                                value={llmConfig.provider}
                                onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value })}
                                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="grok">Grok (xAI)</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="mistral">Mistral AI</option>
                                <option value="custom">Custom Endpoint</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Model</label>
                            <input
                                type="text"
                                value={llmConfig.model}
                                onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">API Key</label>
                        <input
                            type="password"
                            value={llmConfig.apiKey || ""}
                            onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                            placeholder="sk-..."
                            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                        />
                    </div>

                    {llmConfig.provider === "custom" && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Endpoint URL</label>
                            <input
                                type="url"
                                value={llmConfig.endpoint || ""}
                                onChange={(e) => setLlmConfig({ ...llmConfig, endpoint: e.target.value })}
                                placeholder="https://api.example.com/v1/chat/completions"
                                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Temperature: {llmConfig.temperature}</label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={llmConfig.temperature || 0.7}
                                onChange={(e) => setLlmConfig({ ...llmConfig, temperature: parseFloat(e.target.value) })}
                                className="w-full accent-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Max Tokens</label>
                            <input
                                type="number"
                                value={llmConfig.maxTokens || 2000}
                                onChange={(e) => setLlmConfig({ ...llmConfig, maxTokens: parseInt(e.target.value) })}
                                className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">System Prompt Override</label>
                        <textarea
                            value={llmConfig.systemPrompt || ""}
                            onChange={(e) => setLlmConfig({ ...llmConfig, systemPrompt: e.target.value })}
                            rows={3}
                            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                            placeholder="You are a helpful assistant..."
                        />
                    </div>
                </div>
            )}

            {/* Output Configuration */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Output Format</label>
                <div className="flex gap-4">
                    {(["text", "json", "markdown", "xml"] as OutputFormat[]).map((fmt) => (
                        <button
                            key={fmt}
                            onClick={() => setOutputFormat(fmt)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${outputFormat === fmt
                                ? "bg-purple-600/20 border-purple-500 text-white"
                                : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                                }`}
                        >
                            {fmt.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Prompt (for Scraper+LLM or LLM Only) */}
            {workflow !== "scraper-only" && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">User Prompt</label>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={5}
                        className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-500 font-mono"
                        placeholder={workflow === "scraper-llm" ? "Extract the following data..." : "Write a story about..."}
                    />
                </div>
            )}
        </div>
    );
}
