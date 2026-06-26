import { useState, useEffect, useRef } from "react";
import { TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useDashboardRefresh } from "@/hooks/useDashboardRefresh";
import { getStudentsStats } from "@/utils/api";

interface DashboardMetrics {
  totalApplicants: number;
  activeApplications: number;
  manuallySent: number;
  interviewsScheduled: number;
  successfullyOnboarded: number;
}


export function DashboardStats() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApplicants: 0,
    activeApplications: 0,
    manuallySent: 0,
    interviewsScheduled: 0,
    successfullyOnboarded: 0,
  });
  const [loading, setLoading] = useState(true);
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

      setMetrics({
        totalApplicants: statsData.totalStudents || 0,
        activeApplications: statsData.admissionLetterSent || statsData.offerLetterSent || 0,
        manuallySent: statsData.manuallySent || 0,
        interviewsScheduled: 0,
        successfullyOnboarded: statsData.onboarded || 0,
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
      title: "Admission Letter Sent",
      value: loading ? "..." : metrics.activeApplications.toLocaleString(),
      icon: Clock,
      color: "text-secondary-purple",
      bgColor: "bg-secondary-purple/10",
      extra: {
        label: "Manually Sent",
        value: loading ? "..." : metrics.manuallySent.toLocaleString(),
      },
    },
    {
      title: "Successfully Onboarded",
      value: loading ? "..." : metrics.successfullyOnboarded.toLocaleString(),
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      extra: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div
              className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
          {stat.extra && (
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
