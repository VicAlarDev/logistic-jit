import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

import { searchParamsCache } from '@/lib/searchparams';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import GastosListingPage from '@/features/gastos/gastos-listing';

import type { SearchParams } from 'nuqs/server';
import { NewExpenseButton } from '@/features/gastos/components/new-expense-button';

export const metadata = {
  title: 'Dashboard: Gastos'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <Heading title='Gastos' description='Administrar los gastos' />
          <NewExpenseButton />
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={4} />
          }
        >
          <GastosListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
