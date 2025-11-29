"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/user/useAuth";
import { userService } from "../../../lib/api/services/user.service";
import toast from "react-hot-toast";
import { Lightbulb, CheckCircle2, XCircle } from "lucide-react";

export const PromptScraper = () => {
    const [prompt, setPrompt] = useState("");
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    // Provider Configuration
    const [provider, setProvider] = useState<"default" | "llm" | "custom">("default");
    const [llmProvider, setLlmProvider] = useState<"openai" | "anthropic" | "gemini" | "cohere" | "mistral" | "groq" | "together" | "huggingface" | "perplexity">("openai");
    const [llmModel, setLlmModel] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [webhookUrl, setWebhookUrl] = useState("");

    // Connection status
    const [llmConnected, setLlmConnected] = useState(false);
    const [webhookConnected, setWebhookConnected] = useState(false);

    const { token } = useAuth();

    const llmModels = {
        openai: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
        anthropic: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
        gemini: ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"],
        cohere: ["command-r-plus", "command-r", "command"],
        mistral: ["mistral-large", "mistral-medium", "mistral-small"],
        groq: ["llama-3.1-70b", "llama-3.1-8b", "mixtral-8x7b"],
        together: ["meta-llama/Llama-3-70b", "mistralai/Mixtral-8x7B", "NousResearch/Nous-Hermes-2"],
        huggingface: ["meta-llama/Meta-Llama-3-70B", "mistralai/Mistral-7B", "tiiuae/falcon-40b"],
        perplexity: ["llama-3.1-sonar-large", "llama-3.1-sonar-small", "llama-3.1-sonar-huge"],
    };

    // Test LLM connection
    const testLlmConnection = async () => {
        if (!apiKey.trim()) {
            setLlmConnected(false);
            return;
        }

        try {
            await userService.updateLlmKey(llmProvider, apiKey);
            setLlmConnected(true);
            toast.success("LLM connected successfully!");
        } catch (error: any) {
            setLlmConnected(false);
            toast.error("Failed to connect to LLM");
        }
    };

    // Test webhook connection
    const testWebhookConnection = async () => {
        if (!webhookUrl.trim()) {
            setWebhookConnected(false);
            return;
        }

        try {
            // Validate webhook URL format
            new URL(webhookUrl);
            setWebhookConnected(true);
            toast.success("Webhook URL validated!");
        } catch (error: any) {
            setWebhookConnected(false);
            toast.error("Invalid webhook URL");
        }
    };

    useEffect(() => {
        if (provider === "llm" && apiKey) {
            const timer = setTimeout(testLlmConnection, 500);
            return () => clearTimeout(timer);
        }
    }, [apiKey, llmProvider]);

    useEffect(() => {
        if (provider === "custom" && webhookUrl) {
            const timer = setTimeout(testWebhookConnection, 500);
            return () => clearTimeout(timer);
        }
    }, [webhookUrl]);

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }

        setLoading(true);
        try {
            const options: any = {
                mode: "simple",
                workflow: "scraper-llm",
                aiPrompt: prompt,
            };

            const targetUrl = url.trim() || "https://example.com";

            const data = await userService.scrape(targetUrl, options);
            if (data.success) {
                toast.success(`Scrape started! Job ID: ${data.jobId}`);
                setPrompt("");
                setUrl("");
            }
        } catch (error: any) {
            toast.error(error.message || "Scraping failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8">
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        AI Prompt Scraping
                    </h2>
                    <p className="text-purple-100 text-lg">
                        Describe what you want to extract in natural language
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Provider Configuration */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-6 border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">AI Provider Configuration</h3>
                        </div>

                        {/* Provider Selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Select Provider
                            </label>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value as any)}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900 shadow-sm"
                            >
                                <option value="default">Default (SaaS Managed)</option>
                                <option value="llm">My LLM Provider</option>
                                <option value="custom">Custom Webhook</option>
                            </select>
                        </div>

                        {/* LLM Provider Configuration */}
                        {provider === "llm" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            LLM Provider
                                        </label>
                                        <select
                                            value={llmProvider}
                                            onChange={(e) => {
                                                setLlmProvider(e.target.value as any);
                                                setLlmModel(llmModels[e.target.value as keyof typeof llmModels][0]);
                                            }}
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900"
                                        >
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic</option>
                                            <option value="gemini">Google Gemini</option>
                                            <option value="cohere">Cohere</option>
                                            <option value="mistral">Mistral AI</option>
                                            <option value="groq">Groq</option>
                                            <option value="together">Together AI</option>
                                            <option value="huggingface">Hugging Face</option>
                                            <option value="perplexity">Perplexity AI</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Model
                                        </label>
                                        <select
                                            value={llmModel}
                                            onChange={(e) => setLlmModel(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900"
                                        >
                                            {llmModels[llmProvider].map((model) => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        API Key
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        />
                                        <div className="flex items-center px-4 py-3 bg-white border border-slate-300 rounded-lg">
                                            {apiKey && llmConnected ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : apiKey && !llmConnected ? (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {apiKey && llmConnected ? "✓ Connected" : apiKey && !llmConnected ? "✗ Failed to connect" : "Enter your API key to connect"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Custom Webhook Configuration */}
                        {provider === "custom" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Webhook URL
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={webhookUrl}
                                            onChange={(e) => setWebhookUrl(e.target.value)}
                                            placeholder="https://your-api.com/webhook"
                                            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        />
                                        <div className="flex items-center px-4 py-3 bg-white border border-slate-300 rounded-lg">
                                            {webhookUrl && webhookConnected ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : webhookUrl && !webhookConnected ? (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {webhookUrl && webhookConnected ? "✓ Valid URL" : webhookUrl && !webhookConnected ? "✗ Invalid URL" : "Enter your webhook endpoint URL"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tips Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex gap-3">
                            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 text-sm mb-1">
                                    💡 Pro Tips
                                </h4>
                                <ul className="text-sm text-amber-800 space-y-1">
                                    <li>• Be specific about what data you want to extract</li>
                                    <li>• Include examples in your prompt for better results</li>
                                    <li>• Mention the data format you need (table, list, etc.)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2 tracking-tight">
                            Your Extraction Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Example: Extract all product names, prices, and ratings from this e-commerce page and format them as a table"
                            className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-900 placeholder:text-slate-400 leading-relaxed"
                            rows={6}
                        />
                    </div>

                    {/* URL Input */}
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2 tracking-tight">
                            Target URL <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Leave empty if you've included the URL in your prompt
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Start AI Scraping
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
