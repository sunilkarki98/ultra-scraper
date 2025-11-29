"use client";

import Link from "next/link";
import { useState } from "react";
import { Send, Mail, MessageSquare, Building } from "lucide-react";

export default function ContactPage() {
    const [formType, setFormType] = useState<"contact" | "collaborate">("contact");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        message: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log("Form submitted:", { formType, ...formData });
        alert("Thank you! We'll get back to you soon.");
    };

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
            <div className="pt-32 pb-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                            Get in <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Touch</span>
                        </h1>
                        <p className="text-xl text-gray-600">
                            We'd love to hear from you. Whether you have a question or want to collaborate.
                        </p>
                    </div>

                    {/* Form Type Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/80 backdrop-blur-xl p-1 rounded-xl border border-gray-200 inline-flex">
                            <button
                                onClick={() => setFormType("contact")}
                                className={`px-6 py-2 rounded-lg font-medium transition-all ${formType === "contact"
                                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                <Mail className="w-4 h-4 inline mr-2" />
                                Just Contact
                            </button>
                            <button
                                onClick={() => setFormType("collaborate")}
                                className={`px-6 py-2 rounded-lg font-medium transition-all ${formType === "collaborate"
                                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                <Building className="w-4 h-4 inline mr-2" />
                                Collaborate
                            </button>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 shadow-xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>

                            {formType === "collaborate" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        placeholder="Acme Inc."
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {formType === "collaborate" ? "Collaboration Proposal" : "Message"}
                                </label>
                                <textarea
                                    required
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                                    placeholder={
                                        formType === "collaborate"
                                            ? "Tell us about your collaboration idea..."
                                            : "How can we help you?"
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-xl hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
                            >
                                <Send className="w-5 h-5" />
                                Send {formType === "collaborate" ? "Proposal" : "Message"}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-12 grid md:grid-cols-3 gap-6">
                        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 text-center">
                            <Mail className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                            <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                            <p className="text-gray-600 text-sm">hello@ultrascraper.com</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 text-center">
                            <MessageSquare className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                            <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                            <p className="text-gray-600 text-sm">Available 9am-5pm EST</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200 text-center">
                            <Building className="w-8 h-8 mx-auto mb-3 text-cyan-600" />
                            <h3 className="font-semibold text-gray-900 mb-1">Enterprise</h3>
                            <p className="text-gray-600 text-sm">enterprise@ultrascraper.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
