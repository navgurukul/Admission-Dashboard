
// import { 
//   LayoutDashboard, 
//   Calendar,
//   LogOut,
//   Mail,
//   FileText,
//   Users,
//   MessageSquare,
//   Handshake, 
//   School ,
//   Shield,
//   UserCheck
// } from "lucide-react";
// import { NavLink } from "react-router-dom";
// import { cn } from "@/lib/utils";
// import { useAuth } from "@/hooks/useAuth";
// import { useGoogleAuth } from "@/hooks/useGoogleAuth";
// import { useState, useEffect } from "react";

// const navigation = [
//   { name: "Admin", href: "/admin", icon: Shield },
//   { name: "Dashboard", href: "/", icon: LayoutDashboard },
//   { name: "Donor", href: "/donor", icon: Handshake },
//   { name: "Partner", href: "/partners", icon: Users },
//   { name: "Campus", href: "/campus", icon: School },
//   { name: "School", href: "/school", icon: School }, 
//   { name: "Owner", href: "/owner", icon: UserCheck },
//   { name: "Interviews", href: "/interviews", icon: MessageSquare },
//   { name: "Schedule", href: "/schedule", icon: Calendar },
//   { name: "Question Repository", href: "/questions", icon: FileText },
//   { name: "Offer Letters", href: "/offer-letters", icon: Mail },
// ];

// export function AdmissionsSidebar() {
//   const { user, signOut } = useAuth();
//   const { user: googleUser, signOut: googleSignOut } = useGoogleAuth();
//   const [userInfo, setUserInfo] = useState<any>(null);

//   useEffect(() => {
//     // Get user info from localStorage
//     const storedUserInfo = localStorage.getItem('userInfo');
//     if (storedUserInfo) {
//       setUserInfo(JSON.parse(storedUserInfo));
//     }
//   }, [user, googleUser]);

//   const getInitials = (email: string) => {
//     return email.split('@')[0].slice(0, 2).toUpperCase();
//   };

//   const getUserDisplayName = () => {
//     // Priority: Google user > stored user info > Supabase user
//     if (googleUser?.name) {
//       return googleUser.name;
//     }
//     if (userInfo?.name) {
//       return userInfo.name;
//     }
//     if (user?.user_metadata?.display_name) {
//       return user.user_metadata.display_name;
//     }
//     if (user?.user_metadata?.full_name) {
//       return user.user_metadata.full_name;
//     }
//     return 'User';
//   };

//   const getUserEmail = () => {
//     return googleUser?.email || user?.email || userInfo?.email || 'No email';
//   };

//   const getUserAvatar = () => {
//     return googleUser?.avatar || userInfo?.avatar || user?.user_metadata?.avatar_url;
//   };

//   const getAuthProvider = () => {
//     if (googleUser) return 'google';
//     if (userInfo?.provider) return userInfo.provider;
//     return 'email';
//   };

//   const handleLogout = async () => {
//     if (googleUser) {
//       googleSignOut();
//       window.location.href = "/Admission-Dashboard/auth";
//     } else {
//       await signOut();
//       window.location.href = "/Admission-Dashboard/auth";
//     }
//   };

//   return (
//     <div className="bg-gradient-sidebar w-64 h-screen fixed left-0 top-0 flex flex-col border-r border-sidebar-medium overflow-y-auto">
//       {/* Header */}
//       <div className="p-6 border-b border-sidebar-medium">
//         <div className="flex items-center space-x-3">
//           <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
//             <Mail className="w-5 h-5 text-white" />
//           </div>
//           <div>
//             <h2 className="text-sidebar-text font-semibold">Navgurukul</h2>
//             <p className="text-sidebar-text-muted text-sm">Admissions Portal</p>
//           </div>
//         </div>
//       </div>

