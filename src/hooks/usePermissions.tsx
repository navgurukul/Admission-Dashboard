import { useState, useEffect, useMemo } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  profile_pic: string;
  google_user_id: string;
  user_role_id: number;
  role_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export function usePermissions() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        // console.log("User from localStorage:", parsedUser);
        // console.log("User role_id:", parsedUser.user_role_id);
        setUser(parsedUser);
      } else {
        console.log("No user found in localStorage");
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ADMIN (user_role_id = 1) has edit access
  // STAFF (user_role_id = 2) does NOT have edit access
  // Memoize to prevent recalculation on every render
  const hasEditAccess = useMemo(() => {
    const hasAccess = user?.user_role_id === 1;
    // console.log("Permissions check - user_role_id:", user?.user_role_id, "hasAccess:", hasAccess);
    return hasAccess;
  }, [user?.user_role_id]);

  const canEdit = () => hasEditAccess;

  // isAdmin is the same as hasEditAccess (user_role_id === 1)
  const isAdmin = useMemo(() => {
    return user?.user_role_id === 1;
  }, [user?.user_role_id]);

  return {
    hasEditAccess,
    isAdmin,
    user,
    isLoading,
    canEdit,
  };
}