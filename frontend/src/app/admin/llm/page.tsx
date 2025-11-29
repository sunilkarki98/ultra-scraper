"use client";

import { LLMConfig } from "../../../components/dashboard/admin/settings/LLMConfig";

export default function LLMPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">LLM Configuration</h1>
                <p className="text-gray-500 mt-1">
                    Manage platform-wide API keys for AI language models
                </p>
            </div>

            <LLMConfig />
        </div>
    );
}
