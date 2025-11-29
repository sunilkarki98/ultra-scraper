"use client";

import { useState } from "react";
import { X, Lightbulb } from "lucide-react";

interface GuidanceTooltipProps {
    onDismiss: () => void;
}

export const GuidanceTooltip = ({ onDismiss }: GuidanceTooltipProps) => {
    const examples = [
        "Extract all email addresses from this website",
        "Get the prices and product names of all items",
        "Find all contact information including phone numbers",
        "Extract all blog post titles and dates",
    ];

    return (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-blue-900 mb-2">
                            💡 How to write a good prompt
                        </h4>
                        <p className="text-sm text-blue-800 mb-3">
                            Be specific about what data you want to extract. Here are some examples:
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1.5">
                            {examples.map((example, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-blue-400 mt-0.5">→</span>
                                    <span className="italic">"{example}"</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-blue-400 hover:text-blue-600 transition-colors p-1"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
