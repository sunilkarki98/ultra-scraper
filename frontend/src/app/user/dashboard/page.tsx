"use client";

import { useState } from "react";
import { UrlScraper } from "../../../components/dashboard/user/UrlScraper";
import { PromptScraper } from "../../../components/dashboard/user/PromptScraper";
import { SocialScrapeForm } from "../../../components/dashboard/user/SocialScrapeForm";
import { BusinessSearchForm } from "../../../components/dashboard/user/BusinessSearchForm";
import { Settings } from "../../../components/dashboard/user/Settings";
import { Settings as SettingsIcon, Link as LinkIcon, Bot, Globe, Building2 } from "lucide-react";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<"url" | "prompt" | "social" | "business" | "settings">("url");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Simple Header Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🚀</div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ultra-Scraper
              </span>
            </div>

            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab("url")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "url"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <LinkIcon className="w-4 h-4" />
                URL Scrape
              </button>
              <button
                onClick={() => setActiveTab("prompt")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "prompt"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <Bot className="w-4 h-4" />
                Prompt Scrape
              </button>
              <button
                onClick={() => setActiveTab("social")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "social"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <Globe className="w-4 h-4" />
                Social Media
              </button>
              <button
                onClick={() => setActiveTab("business")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "business"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <Building2 className="w-4 h-4" />
                Business Search
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "settings"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === "url" && <UrlScraper />}
        {activeTab === "prompt" && <PromptScraper />}
        {activeTab === "social" && <SocialScrapeForm />}
        {activeTab === "business" && <BusinessSearchForm />}
        {activeTab === "settings" && <Settings />}
      </main>
    </div>
  );
}