//       {/* Navigation */}
//       <nav className="px-4 py-6 space-y-1 flex-1">
//         {navigation.map((item) => (
//           <NavLink
//             key={item.name}
//             to={item.href}
//             className={({ isActive }) =>
//               cn(
//                 "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-white",
//                 isActive
//                   ? "bg-sidebar-light font-bold text-white border border-primary/20"
//                   : "text-sidebar-text-muted hover:text-white hover:bg-sidebar-medium"
//               )
//             }
//           >
//             <item.icon className="mr-3 h-5 w-5" />
//             {item.name}
//           </NavLink>
//         ))}
//       </nav>

//       {/* Bottom Section */}
//       <div className="p-4 border-t border-sidebar-medium space-y-2">
//         <button 
//           onClick={handleLogout}
//           className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
//         >
//           <LogOut className="mr-3 h-5 w-5" />
//           Sign Out
//         </button>
//       </div>

//       {/* User Profile */}
//       <div className="p-4 border-t border-sidebar-medium">
//         <div className="flex items-center space-x-3">
//           {getUserAvatar() ? (
//             <img 
//               src={getUserAvatar()} 
//               alt="User avatar" 
//               className="w-8 h-8 rounded-full object-cover"
//             />
//           ) : (
//             <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
//               <span className="text-primary text-sm font-medium">
//                 {getUserEmail() ? getInitials(getUserEmail()) : 'U'}
//               </span>
//             </div>
//           )}
//           <div className="flex-1 min-w-0">
//             <p className="text-sidebar-text text-sm font-medium truncate">
//               {getUserDisplayName()}
//             </p>
//             <p className="text-sidebar-text-muted text-xs truncate">
//               {getUserEmail()}
//             </p>
//             <p className="text-sidebar-text-muted text-xs">
//               Signed in with {getAuthProvider()}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Mail,
  FileText,
  Users,
  MessageSquare,
  Handshake,
  School,
  Shield,
  UserCheck,
  Menu,
  X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Admin", href: "/admin", icon: Shield },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Donor", href: "/donor", icon: Handshake },
  { name: "Partner", href: "/partners", icon: Users },
  { name: "Campus", href: "/campus", icon: School },
  { name: "School", href: "/school", icon: School },
  { name: "Owner", href: "/owner", icon: UserCheck },
  { name: "Interviews", href: "/interviews", icon: MessageSquare },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Question Repository", href: "/questions", icon: FileText },
  { name: "Offer Letters", href: "/offer-letters", icon: Mail },
];

export function AdmissionsSidebar() {
  const { user, signOut } = useAuth();
  const { user: googleUser, signOut: googleSignOut } = useGoogleAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, [user, googleUser]);

  const getInitials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();
  const getUserDisplayName = () => googleUser?.name || userInfo?.name || user?.user_metadata?.display_name || user?.user_metadata?.full_name || "User";
  const getUserEmail = () => googleUser?.email || user?.email || userInfo?.email || "No email";
  const getUserAvatar = () => googleUser?.avatar || userInfo?.avatar || user?.user_metadata?.avatar_url;
  const getAuthProvider = () => googleUser ? "google" : userInfo?.provider || "email";

  const handleLogout = async () => {
    if (googleUser) {
      googleSignOut();
    } else {
      await signOut();
    }
    window.location.href = "/Admission-Dashboard/auth";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Hamburger Button - Mobile Only */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-gradient-sidebar z-50 flex flex-col border-r border-sidebar-medium transition-transform duration-300 ease-in-out",
          "md:translate-x-0 md:rounded-none md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close Button - Mobile Only */}
        <div className="md:hidden absolute top-4 right-4">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Section - Top (Updated Style) */}
        <div className="p-6 border-b border-sidebar-medium">
          <div className="flex flex-col items-center text-center space-y-3">
            {getUserAvatar() ? (
              <img
                src={getUserAvatar()}
                alt="User avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {getUserEmail() ? getInitials(getUserEmail()) : "U"}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-sidebar-text">
                {getUserDisplayName()}
              </h3>
              <p className="text-sm text-sidebar-text-muted">View profile</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu (Original Style) */}
        <nav className="px-4 py-6 space-y-1 flex-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
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

        {/* Logout Button - Bottom (Original Style) */}
        <div className="p-4 border-t border-sidebar-medium space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
