import React, { createContext, useState, useContext, ReactNode } from 'react';

export type TrailItem =
  | { type: 'search'; term: string; timestamp: Date }
  | { type: 'view_hts'; hts: string; description: string; timestamp: Date };

interface ResearchTrailContextType {
  trail: TrailItem[];
  addTrailItem: (item: Omit<TrailItem, 'timestamp'>) => void;
  clearTrail: () => void;
}

const ResearchTrailContext = createContext<ResearchTrailContextType | undefined>(undefined);

export const useResearchTrail = () => {
  const context = useContext(ResearchTrailContext);
  if (!context) {
    throw new Error('useResearchTrail must be used within a ResearchTrailProvider');
  }
  return context;
};

interface ResearchTrailProviderProps {
  children: ReactNode;
}

export const ResearchTrailProvider = ({ children }: ResearchTrailProviderProps) => {
  const [trail, setTrail] = useState<TrailItem[]>([]);

  const addTrailItem = (item: Omit<TrailItem, 'timestamp'>) => {
    const newItem = { ...item, timestamp: new Date() };
    // Avoid adding consecutive duplicates
    if (trail.length > 0) {
        const lastItem = trail[trail.length - 1];
        if (lastItem.type === newItem.type && 'term' in lastItem && 'term' in newItem && lastItem.term === newItem.term) return;
        if (lastItem.type === newItem.type && 'hts' in lastItem && 'hts' in newItem && lastItem.hts === newItem.hts) return;
    }
    setTrail(prevTrail => [newItem, ...prevTrail]);
  };

  const clearTrail = () => {
    setTrail([]);
  };

  const value = {
    trail,
    addTrailItem,
    clearTrail,
  };

  return <ResearchTrailContext.Provider value={value}>{children}</ResearchTrailContext.Provider>;
};
