import React from "react";

export const FAQ = () => {
    const faqs = [
        {
            question: "How does the free trial work?",
            answer:
                "You get 100 free requests to test our API. No credit card required. You can upgrade to a paid plan at any time.",
        },
        {
            question: "Do you handle captchas and proxies?",
            answer:
                "Yes! We automatically handle IP rotation, user-agents, and captcha solving so you don't have to worry about getting blocked.",
        },
        {
            question: "Can I scrape dynamic JavaScript websites?",
            answer:
                "Absolutely. Our Headless Browser mode renders full JavaScript, allowing you to scrape SPAs and dynamic content easily.",
        },
        {
            question: "What happens if a request fails?",
            answer:
                "We only charge for successful requests. If a request fails, we automatically retry it. You won't be billed for failed attempts.",
        },
    ];

    return (
        <div className="py-20 bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-xl text-gray-600">
                        Everything you need to know about Ultra-Scraper
                    </p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="bg-slate-50 rounded-xl p-6 hover:bg-slate-100 transition-colors"
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {faq.question}
                            </h3>
                            <p className="text-gray-600">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
