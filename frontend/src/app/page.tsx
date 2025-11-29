import Link from "next/link";
import { PricingCard } from "../components/landing/PricingCard";
import { Testimonials } from "../components/landing/Testimonials";
import { HowItWorks } from "../components/landing/HowItWorks";
import { BusinessUseCases } from "../components/landing/BusinessUseCases";
import { DeveloperCorner } from "../components/landing/DeveloperCorner";
import { FAQ } from "../components/landing/FAQ";

const businessPlans = [
  {
    title: "Free Starter",
    subtitle: "For Individuals & Testing",
    price: "Free",
    features: [
      "50 scrapes/month",
      "Simple Mode access",
      "Export to CSV/Excel",
      "Email support",
      "Basic templates",
    ],
    cta: "Start for Free",
    ctaLink: "/signup?plan=business-free",
  },
  {
    title: "Business Pro",
    subtitle: "For Growing Companies",
    price: "$49",
    period: "mo",
    features: [
      "Unlimited scrapes",
      "Priority support",
      "Export to Google Sheets",
      "Scheduled scraping",
      "Competitor monitoring",
      "Team sharing",
      "Data history",
    ],
    cta: "Get Started",
    ctaLink: "/signup?plan=business-pro",
    highlighted: true,
    badge: "Best Value",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="text-3xl">🚀</div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ultra-Scraper
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-all font-medium shadow-lg shadow-slate-200"
              >
                Start for Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-40 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-100/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-8 border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              New: AI-Powered Extraction
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold mb-8 leading-tight tracking-tight text-slate-900">
              No-code web scraping for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                business owners
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Extract data from any website without writing a single line of code.
              Turn websites into spreadsheets, monitor competitors, and generate leads automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl hover:shadow-blue-500/20 transition-all font-bold text-lg w-full sm:w-auto"
              >
                Start Scraping for Free
              </Link>
              <Link
                href="#how-it-works"
                className="bg-white text-slate-700 px-8 py-4 rounded-xl hover:shadow-lg border border-gray-200 transition-all font-bold text-lg w-full sm:w-auto"
              >
                See How It Works
              </Link>
            </div>

            <Link
              href="/docs"
              className="text-sm text-gray-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-1"
            >
              Are you a developer? Use our API &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Social Proof Placeholder */}
      <div className="border-y border-gray-100 bg-slate-50/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
            Trusted by forward-thinking companies
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
            {/* Placeholders for logos */}
            <div className="text-2xl font-bold text-gray-400">Acme Corp</div>
            <div className="text-2xl font-bold text-gray-400">GlobalTech</div>
            <div className="text-2xl font-bold text-gray-400">DataFlow</div>
            <div className="text-2xl font-bold text-gray-400">ScaleUp</div>
            <div className="text-2xl font-bold text-gray-400">GrowthAI</div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* Business Use Cases */}
      <BusinessUseCases />

      {/* Features Section */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Powerful Features, Zero Complexity
            </h2>
            <p className="text-xl text-gray-600">Everything you need to automate your data collection</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Automation",
                description: "Schedule scrapes to run daily, weekly, or monthly. Set it and forget it.",
                icon: "⚡",
              },
              {
                title: "Google Sheets Sync",
                description: "Send data directly to your Google Sheets. No CSV export/import needed.",
                icon: "📊",
              },
              {
                title: "AI Extraction",
                description: "Our AI understands web pages like a human, extracting exactly what you need.",
                icon: "🤖",
              },
              {
                title: "Anti-Blocking",
                description: "We handle IPs and proxies so you never get blocked by websites.",
                icon: "🛡️",
              },
              {
                title: "Cloud Storage",
                description: "All your data is stored securely in the cloud, accessible anytime.",
                icon: "☁️",
              },
              {
                title: "Email Alerts",
                description: "Get notified immediately when new data is found or prices change.",
                icon: "🔔",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start for free, upgrade as you grow
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {businessPlans.map((plan) => (
              <PricingCard key={plan.title} {...plan} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500">
              Looking for API access? <Link href="/signup?plan=technical-demo" className="text-blue-600 font-semibold hover:underline">View Developer Plans</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <Testimonials />

      {/* Developer Corner */}
      <DeveloperCorner />

      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="text-2xl">🚀</div>
                <span className="text-xl font-bold text-slate-900">Ultra-Scraper</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Empowering businesses to make data-driven decisions through effortless web scraping.
              </p>
              <div className="flex gap-4">
                {/* Social icons placeholder */}
                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li><Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link></li>
                <li><Link href="/signup" className="hover:text-blue-600 transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Resources</h4>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li><Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-blue-600 transition-colors">Guides</Link></li>
                <li><Link href="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-blue-600 transition-colors">API Reference</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 Ultra-Scraper Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
