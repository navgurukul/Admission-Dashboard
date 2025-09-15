// src/context/TestsContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

export interface SlotBooking {
  status: "Pending" | "Booked" | "Cancelled";
  scheduledTime?: string;
}

export interface Test {
  id: number;
  name: string;
  status: "Pass" | "Fail" | "Pending" | "-";
  score: number;
  slotBooking: SlotBooking;
}

interface TestsContextType {
  tests: Test[];
  setTests: (t: Test[]) => void;
  updateSlot: (id: number, slot: Partial<SlotBooking>) => void;
}

const TestsContext = createContext<TestsContextType | undefined>(undefined);

export const TestsProvider = ({ children }: { children: ReactNode }) => {
  const [tests, setTests] = useState<Test[]>([
    {
      id: 1,
      name: "Screening Test",
      status: "Pass",
      score: 85,
      slotBooking: { status: null, scheduledTime: "" },
    },
    {
      id: 2,
      name: "Technical Interview",
      status: "Pending",
      score: null,
      slotBooking: { status: "Pending" },
    },
    {
      id: 3,
      name: "Culture fit Interview",
      status: "Pending",
      score: null,
      slotBooking: { status: "Pending" },
    },
  ]);

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
