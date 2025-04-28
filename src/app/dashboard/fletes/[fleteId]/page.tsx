import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import FleteViewPage from '@/features/fletes/flete-view-page';

export const metadata = {
  title: 'Dashboard: Flete Details'
};

type PageProps = { params: Promise<{ fleteId: string }> };

export default async function Page({ params }: PageProps) {
  const { fleteId } = await params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <FleteViewPage fleteId={fleteId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
