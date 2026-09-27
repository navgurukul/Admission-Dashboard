import { useState, useEffect, useRef } from "react";
import { TrendingUp, Users, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
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
      const onboardedData = await getFilterStudent({ stage_id: 6 });

      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todaysStats = (statsData.dailyAdmissionStats || []).filter((s: any) => s.date === todayString);

      setMetrics({
        totalApplicants: statsData.totalStudents || 0,
        activeApplications: statsData.admissionLetterSent || statsData.offerLetterSent || 0,
        manuallySent: statsData.manuallySent || 0,
        interviewsScheduled: 0,
        successfullyOnboarded: onboardedData.total || statsData.onboarded || 0,
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
      title: "Total Applicants",
      value: loading ? "..." : metrics.totalApplicants.toLocaleString(),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      extra: null,
    },
    {
      title: "Total Admission Letter Sent",
      value: loading ? "..." : (metrics.activeApplications + metrics.manuallySent).toLocaleString(),
      icon: Clock,
      color: "text-secondary-purple",
      bgColor: "bg-secondary-purple/10",
      extras: [
        {
          label: "Admission Letter Sent",
          value: loading ? "..." : metrics.activeApplications.toLocaleString(),
        },
        {
          label: "Manually Sent",
          value: loading ? "..." : metrics.manuallySent.toLocaleString(),
        },
      ],
    },
    {
      title: "Successfully Onboarded",
      value: loading ? "..." : metrics.successfullyOnboarded.toLocaleString(),
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      extra: null,
    },
    {
      title: "Today's Admission Letters Sent",
      value: loading ? "..." : (metrics.totalDailyAdmissionCount || 0).toLocaleString(),
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      isDailyAdmissions: true,
      displayDate: (() => {
        const d = new Date();
        return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
      })(),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.title}
          onClick={() => {
            if (stat.title !== "Total Admission Letter Sent" && !(stat as any).isDailyAdmissions) {
              window.dispatchEvent(new CustomEvent('apply_dashboard_filter', { detail: stat.title }));
            }
          }}
          className={`bg-card rounded-xl px-5 py-3 shadow-soft border border-border transition-shadow ${
            stat.title !== "Total Admission Letter Sent" && !(stat as any).isDailyAdmissions ? "cursor-pointer hover:shadow-md" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div
              className={`w-9 h-9 ${stat.bgColor} rounded-lg flex items-center justify-center`}
            >
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
          
          {stat.extras && (
            <div className="mt-3 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {stat.extras.map((extra, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col p-1 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('apply_dashboard_filter', { detail: extra.label }));
                    }}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      {extra.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {extra.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {(stat as any).isDailyAdmissions && (
            <div className="mt-3 pt-2 border-t border-border flex flex-col gap-2">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded -mx-1 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const today = new Date();
                  const rawDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  window.dispatchEvent(new CustomEvent('apply_dashboard_filter', { 
                    detail: { title: stat.title, date: rawDate, campus: "All" } 
                  }));
                }}
              >
                <span className="text-xs font-medium text-muted-foreground">Date</span>
                <span className="text-sm font-semibold text-foreground">{(stat as any).displayDate}</span>
              </div>
              
              <div className="flex flex-col">
                <div 
                  className="flex items-center justify-between cursor-pointer py-1 hover:bg-muted/50 rounded -mx-1 px-1 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCampusExpanded(!isCampusExpanded);
                  }}
                >
                  <span className="text-xs font-medium text-muted-foreground">Campus Wise</span>
                  {isCampusExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
                
                {isCampusExpanded && (
                  <div className="mt-1 space-y-0.5 border-t border-border pt-1">
                    {metrics.dailyAdmissionStats.map(s => (
                      <div 
                        key={s.campus_id} 
                        className="flex items-center justify-between text-xs hover:bg-accent p-1 rounded transition-colors cursor-default"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-medium text-muted-foreground">{s.campus_name}</span>
                        <span className="font-semibold text-foreground">{s.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!stat.extras && !(stat as any).isDailyAdmissions && stat.extra && (
            <div className="mt-1 pt-1 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {stat.extra.label}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {stat.extra.value}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
