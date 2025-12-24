import { useState, useEffect, useRef } from "react";
import { TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useDashboardRefresh } from "@/hooks/useDashboardRefresh";
import { getStudents, getFilterStudent, getAllStages } from "@/utils/api";

interface DashboardMetrics {
  totalApplicants: number;
  activeApplications: number;
  interviewsScheduled: number;
  successfullyOnboarded: number;
}

// Cache stages at module level to avoid refetching
let cachedStages: any[] | null = null;

export function DashboardStats() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApplicants: 0,
    activeApplications: 0,
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

      // Use cached stages or fetch if not available
      let stages = cachedStages;
      if (!stages) {
        stages = await getAllStages();
        cachedStages = stages;
      }
      
      const finalDecisionStage = stages.find(
        (stage: any) => stage.stage_name === "Final Decision",
      );
      const onboardedStage = stages.find(
        (stage: any) => stage.stage_name === "Onboarded",
      );
      const finalDecisionStageId = finalDecisionStage?.id;
      const onboardedStageId = onboardedStage?.id;

      // Fetch total students - just get first page to get total count
      const studentsResponse = await getStudents(1, 10);
      const totalApplicants = studentsResponse?.totalCount || 0;

      // Fetch active applications - students at "Final Decision" stage using stage_id
      let activeApplications = 0;
      if (finalDecisionStageId) {
        const finalDecisionResponse = await getFilterStudent({
          stage_id: finalDecisionStageId,
          stage_status:"Offer Sent"
        });
        activeApplications = finalDecisionResponse?.length || 0;
      }

      // Fetch onboarded students - filter by Onboarded stage using stage_id
      let successfullyOnboarded = 0;
      if (onboardedStageId) {
        const onboardedResponse = await getFilterStudent({
          stage_id: onboardedStageId,
          stage_status: "Onboarded",
        });
        successfullyOnboarded = onboardedResponse?.length || 0;
      }

      const interviewsScheduled = 0;
      setMetrics({
        totalApplicants,
        activeApplications,
        interviewsScheduled,
        successfullyOnboarded,
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
      // change: "+12%",
      // changeType: "increase" as const,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Offer Letter Sent",
      value: loading ? "..." : metrics.activeApplications.toLocaleString(),
      // change: "+8%",
      // changeType: "increase" as const,
      icon: Clock,
      color: "text-secondary-purple",
      bgColor: "bg-secondary-purple/10",
    },
    // {
    //   title: "Interviews Scheduled",
    //   value: loading ? "..." : metrics.interviewsScheduled.toLocaleString(),
    //   // change: "+24%",
    //   // changeType: "increase" as const,
    //   icon: TrendingUp,
    //   color: "text-status-prospect",
    //   bgColor: "bg-status-prospect/10",
    // },
    {
      title: "Successfully Onboarded",
      value: loading ? "..." : metrics.successfullyOnboarded.toLocaleString(),
      // change: "+16%",
      // changeType: "increase" as const,
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
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
              {/* <div className="flex items-center mt-2">
                <span
                  className={`text-xs font-medium ${
                    stat.changeType === "increase"
                      ? "text-status-active"
                      : "text-status-fail"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  from last month
                </span>
              </div> */}
            </div>
            <div
              className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
