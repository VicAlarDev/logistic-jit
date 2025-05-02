import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MonedaOrigenEnum } from '@/types';

interface DebtSummaryProps {
  totalDebt: number;
  totalRemaining: number;
  totalPaid: number;
  isLoading: boolean;
}

export default function DebtSummary({
  totalDebt,
  totalRemaining,
  totalPaid,
  isLoading
}: DebtSummaryProps) {
  const percentPaid =
    totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0;

  if (isLoading) {
    return (
      <>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Deuda Total</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <Skeleton className='mb-1 h-8 w-24' />
            <Skeleton className='h-4 w-32' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Restante</CardTitle>
            <ArrowUpIcon className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <Skeleton className='mb-1 h-8 w-24' />
            <Skeleton className='h-4 w-32' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pagado</CardTitle>
            <ArrowDownIcon className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <Skeleton className='mb-1 h-8 w-24' />
            <Skeleton className='mb-1 h-2 w-full rounded-full' />
            <Skeleton className='h-4 w-32' />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Deuda Total</CardTitle>
          <DollarSign className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatCurrency(totalDebt, MonedaOrigenEnum.USD)}
          </div>
          <p className='text-muted-foreground text-xs'>
            Monto total de todas las deudas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Restante</CardTitle>
          <ArrowUpIcon className='h-4 w-4 text-red-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatCurrency(totalRemaining, MonedaOrigenEnum.USD)}
          </div>
          <p className='text-muted-foreground text-xs'>Monto aún por pagar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Pagado</CardTitle>
          <ArrowDownIcon className='h-4 w-4 text-green-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatCurrency(totalPaid, MonedaOrigenEnum.USD)}
          </div>
          <div className='bg-muted mt-1 h-2 w-full rounded-full'>
            <div
              className='h-2 rounded-full bg-green-500'
              style={{ width: `${percentPaid}%` }}
            />
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {percentPaid}% de la deuda total pagada
          </p>
        </CardContent>
      </Card>
    </>
  );
}
