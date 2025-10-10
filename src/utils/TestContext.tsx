// src/context/TestsContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface SlotBooking {
  status: "Pending" | "Booked" | "Cancelled" | "Completed" | null;
  scheduledTime?: string;
}

export interface Test {
  id: number;
  name: string;
  status: "Pass" | "Fail" | "Pending" | "-";
  action: string;
  score: number | null;
  slotBooking: SlotBooking;
}

interface TestsContextType {
  tests: Test[];
  setTests: React.Dispatch<React.SetStateAction<Test[]>>;
  updateSlot: (id: number, slot: Partial<SlotBooking>) => void;
}

const TestsContext = createContext<TestsContextType | undefined>(undefined);

const STORAGE_KEY = "tests_data";

export const TestsProvider = ({ children }: { children: ReactNode }) => {
  const [tests, setTests] = useState<Test[]>(() => {
    // Load initial state from localStorage if available
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [

];
  });

  // Persist to localStorage whenever tests change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  }, [tests]);

  const updateSlot = (id: number, slot: Partial<SlotBooking>) =>
    setTests((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, slotBooking: { ...t.slotBooking, ...slot } } : t
      )
    );

  return (
    <TestsContext.Provider value={{ tests, setTests, updateSlot }}>
      {children}
    </TestsContext.Provider>
  );
};

export const useTests = () => {
  const ctx = useContext(TestsContext);
  if (!ctx) throw new Error("useTests must be used inside TestsProvider");
  return ctx;
};
