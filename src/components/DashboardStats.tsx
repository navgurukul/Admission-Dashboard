import { useState, useEffect, useRef } from "react";
import { TrendingUp, Users, Mail, CheckCircle, ChevronRight, ChevronDown } from "lucide-react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useDashboardRefresh } from "@/hooks/useDashboardRefresh";
import { getStudentsStats, getFilterStudent } from "@/utils/api";

interface DashboardMetrics {
  totalApplicants: number;
  activeApplications: number;
  manuallySent: number;
  interviewsScheduled: number;
  successfullyOnboarded: number;
  dailyAdmissionStats: Array<{
    date: string;
    campus_id: number;
    campus_name: string;
    count: string | number;
  }>;
  totalDailyAdmissionCount?: number;
}

export function DashboardStats() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApplicants: 0,
    activeApplications: 0,
    manuallySent: 0,
    interviewsScheduled: 0,
    successfullyOnboarded: 0,
    dailyAdmissionStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [isCampusExpanded, setIsCampusExpanded] = useState(false);
  const { user: googleUser } = useGoogleAuth();
  const { refreshTrigger } = useDashboardRefresh();

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      if (!googleUser) {
        console.warn("No active session, skipping metrics fetch");
        return;
      }

      const statsData = await getStudentsStats();

      // Fetch accurate counts directly from the filter API to ensure numbers match the table
      const onboardedData = await getFilterStudent({ stage_id: 6, limit: 1 });
      const admissionLetterData = await getFilterStudent({ stage_id: 5, stage_status: ["11"], limit: 1 });

      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todaysStats = (statsData.dailyAdmissionStats || []).filter((s: any) => s.date === todayString);

      setMetrics({
        totalApplicants: statsData.totalStudents || 0,
        activeApplications: (admissionLetterData && admissionLetterData.total !== undefined) ? admissionLetterData.total : (statsData.admissionLetterSent || statsData.offerLetterSent || 0),
        manuallySent: statsData.manuallySent || 0,
        interviewsScheduled: 0,
        successfullyOnboarded: (onboardedData && onboardedData.total !== undefined) ? onboardedData.total : (statsData.onboarded || 0),
        dailyAdmissionStats: todaysStats,
        totalDailyAdmissionCount: (statsData as any).totalDailyAdmissionCount || 0,
      });
    } catch (error) {
      console.error("Error calculating metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [googleUser, refreshTrigger]);

  const stats = [
    {
      id: "applicants",
      title: "Total Applicants",
      value: loading ? "..." : metrics.totalApplicants.toLocaleString(),
      subtitle: "Unique applicants",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      showInfo: true,
      showChevron: false,
      titleFirst: true,
    },
    {
      id: "admission_letters",
      title: "Admission Letters Sent",
      value: loading ? "..." : (metrics.activeApplications + metrics.manuallySent).toLocaleString(),
      subtitle: `${loading ? "..." : metrics.activeApplications} system sent • ${loading ? "..." : metrics.manuallySent} manual`,
      icon: Mail,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      showInfo: true,
      showChevron: true,
      titleFirst: true,
    },
    {
      id: "onboarded",
      title: "Successfully Onboarded",
      value: loading ? "..." : metrics.successfullyOnboarded.toLocaleString(),
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50",
      showInfo: true,
      showChevron: false,
      titleFirst: true,
    },
    {
      id: "todays_admissions",
      title: "Today's Admissions",
      value: loading ? "..." : (metrics.totalDailyAdmissionCount || 0).toLocaleString(),
      subtitle: (() => {
        const d = new Date();
        const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${dateStr} • All Campuses`;
      })(),
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      showInfo: false,
      showChevron: true,
      titleFirst: true,
      isDailyAdmissions: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.id}
          onClick={() => {
            if (stat.id === "applicants") return;
            
            if (stat.id === "admission_letters") {
              window.dispatchEvent(new CustomEvent('apply_dashboard_filter', { detail: "Admission Letter Sent" }));
            } else if (stat.isDailyAdmissions) {
              const today = new Date();
              const rawDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              window.dispatchEvent(new CustomEvent('apply_dashboard_filter', { 
                detail: { title: "Today's Admission Letters Sent", date: rawDate, campus: "All" } 
              }));
            } else {
              window.dispatchEvent(new CustomEvent('apply_dashboard_filter', { detail: stat.title === "Successfully Onboarded" ? "Successfully Onboarded" : stat.title }));
            }
          }}
          className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center relative transition-shadow ${stat.id !== "applicants" ? "cursor-pointer hover:shadow-md" : "cursor-default"}`}
        >
          {/* Icon - Left side */}
          <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center mr-4 ${stat.bgColor}`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="pr-6">
              {stat.titleFirst ? (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{stat.value}</p>
                  {stat.id === "admission_letters" ? (
                    <p className="text-xs text-gray-500 truncate">
                      <span 
                        className="cursor-pointer hover:text-pink-600 hover:underline transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent('apply_dashboard_filter', { detail: "Admission Letter Sent" }));
                        }}
                      >
                        {loading ? "..." : metrics.activeApplications} system sent
                      </span>
                      {" • "}
                      <span 
                        className="cursor-pointer hover:text-pink-600 hover:underline transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent('apply_dashboard_filter', { detail: "Manually Sent" }));
                        }}
                      >
                        {loading ? "..." : metrics.manuallySent} manual
                      </span>
                    </p>
                  ) : stat.subtitle && (
                    <p className="text-xs text-gray-500 truncate">{stat.subtitle}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{stat.value}</p>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  </div>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 truncate">{stat.subtitle}</p>
                  )}
                </>
              )}
            </div>

            {stat.isDailyAdmissions && (
              <div className="mt-2 pt-2 border-t border-gray-100 pr-4">
                <div 
                  className={`flex items-center justify-between py-1 rounded transition-colors ${metrics.dailyAdmissionStats.length > 0 ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (metrics.dailyAdmissionStats.length > 0) {
                      setIsCampusExpanded(!isCampusExpanded);
                    }
                  }}
                >
                  <span className="text-xs font-medium text-gray-500">View by Campus</span>
                  {metrics.dailyAdmissionStats.length > 0 ? (
                    isCampusExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
                  ) : (
                    <span className="text-xs font-medium text-gray-400 italic">0 sent today</span>
                  )}
                </div>
                
                {isCampusExpanded && (
                  <div 
                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-2 px-1">Campuses</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {metrics.dailyAdmissionStats.map(s => (
                        <div 
                          key={s.campus_id} 
                          className="flex items-center justify-between text-xs hover:bg-gray-50 p-1.5 rounded transition-colors cursor-default"
                        >
                          <span className="font-medium text-gray-600">{s.campus_name}</span>
                          <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chevron - Right side (only if not daily admissions to avoid conflict) */}
          {stat.showChevron && !stat.isDailyAdmissions && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
