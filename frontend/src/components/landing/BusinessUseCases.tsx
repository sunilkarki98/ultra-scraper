import React from "react";
import { Search, TrendingUp, BarChart3, Globe } from "lucide-react";

export const BusinessUseCases = () => {
    const cases = [
        {
            title: "Lead Generation",
            description:
                "Automatically find and extract contact details from business directories, social media, and listing sites to fuel your sales pipeline.",
            icon: <Search className="w-6 h-6 text-white" />,
            color: "from-blue-500 to-cyan-500",
        },
        {
            title: "Competitor Monitoring",
            description:
                "Track competitor pricing, product launches, and marketing strategies in real-time to stay ahead of the market.",
            icon: <TrendingUp className="w-6 h-6 text-white" />,
            color: "from-purple-500 to-pink-500",
        },
        {
            title: "Price Tracking",
            description:
                "Monitor e-commerce prices across thousands of products to optimize your pricing strategy and maximize margins.",
            icon: <BarChart3 className="w-6 h-6 text-white" />,
            color: "from-orange-500 to-red-500",
        },
        {
            title: "Market Research",
            description:
                "Aggregate data from news sites, forums, and reviews to understand customer sentiment and market trends.",
            icon: <Globe className="w-6 h-6 text-white" />,
            color: "from-green-500 to-emerald-500",
        },
    ];

    return (
        <div className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Built for Business Growth
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Turn the entire internet into your database. No coding required.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {cases.map((item) => (
                        <div
                            key={item.title}
                            className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform`}
                            >
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {item.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
