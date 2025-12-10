import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DashboardRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | undefined>(undefined);

export const DashboardRefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <DashboardRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </DashboardRefreshContext.Provider>
  );
};

export const useDashboardRefresh = () => {
  const context = useContext(DashboardRefreshContext);
  if (context === undefined) {
    throw new Error('useDashboardRefresh must be used within a DashboardRefreshProvider');
  }
  return context;
};
