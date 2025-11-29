import { useState } from "react";
import { useAuth } from "../../../hooks/user/useAuth";
import { Search, MapPin, Building2, Phone, Globe, AlertCircle, CheckCircle } from "lucide-react";

export function BusinessSearchForm() {
    const { userData } = useAuth();
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [source, setSource] = useState<"osm" | "google">("osm");
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/search`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query,
                    location,
                    source,
                    apiKey: source === "google" ? apiKey : undefined
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to search businesses");
            }

            setResults(data.data);
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
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Business Search</h2>
                        <p className="text-sm text-slate-500">
                            Find business leads (Name, Address, Phone) legally using Open Data or Official APIs.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Query Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Business Type
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="e.g. Restaurants, Hotels, Hospitals"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Location Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Kathmandu, New York"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Source Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setSource("osm")}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${source === "osm"
                                    ? "border-emerald-500 bg-emerald-50"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className={`w-5 h-5 ${source === "osm" ? "text-emerald-600" : "text-slate-400"}`} />
                                <span className={`font-medium ${source === "osm" ? "text-emerald-900" : "text-slate-700"}`}>
                                    OpenStreetMap (Free)
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                100% Free & Legal Open Data. Best for addresses and names.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSource("google")}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${source === "google"
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Search className={`w-5 h-5 ${source === "google" ? "text-blue-600" : "text-slate-400"}`} />
                                <span className={`font-medium ${source === "google" ? "text-blue-900" : "text-slate-700"}`}>
                                    Google Places API
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Official Google Data. Requires API Key. Best for phone numbers.
                            </p>
                        </button>
                    </div>

                    {/* API Key Input for Google */}
                    {source === "google" && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Google Places API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                                placeholder="AIzaSy..."
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>Find Businesses</>
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

            {results.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800">Results ({results.length})</h3>
                        <button className="text-sm text-emerald-600 font-medium hover:underline">Export CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Address</th>
                                    <th className="px-6 py-3">Phone</th>
                                    <th className="px-6 py-3">Website</th>
                                    <th className="px-6 py-3">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((biz, i) => (
                                    <tr key={i} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{biz.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{biz.address || "-"}</td>
                                        <td className="px-6 py-4 text-slate-600">{biz.phone || "-"}</td>
                                        <td className="px-6 py-4 text-blue-600">
                                            {biz.website ? (
                                                <a href={biz.website} target="_blank" rel="noopener noreferrer" className="hover:underline">Link</a>
                                            ) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{biz.source}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
