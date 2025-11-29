"use client";

import Link from "next/link";
import { useState } from "react";
import { Book, Code, Zap, Key, Settings, FileText } from "lucide-react";

const sections = [
    {
        id: "introduction",
        title: "Introduction",
        icon: Book,
        content: `# Welcome to Ultra-Scraper

Ultra-Scraper is a powerful, AI-enhanced web scraping platform designed for both developers and businesses. Our platform combines traditional web scraping with cutting-edge AI technology to extract data from any website reliably and efficiently.

## Key Features

- **Headless Browsers**: Full JavaScript rendering with Playwright
- **AI Extraction**: 7 LLM providers including GPT-4, Claude, Gemini
- **Anti-Blocking**: Automatic IP rotation and fingerprint management
- **Ghost Cursor**: Human-like interactions
- **Captcha Bypass**: Intelligent captcha solving`,
    },
    {
        id: "getting-started",
        title: "Getting Started",
        icon: Zap,
        content: `# Getting Started

## Quick Start

1. **Sign Up**: Create a free account at [Ultra-Scraper](/signup)
2. **Get API Key**: Navigate to your dashboard and generate an API key
3. **Make Your First Request**: Use our simple API to start scraping

## Installation

\`\`\`bash
npm install ultra-scraper-sdk
\`\`\`

## Basic Example

\`\`\`javascript
import { UltraScraper } from 'ultra-scraper-sdk';

const scraper = new UltraScraper({ apiKey: 'your-api-key' });

const result = await scraper.scrape({
  url: 'https://example.com',
  mode: 'simple'
});

console.log(result.data);
\`\`\``,
    },
    {
        id: "api-reference",
        title: "API Reference",
        icon: Code,
        content: `# API Reference

## Authentication

All API requests require an API key in the \`Authorization\` header:

\`\`\`
Authorization: Bearer your-api-key
\`\`\`

## Endpoints

### POST /api/scrape

Scrape a URL and extract data.

**Request Body:**
\`\`\`json
{
  "url": "https://example.com",
  "mode": "simple",
  "workflow": "scraper-llm",
  "aiPrompt": "Extract all prices"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "title": "Example Page",
    "content": "...",
    "leads": { "emails": [], "phones": [] }
  }
}
\`\`\``,
    },
    {
        id: "authentication",
        title: "Authentication",
        icon: Key,
        content: `# Authentication

## API Keys

API keys are used to authenticate your requests. You can manage your API keys in the [Dashboard](/user/dashboard).

### Creating an API Key

1. Log in to your account
2. Navigate to "API Keys" in your dashboard
3. Click "Generate New Key"
4. Copy and store your key securely

### Using Your API Key

Include your API key in the \`Authorization\` header:

\`\`\`bash
curl https://api.ultrascraper.com/scrape \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{"url": "https://example.com"}'
\`\`\`

## Security Best Practices

- Never commit API keys to version control
- Rotate keys regularly
- Use environment variables
- Restrict key permissions`,
    },
    {
        id: "advanced",
        title: "Advanced Usage",
        icon: Settings,
        content: `# Advanced Usage

## Custom LLM Configuration

You can use your own LLM provider:

\`\`\`javascript
const result = await scraper.scrape({
  url: 'https://example.com',
  workflow: 'scraper-llm',
  llmConfig: {
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: 'your-openai-key',
    temperature: 0.7,
    maxTokens: 2000
  }
});
\`\`\`

## Proxy Configuration

Use custom proxies for advanced use cases:

\`\`\`javascript
const result = await scraper.scrape({
  url: 'https://example.com',
  proxy: {
    host: 'proxy.example.com',
    port: 8080,
    auth: { username: 'user', password: 'pass' }
  }
});
\`\`\`

## Rate Limits

Rate limits vary by plan:

- **Demo**: 50-100 requests/month
- **Pro**: Unlimited requests
- **Enterprise**: Custom limits`,
    },
    {
        id: "examples",
        title: "Examples",
        icon: FileText,
        content: `# Examples

## Extract Product Prices

\`\`\`javascript
const result = await scraper.scrape({
  url: 'https://shop.example.com/product',
  mode: 'simple',
  task: 'extract',
  aiPrompt: 'Extract product name, price, and availability'
});
\`\`\`

## Scrape Google Search Results

\`\`\`javascript
const result = await scraper.scrape({
  url: 'https://www.google.com/search?q=web+scraping',
  workflow: 'scraper-only' // No LLM processing
});
\`\`\`

## Generate Content with LLM

\`\`\`javascript
const result = await scraper.scrape({
  workflow: 'llm-only',
  aiPrompt: 'Write a summary of web scraping best practices'
});
\`\`\`

## Batch Scraping

\`\`\`javascript
const urls = ['url1.com', 'url2.com', 'url3.com'];

const results = await Promise.all(
  urls.map(url => scraper.scrape({ url }))
);
\`\`\``,
    },
];

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("introduction");

    const currentSection = sections.find((s) => s.id === activeSection);

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

            {/* Main Content */}
            <div className="pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex gap-8">
                        {/* Sidebar */}
                        <div className="w-64 flex-shrink-0">
                            <div className="sticky top-24 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Documentation</h2>
                                <nav className="space-y-1">
                                    {sections.map((section) => {
                                        const Icon = section.icon;
                                        return (
                                            <button
                                                key={section.id}
                                                onClick={() => setActiveSection(section.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeSection === section.id
                                                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                                                    : "text-gray-700 hover:bg-gray-100"
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{section.title}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 prose prose-purple max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {currentSection?.content}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
