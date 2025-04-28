import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import VehicleViewPage from '@/features/vehicles/vehicle-view-page';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Vehicle Details'
};

type PageProps = { params: Promise<{ vehicleId: string }> };

export default async function Page({ params }: PageProps) {
  const { vehicleId } = await params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <VehicleViewPage vehicleId={vehicleId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
