import React, { createContext, useContext, useState, ReactNode } from "react";
import { Language } from "@/utils/student.types";

interface LanguageContextType {
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");

  // const getLanguageContent = (): LanguageContent => {

  // };

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
