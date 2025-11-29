"use client";

import { RateLimitConfig } from "../../../components/dashboard/admin/settings/RateLimitConfig";

export default function RateLimitsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Rate Limits</h1>
                <p className="text-gray-500 mt-1">
                    Configure API rate limits for different user tiers
                </p>
            </div>

            <RateLimitConfig />
        </div>
    );
}
