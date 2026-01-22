import React, { useState, useEffect } from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/routes/LaunguageContext";
import { Language } from "@/utils/student.types";

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);

  const languages: { value: Language; label: string }[] = [
    { value: "english", label: "English" },
    { value: "hindi", label: "हिंदी" },
    { value: "marathi", label: "मराठी" },
  ];

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") as Language;
    if (savedLanguage && languages.some(lang => lang.value === savedLanguage)) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    localStorage.setItem("selectedLanguage", lang);
    setShowDropdown(false);
  };

  const currentLanguage = languages.find(
    (lang) => lang.value === selectedLanguage
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".language-selector")) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className={`fixed top-16 right-5 md:top-5 md:right-40 z-50 language-selector ${className || ""}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 student-btn px-4 md:px-5 py-2 rounded-full shadow-md hover:opacity-90 hover:scale-105 transition-all duration-200"
      >
        <Languages className="w-4 h-4 md:w-5 md:h-5" />
        <span className="font-medium text-sm md:text-base">{currentLanguage?.label}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 bg-card shadow-xl rounded-2xl border border-border min-w-[140px] overflow-hidden animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => handleLanguageChange(lang.value)}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-all hover:bg-muted ${
                selectedLanguage === lang.value
                  ? "bg-primary/10 text-primary"
                  : "text-foreground"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
