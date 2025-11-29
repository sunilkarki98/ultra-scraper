// components/dashboard/Navigation.tsx

import { useAuth } from "../../../hooks/user/useAuth";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { userData, logout } = useAuth();
  const tabs = ["overview", "scrape", "social", "business", "agent", "jobs", "keys", "settings"];

  return (
    <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              🚀 UltraScraper
            </h1>
            <div className="hidden md:flex ml-10 space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all capitalize ${activeTab === tab
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300 font-medium hidden sm:block">
              {userData?.user.name}
            </span>
            <button
              onClick={logout}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}