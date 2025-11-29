import { useAuth } from "../../../hooks/user/useAuth";

export function Overview() {
  const { userData } = useAuth();

  if (!userData) return null;

  const stats = [
    {
      label: "Pages Scraped",
      value: userData.usage.pagesScraped,
      limit: userData.limits.pagesPerMonth,
      percentage: userData.percentage.pages,
      color: "blue",
    },
    {
      label: "AI Extractions",
      value: userData.usage.aiExtractions,
      limit: userData.limits.aiExtractionsPerMonth,
      percentage: userData.percentage.ai,
      color: "purple",
    },
    {
      label: "Plan",
      value: userData.user.plan,
      status: userData.user.status,
      color: "indigo",
      isText: true,
    },
  ];

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
      <h3 className="text-2xl font-bold text-white mb-6">📊 Dashboard Overview</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br from-${stat.color}-600/20 to-${stat.color}-700/20 p-6 rounded-xl border border-${stat.color}-500/30`}
          >
            <div className={`text-sm font-medium text-${stat.color}-200`}>
              {stat.label}
            </div>
            <div className={`mt-2 text-4xl font-bold text-white ${stat.isText ? 'capitalize' : ''}`}>
              {stat.value}
            </div>
            {stat.limit && (
              <>
                <div className={`text-sm text-${stat.color}-300 mt-1`}>
                  of {stat.limit}
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                  <div
                    className={`bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 h-2 rounded-full transition-all`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </>
            )}
            {stat.status && (
              <div className={`text-sm text-${stat.color}-300 mt-1`}>
                Status: {stat.status}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}