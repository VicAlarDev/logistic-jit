import DebtDashboard from '@/features/deudas/components/debt-dashboard';
import PageContainer from '@/components/layout/page-container';

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <h1 className='text-foreground mb-6 text-3xl font-bold'>
          Gestión de Deudas
        </h1>
        <DebtDashboard />
      </div>
    </PageContainer>
  );
}
