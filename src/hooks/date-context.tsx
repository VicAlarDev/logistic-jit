'use client';

import { createContext, useContext, useState } from 'react';
import { addDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

type DateContextType = {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
};

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  });

  return (
    <DateContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDateRange debe usarse dentro de un DateProvider');
  }
  return context;
}
