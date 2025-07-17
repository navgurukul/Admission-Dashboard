
import { useState, useEffect } from "react";
import { TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardMetrics {
  totalApplicants: number;
  activeApplications: number;
  interviewsScheduled: number;
  successfullyOnboarded: number;
}

let supabase: any = undefined;
try {
  supabase = require("@/integrations/supabase/client").supabase;
} catch {}

export function DashboardStats() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApplicants: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    successfullyOnboarded: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    if (!supabase || !user) return;
    try {
      setLoading(true);
      if (!supabase.from) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*');
        
      if (error) {
        console.error('Error fetching dashboard data:', error);
        return;
      }
      
      if (data) {
        const totalApplicants = data.length;
        const activeApplications = data.filter(applicant => 
          (applicant.lr_status && applicant.lr_status.trim() !== '') ||
          (applicant.cfr_status && applicant.cfr_status.trim() !== '')
        ).length;
        const interviewsScheduled = data.filter(applicant => 
          applicant.offer_letter_status && applicant.offer_letter_status.trim() !== ''
        ).length;
        const successfullyOnboarded = data.filter(applicant => 
          applicant.joining_status && 
          (applicant.joining_status.toLowerCase().includes('joined') || 
           applicant.joining_status.toLowerCase().includes('onboarded'))
        ).length;
        setMetrics({
          totalApplicants,
          activeApplications,
          interviewsScheduled,
          successfullyOnboarded,
        });
      }
    } catch (error) {
      console.error('Error in fetchMetrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase || !user) return;
    let isMounted = true;
    const checkAndFetch = async () => {
      if (!supabase || !user) return;
      if (isMounted) fetchMetrics();
    };
    checkAndFetch();
    return () => { isMounted = false; };
  }, [user]);

  const stats = [
    {
      title: "Total Applicants",
      value: loading ? "..." : metrics.totalApplicants.toLocaleString(),
      change: "+12%",
      changeType: "increase" as const,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Active Applications", 
      value: loading ? "..." : metrics.activeApplications.toLocaleString(),
      change: "+8%",
      changeType: "increase" as const,
      icon: Clock,
      color: "text-status-pending",
      bgColor: "bg-status-pending/10"
    },
    {
      title: "Interviews Scheduled",
      value: loading ? "..." : metrics.interviewsScheduled.toLocaleString(),
      change: "+24%", 
      changeType: "increase" as const,
      icon: TrendingUp,
      color: "text-status-prospect",
      bgColor: "bg-status-prospect/10"
    },
    {
      title: "Successfully Onboarded",
      value: loading ? "..." : metrics.successfullyOnboarded.toLocaleString(),
      change: "+16%",
      changeType: "increase" as const,
      icon: CheckCircle,
      color: "text-status-active",
      bgColor: "bg-status-active/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stat.value}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-xs font-medium ${
                  stat.changeType === 'increase' ? 'text-status-active' : 'text-status-fail'
                }`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  from last month
                </span>
              </div>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
