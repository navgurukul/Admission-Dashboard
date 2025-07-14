
import { 
  LayoutDashboard, 
  Calendar,
  LogOut,
  Mail,
  FileText,
  Users,
  MessageSquare
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Admin", href: "/admin", icon: Users }, // From master
  { name: "Partner", href: "/partners", icon: Users }, // From master
  { name: "Interviews", href: "/interviews", icon: MessageSquare }, // From master
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Question Repository", href: "/questions", icon: FileText },
  { name: "Offer Letters", href: "/offer-letters", icon: Mail },
];

export function AdmissionsSidebar() {
  const { user, signOut } = useAuth();

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
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sidebar-text font-semibold">Navgurukul</h2>
            <p className="text-sidebar-text-muted text-sm">Admissions Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-1 flex-1">
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
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-medium space-y-2">
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
