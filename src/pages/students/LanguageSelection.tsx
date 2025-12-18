import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Language } from "@/utils/student.types";

const LanguageSelection: React.FC = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>("English");

  const handleContinue = (): void => {
    // अगर आगे language चाहिए तो localStorage में save कर लो
    localStorage.setItem("selectedLanguage", language);
    navigate("/students/instructions");
  };

  const handleBackToHome = (): void => {
    localStorage.removeItem("googleUser");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("roleAccess");
    localStorage.removeItem("privileges");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-large p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          NavGurukul Entrance Test
        </h1>
        <p className="text-muted-foreground mb-8">Select Your Language</p>

        <div className="mb-8">
          <label className="block text-left text-foreground font-medium mb-2">
            Choose your language
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full p-3 border border-input rounded-lg appearance-none bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="English">English</option>
              <option value="Hindi">हिंदी</option>
              <option value="Marathi">मराठी</option>
              <option value="Gujarati">ગુજરાતી</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition duration-200"
        >
          LET'S GO AHEAD
        </button>

        <div className="flex justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-muted rounded-full"></div>
          <div className="w-3 h-3 bg-muted rounded-full"></div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handleBackToHome}
            className="text-muted-foreground hover:text-foreground flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            BACK
          </button>
          <button
            onClick={handleContinue}
            className="text-primary hover:text-primary/80 flex items-center"
          >
            NEXT
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;
