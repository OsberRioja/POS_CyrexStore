import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type VisualBranchFilterContextValue = {
  selectedBranchId: number | null;
  setSelectedBranchId: (branchId: number | null) => void;
  clearSelectedBranch: () => void;
};

const STORAGE_KEY = 'visualSelectedBranch';

const VisualBranchFilterContext = createContext<VisualBranchFilterContextValue | undefined>(undefined);

export function VisualBranchFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranchId, setSelectedBranchIdState] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setSelectedBranchIdState(saved ? Number(saved) : null);
  }, []);

  const setSelectedBranchId = (branchId: number | null) => {
    setSelectedBranchIdState(branchId);
    if (branchId === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(branchId));
  };

  const value = useMemo(() => ({
    selectedBranchId,
    setSelectedBranchId,
    clearSelectedBranch: () => setSelectedBranchId(null),
  }), [selectedBranchId]);

  return <VisualBranchFilterContext.Provider value={value}>{children}</VisualBranchFilterContext.Provider>;
}

export function useVisualBranchFilter() {
  const context = useContext(VisualBranchFilterContext);
  if (!context) throw new Error('useVisualBranchFilter must be used within VisualBranchFilterProvider');
  return context;
}
