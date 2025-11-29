import React from "react";
import Link from "next/link";
import { Terminal, Code2, BookOpen } from "lucide-react";

export const DeveloperCorner = () => {
    return (
        <div className="py-24 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500 blur-[120px] rounded-full" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="md:w-1/2">
                        <div className="flex items-center gap-2 mb-4 text-purple-400 font-mono text-sm">
                            <Terminal className="w-4 h-4" />
                            <span>For Developers</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Build on top of our robust API
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Need more control? Integrate our scraping engine directly into your
                            application with a few lines of code. Full headless browser support,
                            proxy management, and CAPTCHA solving included.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/docs"
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-3 rounded-lg transition-all font-medium"
                            >
                                <BookOpen className="w-4 h-4" />
                                Read Documentation
                            </Link>
                            <Link
                                href="/signup?plan=technical-demo"
                                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 px-6 py-3 rounded-lg transition-all font-medium"
                            >
                                <Code2 className="w-4 h-4" />
                                Get API Key
                            </Link>
                        </div>
                    </div>

                    <div className="md:w-1/2 w-full">
                        <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-2xl font-mono text-sm overflow-hidden">
                            <div className="flex gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="text-gray-400">
                                    <span className="text-purple-400">const</span> response ={" "}
                                    <span className="text-purple-400">await</span> scraper.
                                    <span className="text-blue-400">extract</span>({"{ "}
                                </div>
                                <div className="pl-4 text-green-400">
                                    url: <span className="text-orange-300">"https://example.com"</span>,
                                </div>
                                <div className="pl-4 text-green-400">
                                    render: <span className="text-blue-400">true</span>,
                                </div>
                                <div className="pl-4 text-green-400">
                                    ai_extract: <span className="text-blue-400">true</span>
                                </div>
                                <div className="text-gray-400">{"});"}</div>
                                <div className="text-gray-500 mt-4">// Returns structured JSON data</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
