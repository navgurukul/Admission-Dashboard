import { createContext, useContext,useEffect, useState, ReactNode } from "react";
import {Student} from "./student.types"

interface StudentContextType {
  student: Student | null;
  setStudent: (s: Student) => void;
}

//Create context
const StudentContext = createContext<StudentContextType | undefined>(undefined);


export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudent] = useState<Student | null>();

  useEffect(() => {
    const studentData = localStorage.getItem("studentFormData");
    if (studentData) {
      try {
        const parsed = JSON.parse(studentData) as Student;
        setStudent(parsed);
      } catch {
        setStudent(null);
      }
    }
  }, []);

  console.log(student)
  return (
    <StudentContext.Provider value={{ student, setStudent }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used inside StudentProvider");
  return ctx;
};
