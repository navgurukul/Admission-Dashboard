
import { 
  LayoutDashboard, 
  Calendar,
  LogOut,
  Mail,
  FileText,
  Users,
  MessageSquare,
  Handshake // Added Handshake icon
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Admin", href: "/admin", icon: Users }, // From master
  { name: "Partner", href: "/partners", icon: Users }, // From master
  { name: "Donor", href: "/donor", icon: Handshake }, // Changed to Handshake icon
  { name: "Interviews", href: "/interviews", icon: MessageSquare }, // From master
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Question Repository", href: "/questions", icon: FileText },
  { name: "Offer Letters", href: "/offer-letters", icon: Mail },
];

export function AdmissionsSidebar() {
  const { user, signOut } = useAuth();
  const { user: googleUser, signOut: googleSignOut } = useGoogleAuth();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Get user info from localStorage
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, [user, googleUser]);

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    // Priority: Google user > stored user info > Supabase user
    if (googleUser?.name) {
      return googleUser.name;
    }
    if (userInfo?.name) {
      return userInfo.name;
    }
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return 'User';
  };

  const getUserEmail = () => {
    return googleUser?.email || user?.email || userInfo?.email || 'No email';
  };

  const getUserAvatar = () => {
    return googleUser?.avatar || userInfo?.avatar || user?.user_metadata?.avatar_url;
  };

  const getAuthProvider = () => {
    if (googleUser) return 'google';
    if (userInfo?.provider) return userInfo.provider;
    return 'email';
  };

  const handleLogout = async () => {
    if (googleUser) {
      googleSignOut();
      window.location.href = "/Admission-Dashboard/auth";
    } else {
      await signOut();
      window.location.href = "/Admission-Dashboard/auth";
    }
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
          {getUserAvatar() ? (
            <img 
              src={getUserAvatar()} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary text-sm font-medium">
                {getUserEmail() ? getInitials(getUserEmail()) : 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-text text-sm font-medium truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-sidebar-text-muted text-xs truncate">
              {getUserEmail()}
            </p>
            <p className="text-sidebar-text-muted text-xs">
              Signed in with {getAuthProvider()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
