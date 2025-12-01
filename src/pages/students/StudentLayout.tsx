import React from "react";
import LogoutButton from "@/components/ui/LogoutButton";

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
  className,
}) => {
  return (
    <div className={`relative min-h-screen `}>
      <LogoutButton className={className} />
      {children}
    </div>
  );
};

export default StudentLayout;
