import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  MessageSquare, 
  Calendar,
  Settings,
  HelpCircle,
  Bell,
  LogOut
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Admin", href: "/admin", icon: Users }, // Added Admin tab
  { name: "Partner", href: "/partners", icon: Users },
  { name: "Interviews", href: "/interviews", icon: MessageSquare },
  { name: "Schedule", href: "/schedule", icon: Calendar },
];

interface StageCounts {
  sourcing: number;
  screening: number;
  interviewRounds: number;
  decisions: number;
}

export function AdmissionsSidebar() {
  const { user, signOut } = useAuth();
  const [stageCounts, setStageCounts] = useState<StageCounts>({
    sourcing: 0,
    screening: 0,
    interviewRounds: 0,
    decisions: 0,
  });

  const fetchStageCounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('*');

      if (error) {
        console.error('Error fetching stage counts:', error);
        return;
      }

      if (data) {
        let sourcing = 0;
        let screening = 0;
        let interviewRounds = 0;
        let decisions = 0;

        data.forEach(applicant => {
          // Final Decisions: those who have joined
          if (applicant.joining_status && 
              (applicant.joining_status.toLowerCase().includes('joined') || 
               applicant.joining_status.toLowerCase().includes('onboarded'))) {
            decisions++;
          }
          // Interview Rounds: those with lr_status or cfr_status
          else if ((applicant.lr_status && applicant.lr_status.trim() !== '') ||
                   (applicant.cfr_status && applicant.cfr_status.trim() !== '')) {
            interviewRounds++;
          }
          // Screening Tests: those with final_marks or qualifying_school
          else if (applicant.final_marks !== null || 
                   (applicant.qualifying_school && applicant.qualifying_school.trim() !== '')) {
            screening++;
          }
          // Sourcing & Outreach: everyone else
          else {
            sourcing++;
          }
        });

        setStageCounts({
          sourcing,
          screening,
          interviewRounds,
          decisions,
        });
      }
    } catch (error) {
      console.error('Error calculating stage counts:', error);
    }
  };

  useEffect(() => {
    fetchStageCounts();

    // Set up real-time subscription for automatic updates
    const channel = supabase
      .channel('sidebar_stage_counts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admission_dashboard'
        },
        (payload) => {
          console.log('Real-time stage counts update received:', payload);
          fetchStageCounts();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up sidebar stage counts subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const stages = [
    { name: "Sourcing & Outreach", href: "/sourcing", count: stageCounts.sourcing },
    { name: "Screening Tests", href: "/screening", count: stageCounts.screening },
    { name: "Interview Rounds", href: "/interview-rounds", count: stageCounts.interviewRounds },
    { name: "Final Decisions", href: "/decisions", count: stageCounts.decisions },
  ];

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="bg-gradient-sidebar w-64 h-screen fixed left-0 top-0 flex flex-col border-r border-sidebar-medium overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-medium">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sidebar-text font-semibold">Navgurukul</h2>
            <p className="text-sidebar-text-muted text-sm">Admissions Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-white",
                isActive
                  ? "bg-sidebar-light font-bold text-white border border-primary/20"
                  : "text-sidebar-text-muted hover:text-white hover:bg-sidebar-medium"
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}

        {/* Stages Section */}
        <div className="pt-6">
          <h3 className="px-3 text-xs font-semibold text-sidebar-text-muted uppercase tracking-wider mb-3">
            Admission Stages
          </h3>
          <div className="space-y-1">
            {stages.map((stage) => (
              <NavLink
                key={stage.name}
                to={stage.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-white",
                    isActive
                      ? "bg-sidebar-light font-bold text-white border border-primary/20"
                      : "text-sidebar-text-muted hover:text-white hover:bg-sidebar-medium"
                  )
                }
              >
                <span className="truncate">{stage.name}</span>
                <span className="ml-2 bg-sidebar-medium text-sidebar-text text-xs px-2 py-0.5 rounded-full">
                  {stage.count}
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-medium space-y-2">
        <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-white hover:bg-sidebar-medium rounded-lg transition-all duration-200">
          <Bell className="mr-3 h-5 w-5" />
          Notifications
        </button>
        <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-white hover:bg-sidebar-medium rounded-lg transition-all duration-200">
          <HelpCircle className="mr-3 h-5 w-5" />
          Help & Support
        </button>
        <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-white hover:bg-sidebar-medium rounded-lg transition-all duration-200">
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-medium">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-primary text-sm font-medium">
              {user?.email ? getInitials(user.email) : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-text text-sm font-medium">
              {user?.user_metadata?.display_name || 'User'}
            </p>
            <p className="text-sidebar-text-muted text-xs truncate">
              {user?.email || 'No email'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
