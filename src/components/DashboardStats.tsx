
import { useState, useEffect } from "react";
import { TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface DashboardMetrics {
  totalApplicants: number;
  activeApplications: number;
  interviewsScheduled: number;
  successfullyOnboarded: number;
}

export function DashboardStats() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApplicants: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    successfullyOnboarded: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user: googleUser } = useGoogleAuth();

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Check authentication state
      if (!googleUser) {
        console.warn('No active session, skipping metrics fetch');
        return;
      }

      // Fetch all data to calculate metrics
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*');

      if (error) {
        console.error('Error fetching metrics:', error);
        return;
      }

      if (data) {
        // Calculate metrics from the data
        const totalApplicants = data.length;
        
        // Active Applications: those with lr_status or cfr_status set (not null/empty)
        const activeApplications = data.filter(applicant => 
          (applicant.lr_status && applicant.lr_status.trim() !== '') ||
          (applicant.cfr_status && applicant.cfr_status.trim() !== '')
        ).length;
        
        // Interviews Scheduled: those with offer_letter_status set
        const interviewsScheduled = data.filter(applicant => 
          applicant.offer_letter_status && applicant.offer_letter_status.trim() !== ''
        ).length;
        
        // Successfully Onboarded: those with joining_status = 'Joined' or similar
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
      console.error('Error calculating metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Set up real-time subscription for automatic updates
    const channel = supabase
      .channel('dashboard_metrics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admission_dashboard'
        },
        (payload) => {
          console.log('Real-time metrics update received:', payload);
          // Refetch metrics when changes occur
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up dashboard metrics subscription');
      supabase.removeChannel(channel);
    };
  }, []);

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
