import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Student {
  id?: string;
  name: string;
  email: string;
  phone: string;
  registrationComplete: boolean;
}

interface TestResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: Date;
}

interface StudentContextType {
  student: Student | null;
  testResult: TestResult | null;
  setStudent: (student: Student) => void;
  setTestResult: (result: TestResult) => void;
  resetStudent: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [student, setStudentState] = useState<Student | null>(null);
  const [testResult, setTestResultState] = useState<TestResult | null>(null);

  const setStudent = (student: Student) => {
    setStudentState(student);
    // Save to localStorage for persistence
    localStorage.setItem('student', JSON.stringify(student));
  };

  const setTestResult = (result: TestResult) => {
    setTestResultState(result);
    localStorage.setItem('testResult', JSON.stringify(result));
  };

  const resetStudent = () => {
    setStudentState(null);
    setTestResultState(null);
    localStorage.removeItem('student');
    localStorage.removeItem('testResult');
  };

  return (
    <StudentContext.Provider value={{
      student,
      testResult,
      setStudent,
      setTestResult,
      resetStudent
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};