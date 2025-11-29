import React from "react";

export const HowItWorks = () => {
    const steps = [
        {
            number: "01",
            title: "Connect",
            description:
                "Create your account and access the dashboard. No installation or technical setup required.",
        },
        {
            number: "02",
            title: "Configure",
            description:
                "Enter the website URL you want to scrape. Select the data points you need using our visual selector.",
        },
        {
            number: "03",
            title: "Export",
            description:
                "Download your data instantly as a CSV, Excel file, or sync it directly to Google Sheets.",
        },
    ];

    return (
        <div className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Three Steps to Data
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Stop wasting time on manual copy-pasting. Get the data you need in minutes.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop only) */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-200 -z-10" />

                    {steps.map((step) => (
                        <div key={step.number} className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-20 h-20 mx-auto bg-white border-4 border-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600 mb-6 shadow-sm z-10 relative">
                                {step.number}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                                {step.title}
                            </h3>
                            <p className="text-gray-600 text-center leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
