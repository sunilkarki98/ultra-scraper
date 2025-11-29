import { useState } from "react";
import { useAuth } from "../../../hooks/user/useAuth";
import { Search, Globe, Lock, Key, AlertCircle, CheckCircle } from "lucide-react";

export function SocialScrapeForm() {
    const { userData } = useAuth();
    const [url, setUrl] = useState("");
    const [mode, setMode] = useState<"scrape" | "api">("scrape");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // API Credentials
    const [apiCredentials, setApiCredentials] = useState({
        clientId: "",
        clientSecret: "",
        bearerToken: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const token = localStorage.getItem("token");
            const options: any = { mode };

            if (mode === "api") {
                if (url.includes("reddit")) {
                    options.client_id = apiCredentials.clientId;
                    options.client_secret = apiCredentials.clientSecret;
                } else if (url.includes("twitter") || url.includes("x.com")) {
                    options.bearer_token = apiCredentials.bearerToken;
                }
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    url,
                    options
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to start scrape job");
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-100 rounded-lg">
                        <Globe className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Social Media Scraper</h2>
                        <p className="text-sm text-slate-500">
                            Extract data from Twitter, Reddit, LinkedIn, Facebook, Instagram, TikTok, and Telegram.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* URL Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Social Media URL
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="url"
                                required
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://twitter.com/user/status/..."
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setMode("scrape")}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${mode === "scrape"
                                ? "border-pink-500 bg-pink-50"
                                : "border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className={`w-5 h-5 ${mode === "scrape" ? "text-pink-600" : "text-slate-400"}`} />
                                <span className={`font-medium ${mode === "scrape" ? "text-pink-900" : "text-slate-700"}`}>
                                    Public Scraper
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Extract public data using headless browsers. Best for casual use.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode("api")}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${mode === "api"
                                ? "border-blue-500 bg-blue-50"
                                : "border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Key className={`w-5 h-5 ${mode === "api" ? "text-blue-600" : "text-slate-400"}`} />
                                <span className={`font-medium ${mode === "api" ? "text-blue-900" : "text-slate-700"}`}>
                                    Official API
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Use your own API keys for 100% legal compliance and reliability.
                            </p>
                        </button>
                    </div>

                    {/* API Credentials Inputs */}
                    {mode === "api" && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                <Lock className="w-4 h-4" /> API Credentials
                            </h3>

                            {url.includes("reddit") && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Client ID</label>
                                        <input
                                            type="text"
                                            value={apiCredentials.clientId}
                                            onChange={(e) => setApiCredentials({ ...apiCredentials, clientId: e.target.value })}
                                            className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                                            placeholder="Reddit Client ID"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Client Secret</label>
                                        <input
                                            type="password"
                                            value={apiCredentials.clientSecret}
                                            onChange={(e) => setApiCredentials({ ...apiCredentials, clientSecret: e.target.value })}
                                            className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                                            placeholder="Reddit Client Secret"
                                        />
                                    </div>
                                </>
                            )}

                            {(url.includes("twitter") || url.includes("x.com")) && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Bearer Token</label>
                                    <input
                                        type="password"
                                        value={apiCredentials.bearerToken}
                                        onChange={(e) => setApiCredentials({ ...apiCredentials, bearerToken: e.target.value })}
                                        className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                                        placeholder="Twitter Bearer Token"
                                    />
                                </div>
                            )}

                            {!url.includes("reddit") && !url.includes("twitter") && !url.includes("x.com") && (
                                <p className="text-sm text-amber-600">
                                    API mode is currently only supported for Reddit and Twitter.
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Starting Scraper...
                            </>
                        ) : (
                            <>Start Scraping</>
                        )}
                    </button>
                </form>
            </div>

            {/* Results Area */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium">Error</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {result && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium">Job Started Successfully</h3>
                        <p className="text-sm">Job ID: {result.id}</p>
                        <p className="text-xs mt-1 text-green-600">Check the "Jobs" tab for progress.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
