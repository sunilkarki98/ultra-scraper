'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/user/useAuth';
import { useRouter } from 'next/navigation';

interface Lead {
    name: string;
    url: string;
    emails: string[];
    phones: string[];
    socials: string[];
}

interface AgentJob {
    id: string;
    status: 'running' | 'completed' | 'failed';
    logs: string[];
    leads: Lead[];
    progress: number;
}

export default function AgentPage() {
    const { token } = useAuth();
    const [query, setQuery] = useState('');
    const [city, setCity] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);
    const [job, setJob] = useState<AgentJob | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [job?.logs]);

    // Poll for job status
    useEffect(() => {
        if (!jobId || !token) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent/job/${jobId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setJob(data);

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(interval);
                    setIsLoading(false);
                }
            } catch (e) {
                console.error('Polling error', e);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [jobId, token]);

    const startHunt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setIsLoading(true);
        setJob(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent/hunt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ query, city })
            });
            const data = await res.json();
            setJobId(data.jobId);
        } catch (e) {
            console.error('Failed to start agent', e);
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
                    AI Lead Hunter
                </h1>
                <p className="text-gray-400 text-lg">
                    Describe your ideal customer, and I'll find them for you.
                </p>
            </div>

            {/* Search Form */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl">
                <form onSubmit={startHunt} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Target Business</label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g. Coffee Shops, Plumbers, Real Estate Agents"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="md:w-1/3">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Location (Optional)</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. New York, London"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 ${isLoading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:shadow-blue-500/25'
                                }`}
                        >
                            {isLoading ? 'Hunting...' : 'Start Hunt 🚀'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Terminal / Logs */}
                <div className="bg-black border border-gray-800 rounded-2xl p-6 font-mono text-sm h-[500px] overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-gray-500">agent-terminal — bash</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 text-green-400">
                        {!job && <div className="text-gray-600">Waiting for command...</div>}
                        {job?.logs.map((log, i) => (
                            <div key={i} className="break-words">
                                <span className="text-blue-500 mr-2">➜</span>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                    {job && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{job.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${job.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Table */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-[500px] flex flex-col backdrop-blur-xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>🎯 Found Leads</span>
                        {job?.leads.length ? (
                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                                {job.leads.length}
                            </span>
                        ) : null}
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {!job?.leads.length ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                                <div className="text-4xl">🕵️</div>
                                <p>No leads found yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {job.leads.map((lead, i) => (
                                    <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white truncate">{lead.name}</h4>
                                            <a href={lead.url} target="_blank" className="text-xs text-blue-400 hover:text-blue-300">
                                                Visit ↗
                                            </a>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            {lead.emails.length > 0 && (
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <span className="text-xs uppercase text-gray-500 w-12">Email</span>
                                                    <span className="text-white select-all">{lead.emails[0]}</span>
                                                </div>
                                            )}
                                            {lead.phones.length > 0 && (
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <span className="text-xs uppercase text-gray-500 w-12">Phone</span>
                                                    <span className="text-white select-all">{lead.phones[0]}</span>
                                                </div>
                                            )}
                                            {lead.socials.length > 0 && (
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <span className="text-xs uppercase text-gray-500 w-12">Social</span>
                                                    <div className="flex gap-2">
                                                        {lead.socials.map((s, j) => (
                                                            <a key={j} href={s} target="_blank" className="text-blue-400 hover:text-blue-300 text-xs">
                                                                Link {j + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
