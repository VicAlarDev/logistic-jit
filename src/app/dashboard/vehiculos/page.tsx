import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import VehicleListingPage from '@/features/vehicles/vehicle-listing';

export const metadata = {
  title: 'Dashboard: Vehicles'
};

type PageProps = { searchParams: Promise<SearchParams> };

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  searchParamsCache.parse(params);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <Heading title='Vehicles' description='Manage your fleet vehicles' />
          <Link
            href='/dashboard/vehiculos/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> Add New
          </Link>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={0} />
          }
        >
          <VehicleListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
