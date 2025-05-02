'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { formatCurrency, formatDate, formatExchangeRate } from '@/lib/utils';
import { type Debt, type Payment, MonedaOrigenEnum } from '@/types';
import { ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DebtListProps {
  debts: Debt[];
  payments: Payment[];
  onSelectDebt: (debtId: string) => void;
  isLoading: boolean;
}

export default function DebtList({
  debts,
  payments,
  onSelectDebt,
  isLoading
}: DebtListProps) {
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const toggleExpand = (debtId: string) => {
    if (expandedDebtId === debtId) {
      setExpandedDebtId(null);
    } else {
      setExpandedDebtId(debtId);
    }
  };

  const viewPaymentHistory = (debt: Debt) => {
    setSelectedDebt(debt);
  };

  const closeDialog = () => {
    setSelectedDebt(null);
  };

  const getDebtPayments = (debtId: string) => {
    return payments
      .filter((payment) => payment.deuda_id === debtId)
      .sort(
        (a, b) =>
          new Date(b.payment_date).getTime() -
          new Date(a.payment_date).getTime()
      );
  };

  const getPaymentStatus = (debt: Debt) => {
    if (!debt.remainingBalance || debt.remainingBalance <= 0) {
      return <Badge className='bg-green-500 hover:bg-green-600'>Pagado</Badge>;
    } else if (debt.remainingBalance < debt.total_divisa) {
      return (
        <Badge className='bg-yellow-500 hover:bg-yellow-600'>Parcial</Badge>
      );
    } else {
      return <Badge className='bg-red-500 hover:bg-red-600'>Pendiente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {/* Desktop loading skeleton */}
        <div className='hidden md:block'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='flex items-center space-x-4'>
              <Skeleton className='h-12 w-full' />
            </div>
          ))}
        </div>

        {/* Mobile loading skeleton */}
        <div className='space-y-4 md:hidden'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-32 w-full rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {debts.length === 0 ? (
        <div className='text-muted-foreground py-8 text-center'>
          No hay deudas registradas aún. Agrega tu primera deuda para comenzar.
        </div>
      ) : (
        <div>
          {/* Desktop Table - Hidden on mobile */}
          <div className='hidden md:block'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[50px]'></TableHead>
                  <TableHead>Acreedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className='text-right'>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => (
                  <>
                    <TableRow key={debt.id} className='hover:bg-muted/50'>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => toggleExpand(debt.id)}
                        >
                          {expandedDebtId === debt.id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {debt.persona_name}
                      </TableCell>
                      <TableCell>{formatDate(debt.created_at)}</TableCell>
                      <TableCell>
                        {formatCurrency(
                          debt.total_divisa,
                          debt.original_currency
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          debt.remainingBalance || 0,
                          debt.original_currency
                        )}
                      </TableCell>
                      <TableCell>{getPaymentStatus(debt)}</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => viewPaymentHistory(debt)}
                          >
                            Historial
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedDebtId === debt.id && (
                      <TableRow>
                        <TableCell colSpan={7} className='bg-muted/30 p-4'>
                          <div className='space-y-2'>
                            <h4 className='font-medium'>Detalles</h4>
                            <p className='text-muted-foreground text-sm'>
                              {debt.description || 'Sin descripción'}
                            </p>
                            <div className='grid grid-cols-2 gap-2 text-sm md:grid-cols-4'>
                              <div>
                                <span className='font-medium'>Creado:</span>{' '}
                                {formatDate(debt.created_at)}
                              </div>
                              <div>
                                <span className='font-medium'>Moneda:</span>{' '}
                                {debt.original_currency}
                              </div>
                              <div>
                                <span className='font-medium'>
                                  Tasa de cambio:
                                </span>{' '}
                                {formatExchangeRate(debt.tasa_cambio)}
                              </div>
                              {debt.due_date && (
                                <div>
                                  <span className='font-medium'>
                                    Fecha límite:
                                  </span>{' '}
                                  {formatDate(debt.due_date)}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className='space-y-4 md:hidden'>
            {debts.map((debt) => (
              <div key={debt.id} className='overflow-hidden rounded-lg border'>
                <div className='bg-background p-4'>
                  <div className='mb-2 flex items-start justify-between'>
                    <h3 className='text-lg font-medium'>{debt.persona_name}</h3>
                    {getPaymentStatus(debt)}
                  </div>

                  <div className='mb-3 grid grid-cols-2 gap-2 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>Fecha:</span>{' '}
                      {formatDate(debt.created_at)}
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Total:</span>{' '}
                      {formatCurrency(
                        debt.total_divisa,
                        debt.original_currency
                      )}
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Restante:</span>{' '}
                      {formatCurrency(
                        debt.remainingBalance || 0,
                        debt.original_currency
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='justify-start'
                      onClick={() => toggleExpand(debt.id)}
                    >
                      {expandedDebtId === debt.id ? (
                        <ChevronUp size={16} className='mr-1' />
                      ) : (
                        <ChevronDown size={16} className='mr-1' />
                      )}
                      Detalles
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => viewPaymentHistory(debt)}
                    >
                      Historial
                    </Button>
                  </div>

                  {expandedDebtId === debt.id && (
                    <div className='mt-4 border-t pt-4'>
                      <div className='space-y-2'>
                        <h4 className='font-medium'>Detalles</h4>
                        <p className='text-muted-foreground text-sm'>
                          {debt.description || 'Sin descripción'}
                        </p>
                        <div className='grid grid-cols-1 gap-2 text-sm'>
                          <div>
                            <span className='font-medium'>Creado:</span>{' '}
                            {formatDate(debt.created_at)}
                          </div>
                          <div>
                            <span className='font-medium'>Moneda:</span>{' '}
                            {debt.original_currency}
                          </div>
                          <div>
                            <span className='font-medium'>Tasa de cambio:</span>{' '}
                            {formatExchangeRate(debt.tasa_cambio)}
                          </div>
                          {debt.due_date && (
                            <div>
                              <span className='font-medium'>Fecha límite:</span>{' '}
                              {formatDate(debt.due_date)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={selectedDebt !== null} onOpenChange={closeDialog}>
        <DialogContent className='max-h-[90vh] w-full max-w-3xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl'>
              Historial de Pagos - {selectedDebt?.persona_name}
            </DialogTitle>
          </DialogHeader>

          {selectedDebt && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
                <div>
                  <span className='font-medium'>Monto Total:</span>{' '}
                  {formatCurrency(
                    selectedDebt.total_divisa,
                    selectedDebt.original_currency
                  )}
                </div>
                <div>
                  <span className='font-medium'>Restante:</span>{' '}
                  {formatCurrency(
                    selectedDebt.remainingBalance || 0,
                    selectedDebt.original_currency
                  )}
                </div>
                <div>
                  <span className='font-medium'>Creado:</span>{' '}
                  {formatDate(selectedDebt.created_at)}
                </div>
                <div>
                  <span className='font-medium'>Estado:</span>{' '}
                  {getPaymentStatus(selectedDebt)}
                </div>
              </div>

              <h3 className='mt-4 text-lg font-medium'>Pagos</h3>

              {getDebtPayments(selectedDebt.id).length === 0 ? (
                <p className='text-muted-foreground'>
                  No hay pagos registrados aún.
                </p>
              ) : (
                <div className='-mx-6 overflow-x-auto'>
                  <div className='inline-block min-w-full px-6 align-middle'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Monto en Divisa</TableHead>
                          <TableHead className='hidden sm:table-cell'>
                            Monto en Bolívares
                          </TableHead>
                          <TableHead className='hidden md:table-cell'>
                            Tasa
                          </TableHead>
                          <TableHead className='hidden md:table-cell'>
                            Notas
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getDebtPayments(selectedDebt.id).map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {formatDate(payment.payment_date)}
                            </TableCell>
                            <TableCell>
                              {payment.pago_divisa !== null
                                ? formatCurrency(
                                    payment.pago_divisa,
                                    payment.original_currency
                                  )
                                : '-'}
                            </TableCell>
                            <TableCell className='hidden sm:table-cell'>
                              {payment.pago_bolivares !== null
                                ? formatCurrency(
                                    payment.pago_bolivares,
                                    MonedaOrigenEnum.VES
                                  )
                                : '-'}
                            </TableCell>
                            <TableCell className='hidden md:table-cell'>
                              {payment.tasa_cambio
                                ? `${formatExchangeRate(payment.tasa_cambio)} (${payment.tipo_tasa || 'N/A'})`
                                : '-'}
                            </TableCell>
                            <TableCell className='hidden md:table-cell'>
                              {payment.description || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Mobile-only payment details */}
              <div className='mt-2 space-y-4 md:hidden'>
                {getDebtPayments(selectedDebt.id).map((payment) => (
                  <div key={payment.id} className='rounded border p-3 text-sm'>
                    <div className='mb-1 font-medium'>
                      {formatDate(payment.payment_date)}
                    </div>
                    <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
                      <div>
                        <span className='text-muted-foreground'>Divisa:</span>{' '}
                        {payment.pago_divisa !== null
                          ? formatCurrency(
                              payment.pago_divisa,
                              payment.original_currency
                            )
                          : '-'}
                      </div>
                      <div>
                        <span className='text-muted-foreground'>
                          Bolívares:
                        </span>{' '}
                        {payment.pago_bolivares !== null
                          ? formatCurrency(
                              payment.pago_bolivares,
                              MonedaOrigenEnum.VES
                            )
                          : '-'}
                      </div>
                      <div>
                        <span className='text-muted-foreground'>Tasa:</span>{' '}
                        {payment.tasa_cambio
                          ? `${formatExchangeRate(payment.tasa_cambio)}`
                          : '-'}
                      </div>
                      {payment.tipo_tasa && (
                        <div>
                          <span className='text-muted-foreground'>Tipo:</span>{' '}
                          {payment.tipo_tasa}
                        </div>
                      )}
                      {payment.description && (
                        <div className='col-span-2'>
                          <span className='text-muted-foreground'>Notas:</span>{' '}
                          {payment.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
