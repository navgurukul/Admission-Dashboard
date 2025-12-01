import React, { createContext, useContext, useState, useEffect } from "react";

interface Student {
  firstName: string;
  middleName?: string;
  lastName?: string;
  email: string;
  whatsappNumber: string;
  city: string;
  [key: string]: any; // allow extra fields
}

interface StudentContextType {
  student: Student | null;
  setStudent: React.Dispatch<React.SetStateAction<Student | null>>;
}

const StudentContext = createContext<StudentContextType>({
  student: null,
  setStudent: () => {},
});

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    // Load student data from localStorage on mount
    const savedData = localStorage.getItem("studentFormData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setStudent(parsed);
      } catch (err) {
        console.error("Error parsing studentFormData:", err);
      }
    }
  }, []);

  return (
    <StudentContext.Provider value={{ student, setStudent }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);
