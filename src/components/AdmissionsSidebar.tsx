import { NavLink, useLocation } from "react-router-dom";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useEffect, useState } from "react";
import { navigation } from "@/components/ui/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserProfileImage, getCurrentUser, logoutUser } from "@/utils/api";

export function AdmissionsSidebar() {
  const { user: googleUser, signOut: googleSignOut } = useGoogleAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Get profile image and user from helper functions
  const profileImage = getUserProfileImage();
  const currentUser = getCurrentUser();

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) setUserInfo(JSON.parse(storedUserInfo));
  }, [googleUser]);

  const getInitials = (email: string) =>
    email.split("@")[0].slice(0, 2).toUpperCase();

  const getUserDisplayName = () =>
    currentUser?.name || googleUser?.name || userInfo?.name || "User";

  const getUserEmail = () =>
    currentUser?.email || googleUser?.email || userInfo?.email || "No email";

  const getUserAvatar = () =>
    profileImage || googleUser?.avatar || userInfo?.avatar;

  const roleId = currentUser?.user_role_id || googleUser?.role_id || 2;

  const handleLogout = async () => {
    try {
      if (googleUser) {
        googleSignOut();
      }
      logoutUser(); // This clears localStorage
      window.location.href = "/Admission-Dashboard/students/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout anyway
      logoutUser();
      window.location.href = "/students/login";
    }
  };
  // Check if current path is interview related
  const isInterviewActive = (href: string) => {
    if (href === "/interviews") {
      return (
        location.pathname === "/interviews" || location.pathname === "/schedule"
      );
    }
    return location.pathname === href;
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

      {/* Hamburger Button */}
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
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close Button - Mobile */}
        <div className="md:hidden absolute top-4 right-4">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-sidebar-medium">
          <div className="flex flex-col items-center text-center space-y-3">
            {getUserAvatar() ? (
              <img
                src={getUserAvatar()}
                alt="User avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget
                    .nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}

            {/* Fallback Avatar with Initials */}
            <div
              className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center"
              style={{ display: getUserAvatar() ? "none" : "flex" }}
            >
              <span className="text-white text-xl font-semibold">
                {getUserEmail() ? getInitials(getUserEmail()) : "U"}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-sidebar-text">
                {getUserDisplayName()}
              </h3>
              {/* <p className="text-sm text-sidebar-text-muted">View profile</p> */}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-1 flex-1">
          {navigation
            .filter((item) => item.allowedRoles.includes(roleId))
            .map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={() =>
                  cn(
                    "block p-2 rounded",
                    isInterviewActive(item.href)
                      ? "bg-gray-600 text-white"
                      : "text-gray-300 hover:bg-gray-700",
                  )
                }
                onClick={(event) => {
                  if (location.pathname === item.href) {
                    event.preventDefault();
                    return;
                  }
                  setIsOpen(false);
                }}
              >
                <item.icon className="inline mr-2" />
                {item.name}
              </NavLink>
            ))}
        </nav>

        {/* Logout */}
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
