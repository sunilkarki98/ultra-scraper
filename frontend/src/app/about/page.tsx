import Link from "next/link";
import { Target, Users, Zap, Shield } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-6">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="text-3xl">🚀</div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    Ultra-Scraper
                                </span>
                            </Link>
                            <Link
                                href="/docs"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Documentation
                            </Link>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link
                                href="/about"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                About Us
                            </Link>
                            <Link
                                href="/contact"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Contact Us
                            </Link>
                            <Link
                                href="/login"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-6xl font-extrabold text-gray-900 mb-6">
                            About <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Ultra-Scraper</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            We're building the most powerful and developer-friendly web scraping platform.
                            Our mission is to make data extraction accessible to everyone.
                        </p>
                    </div>

                    {/* Mission & Vision */}
                    <div className="grid md:grid-cols-2 gap-12 mb-20">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200">
                            <Target className="w-12 h-12 text-purple-600 mb-4" />
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To democratize web data extraction by providing powerful, reliable, and easy-to-use
                                scraping tools for developers and businesses. We believe everyone should have access
                                to the data they need to make informed decisions.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200">
                            <Zap className="w-12 h-12 text-blue-600 mb-4" />
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To become the go-to platform for web scraping, setting the standard for reliability,
                                performance, and innovation. We envision a world where accessing web data is as simple
                                as making an API call.
                            </p>
                        </div>
                    </div>

                    {/* Values */}
                    <div className="mb-20">
                        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12">
                            Our Values
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 text-center">
                                <Shield className="w-10 h-10 mx-auto text-purple-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Reliability</h3>
                                <p className="text-gray-600">
                                    99.9% uptime guarantee with enterprise-grade infrastructure
                                </p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 text-center">
                                <Users className="w-10 h-10 mx-auto text-blue-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Developer-First</h3>
                                <p className="text-gray-600">
                                    Built by developers, for developers. Clean APIs and excellent docs
                                </p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 text-center">
                                <Zap className="w-10 h-10 mx-auto text-cyan-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
                                <p className="text-gray-600">
                                    Constantly improving with AI, automation, and cutting-edge tech
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-extrabold mb-2">10M+</div>
                                <div className="text-purple-100">Requests Processed</div>
                            </div>
                            <div>
                                <div className="text-4xl font-extrabold mb-2">5,000+</div>
                                <div className="text-purple-100">Active Users</div>
                            </div>
                            <div>
                                <div className="text-4xl font-extrabold mb-2">99.9%</div>
                                <div className="text-purple-100">Uptime</div>
                            </div>
                            <div>
                                <div className="text-4xl font-extrabold mb-2">24/7</div>
                                <div className="text-purple-100">Support</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-400">
                        © 2024 Ultra-Scraper. Built with ❤️ for developers and businesses.
                    </p>
                </div>
            </footer>
        </div>
    );
}
