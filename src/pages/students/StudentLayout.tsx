import React from "react";
import LogoutButton from "@/components/ui/LogoutButton";
import LanguageSelector from "@/components/ui/LanguageSelector";

interface StudentLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div className={`relative min-h-screen `}>
      <LanguageSelector className={className} />
      <LogoutButton className={className} />
    
      {children}
    </div>
  );
};

export default StudentLayout;
