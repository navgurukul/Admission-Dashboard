import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    // Clear all student-related data
    localStorage.removeItem("studentId");
    // localStorage.removeItem("testStarted");
    // localStorage.removeItem("testCompleted");
    // localStorage.removeItem("allowRetest");
    // localStorage.removeItem("registrationDone");

    // Redirect to students login/landing
    navigate("/students", { replace: true });
  };

  return (
    <div className="fixed top-5 right-5 z-50">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className={`flex items-center gap-2 bg-gradient-to-r ${
            className || "from-green-500 to-green-500"
          } text-white px-5 py-2 rounded-full shadow-md hover:opacity-90 hover:scale-105 transition-all duration-200`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button> 
      ) : (
        <div className="bg-white shadow-xl rounded-2xl p-4 border border-gray-100 flex flex-col items-center space-y-3 animate-fade-in">
          <p className="text-gray-700 text-sm font-medium">
            Are you sure you want to log out?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-600 transition-all"
            >
              Yes, Logout
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="bg-gray-200 text-gray-800 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoutButton;
