"use client";

import { useScrapeForm } from "./ScrapeFormContext";
import { Sparkles, Code2 } from "lucide-react";

export function ModeToggle() {
    const { mode, setMode, loading } = useScrapeForm();

    return (
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700 mb-8">
            <button
                onClick={() => setMode("simple")}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${mode === "simple"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
            >
                <Sparkles className="w-4 h-4" />
                Non-Technical
            </button>
            <button
                onClick={() => setMode("advanced")}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${mode === "advanced"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
            >
                <Code2 className="w-4 h-4" />
                Technical
            </button>
        </div>
    );
}
