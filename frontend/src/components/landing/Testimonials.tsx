import React from "react";

export const Testimonials = () => {
    const testimonials = [
        {
            quote:
                "We used to spend 20 hours a week manually copying prices. Now it happens automatically while we sleep.",
            author: "Sarah Chen",
            role: "Operations Director at RetailFlow",
            avatar: "SC",
        },
        {
            quote:
                "The lead generation capabilities are incredible. We doubled our sales pipeline in just one month.",
            author: "Michael Ross",
            role: "Founder at GrowthLabs",
            avatar: "MR",
        },
        {
            quote:
                "I'm not technical at all, but I was able to set up a competitor monitor in 5 minutes. Super intuitive.",
            author: "David Miller",
            role: "Marketing Manager at BrandWatch",
            avatar: "DM",
        },
    ];

    return (
        <div className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Trusted by Growing Businesses
                    </h2>
                    <p className="text-xl text-gray-600">
                        Join thousands of companies automating their data collection
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div
                            key={i}
                            className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                    {t.avatar}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{t.author}</div>
                                    <div className="text-sm text-gray-500">{t.role}</div>
                                </div>
                            </div>
                            <p className="text-gray-600 italic leading-relaxed">"{t.quote}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
