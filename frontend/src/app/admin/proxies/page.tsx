"use client";

import { ProxyManager } from "../../../components/dashboard/admin/settings/ProxyManager";

export default function ProxiesPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Proxy Management</h1>
                <p className="text-gray-500 mt-1">
                    Configure and monitor proxy servers for web scraping
                </p>
            </div>

            <ProxyManager />
        </div>
    );
}
