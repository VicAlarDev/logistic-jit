// 2. Layout (sin cambios)
// app/dashboard/gastos/layout.tsx
'use client';

import type React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/date-picker-with-range';
import { DateProvider, useDateRange } from '@/hooks/date-context';

function GastosLayoutContent({
  gastos,
  bar_stats,
  area_stats
}: {
  gastos: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const { dateRange, setDateRange } = useDateRange();

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <h2 className='text-2xl font-bold tracking-tight'>Gastos 👋</h2>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{gastos}</div>
          <div className='col-span-4'>{area_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}

export default function GastosLayout({
  gastos,
  bar_stats,
  area_stats
}: {
  gastos: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <DateProvider>
      <GastosLayoutContent
        gastos={gastos}
        bar_stats={bar_stats}
        area_stats={area_stats}
      />
    </DateProvider>
  );
}
