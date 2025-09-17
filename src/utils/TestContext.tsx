// src/context/TestsContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

export interface SlotBooking {
  status: "Pending" | "Booked" | "Cancelled" | "Compeleted";
  scheduledTime?: string;
}

export interface Test {
  id: number;
  name: string;
  status: "Pass" | "Fail" | "Pending" | "-";
  action : string;
  score: number;
  slotBooking: SlotBooking;
}

interface TestsContextType {
  tests: Test[];
  setTests:  React.Dispatch<React.SetStateAction<Test[]>>;
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
      action: "Compeleted",
      slotBooking: { status: null, scheduledTime: "" },
    },
    {
      id: 2,
      name: "Screening Test",
      status: "Fail",
      score: null,
      action: "",
      slotBooking: { status: null, scheduledTime: "" },
    },
    {
      id: 3,
      name: "Technical Interview",
      status: "Pending",
      score: null,
      action:"slot-book",
      slotBooking: { status: "Pending" },
    },
    {
      id: 4,
      name: "Culture fit Interview",
      status: "Pending",
      action:"slot-book",
      score: null,
      slotBooking: { status: "Compeleted" },
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
