'use client';

import React, { Suspense } from 'react';
import { useDateRange } from '@/hooks/date-context';
import PageContainer from '@/components/layout/page-container';
import { DatePickerWithRange } from '@/components/date-picker-with-range';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GastosBarChart from '@/features/gastos/components/gastos-bar-chart';
import { BarGraphSkeleton } from '../overview/components/bar-graph-skeleton';
import { RecentGastos } from '@/features/gastos/components/recent-gastos';
import { RecentSalesSkeleton } from '../overview/components/recent-sales-skeleton';
import { AreaGraphSkeleton } from '../overview/components/area-graph-skeleton';
import GastosAreaChart from './components/gastos-area-chart';
import { Heading } from '@/components/ui/heading';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import GastosListingPage from '@/features/gastos/gastos-listing';

export default function GastosContent() {
  const { dateRange, setDateRange } = useDateRange();

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <h2 className='text-2xl font-bold tracking-tight'>Gastos 👋</h2>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        <Tabs defaultValue='resumen' className='w-full'>
          <TabsList className='mb-4'>
            <TabsTrigger value='resumen'>Resumen</TabsTrigger>
            <TabsTrigger value='todos'>Todos los gastos</TabsTrigger>
          </TabsList>

          <TabsContent value='resumen'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-4'>
                <Suspense fallback={<BarGraphSkeleton />}>
                  <GastosBarChart />
                </Suspense>
              </div>
              <div className='col-span-4 md:col-span-3'>
                <Suspense fallback={<RecentSalesSkeleton />}>
                  <RecentGastos />
                </Suspense>
              </div>
              <div className='col-span-4'>
                <Suspense fallback={<AreaGraphSkeleton />}>
                  <GastosAreaChart />
                </Suspense>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='todos'>
            <div className='flex flex-1 flex-col space-y-4'>
              <div className='flex items-center justify-between'>
                <Heading title='Fletes' description='Administra los fletes' />
                <Link
                  href='/dashboard/fletes/new'
                  className={cn(buttonVariants(), 'text-xs md:text-sm')}
                >
                  <IconPlus className='mr-2 h-4 w-4' /> Crear nuevo flete
                </Link>
              </div>
              <Separator />
              <Suspense
                fallback={
                  <DataTableSkeleton
                    columnCount={5}
                    rowCount={8}
                    filterCount={4}
                  />
                }
              >
                <GastosListingPage />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
