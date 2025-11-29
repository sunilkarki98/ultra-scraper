"use client";

import Link from "next/link";
import { Check } from "lucide-react";

interface PricingCardProps {
    title: string;
    subtitle: string;
    price: string;
    period?: string;
    features: string[];
    cta: string;
    ctaLink: string;
    highlighted?: boolean;
    badge?: string;
}

export function PricingCard({
    title,
    subtitle,
    price,
    period,
    features,
    cta,
    ctaLink,
    highlighted = false,
    badge,
}: PricingCardProps) {
    return (
        <div
            className={`relative p-6 rounded-2xl transition-all duration-300 ${highlighted
                ? "bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-cyan-600/10 border-2 border-purple-500 shadow-2xl shadow-purple-500/20 scale-105"
                : "bg-white/80 backdrop-blur-xl border border-gray-200 hover:border-purple-300 hover:shadow-xl"
                }`}
        >
            {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold">
                        {badge}
                    </span>
                </div>
            )}

            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-600 text-xs">{subtitle}</p>
            </div>

            <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {price}
                    </span>
                    {period && <span className="text-gray-600 text-base">/{period}</span>}
                </div>
            </div>

            <ul className="space-y-2 mb-6">
                {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mt-0.5">
                            <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-gray-700 text-xs leading-relaxed">{feature}</span>
                    </li>
                ))}
            </ul>

            <Link
                href={ctaLink}
                className={`block w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${highlighted
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
            >
                {cta}
            </Link>
        </div>
    );
}
