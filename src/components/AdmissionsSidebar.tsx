import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  MessageSquare, 
  Calendar,
  Settings,
  HelpCircle,
  Bell
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "All Applicants", href: "/applicants", icon: Users },
  { name: "Interviews", href: "/interviews", icon: MessageSquare },
  { name: "Schedule", href: "/schedule", icon: Calendar },
];

const stages = [
  { name: "Sourcing & Outreach", href: "/sourcing", count: 45 },
  { name: "Screening Tests", href: "/screening", count: 23 },
  { name: "Interview Rounds", href: "/interview-rounds", count: 12 },
  { name: "Final Decisions", href: "/decisions", count: 8 },
];

export function AdmissionsSidebar() {
  return (
    <div className="bg-gradient-sidebar w-64 min-h-screen flex flex-col border-r border-sidebar-medium">
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
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-light text-primary border border-primary/20"
                  : "text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-medium"
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
                    "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-light text-primary border border-primary/20"
                      : "text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-medium"
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
        <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-medium rounded-lg transition-all duration-200">
          <Bell className="mr-3 h-5 w-5" />
          Notifications
        </button>
        <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-medium rounded-lg transition-all duration-200">
          <HelpCircle className="mr-3 h-5 w-5" />
          Help & Support
        </button>
        <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-medium rounded-lg transition-all duration-200">
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-medium">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-primary text-sm font-medium">AM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-text text-sm font-medium">Admin User</p>
            <p className="text-sidebar-text-muted text-xs truncate">admin@navgurukul.org</p>
          </div>
        </div>
      </div>
    </div>
  );
}