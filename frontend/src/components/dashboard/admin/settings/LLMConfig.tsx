"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Key, Edit2 } from "lucide-react";
import { adminService } from "../../../../lib/api/services/admin.service";
import toast from "react-hot-toast";

interface LLMConfig {
    id: string;
    provider: "openai" | "anthropic" | "google" | "grok" | "deepseek" | "mistral";
    model: string;
    apiKey: string;
    createdAt: number;
}

const PROVIDER_OPTIONS = [
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "google", label: "Google Gemini" },
    { value: "grok", label: "Grok (xAI)" },
    { value: "deepseek", label: "DeepSeek" },
    { value: "mistral", label: "Mistral AI" },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
    openai: [
        { value: "gpt-4o", label: "GPT-4o" },
        { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    anthropic: [
        { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
        { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
        { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
    ],
    google: [
        { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
        { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
    grok: [
        { value: "grok-beta", label: "Grok Beta" },
        { value: "grok-vision-beta", label: "Grok Vision Beta" },
    ],
    deepseek: [
        { value: "deepseek-chat", label: "DeepSeek Chat" },
        { value: "deepseek-coder", label: "DeepSeek Coder" },
    ],
    mistral: [
        { value: "mistral-large-latest", label: "Mistral Large" },
        { value: "mistral-medium", label: "Mistral Medium" },
        { value: "mistral-small", label: "Mistral Small" },
    ],
};

export function LLMConfig() {
    const [configs, setConfigs] = useState<LLMConfig[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        provider: "openai" as "openai" | "anthropic" | "google" | "grok" | "deepseek" | "mistral",
        model: "gpt-4o",
        apiKey: "",
    });
    const [loading, setLoading] = useState(false);

    const fetchConfigs = async () => {
        try {
            const data = await adminService.getLlmConfigs();
            if (data.success) {
                setConfigs(data.configs);
            } else {
                toast.error("Failed to fetch LLM configurations");
            }
        } catch {
            toast.error("Network error: Unable to fetch LLM configurations");
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleProviderChange = (provider: "openai" | "anthropic" | "google" | "grok" | "deepseek" | "mistral") => {
        setFormData({
            provider,
            model: MODEL_OPTIONS[provider][0].value,
            apiKey: formData.apiKey,
        });
    };

    const handleSubmit = async () => {
        if (!formData.apiKey) {
            toast.error("API key is required");
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await adminService.updateLlmConfig(editingId, formData);
                toast.success("LLM configuration updated!");
            } else {
                await adminService.createLlmConfig(formData);
                toast.success("LLM configuration added!");
            }

            setFormData({ provider: "openai", model: "gpt-4o", apiKey: "" });
            setShowForm(false);
            setEditingId(null);
            fetchConfigs();
        } catch (error: any) {
            toast.error(error.message || "Failed to save configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Temporarily removed: if (!confirm("Are you sure you want to delete this configuration?")) return;

        try {
            await adminService.deleteLlmConfig(id);
            toast.success("Configuration deleted!");
            fetchConfigs();
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete configuration");
        }
    };

    const handleEdit = (config: LLMConfig) => {
        setFormData({
            provider: config.provider,
            model: config.model,
            apiKey: "",
        });
        setEditingId(config.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setFormData({ provider: "openai", model: "gpt-4o", apiKey: "" });
        setShowForm(false);
        setEditingId(null);
    };

    const getProviderLabel = (provider: string) => {
        return PROVIDER_OPTIONS.find((p) => p.value === provider)?.label || provider;
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">LLM Configurations</h3>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Configuration
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">
                        {editingId ? "Edit Configuration" : "Add Configuration"}
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Provider
                            </label>
                            <select
                                value={formData.provider}
                                onChange={(e) =>
                                    handleProviderChange(
                                        e.target.value as "openai" | "anthropic" | "google" | "grok" | "deepseek" | "mistral"
                                    )
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {PROVIDER_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Model
                            </label>
                            <select
                                value={formData.model}
                                onChange={(e) =>
                                    setFormData({ ...formData, model: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {MODEL_OPTIONS[formData.provider].map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                API Key
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={formData.apiKey}
                                    onChange={(e) =>
                                        setFormData({ ...formData, apiKey: e.target.value })
                                    }
                                    placeholder={editingId ? "Leave blank to keep existing" : "Enter API key"}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? "Saving..." : editingId ? "Update" : "Add"}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Configurations List */}
            <div className="space-y-3">
                {configs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        No LLM configurations. Add one to get started.
                    </p>
                ) : (
                    configs.map((config) => (
                        <div
                            key={config.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900">
                                        {getProviderLabel(config.provider)}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">{config.model}</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    API Key: {config.apiKey || "Not set"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(config)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(config.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
