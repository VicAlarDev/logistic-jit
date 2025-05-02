'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { calculateRemainingBalance } from '@/lib/utils';
import { Debt, Payment } from '@/types';
import { toast } from 'sonner';
import DebtSummary from './debt-summary';
import DebtList from './debt-list';
import AddDebtForm from '@/features/deudas/components/add-debt-form';
import AddPaymentForm from './add-payment-form';

export default function DebtDashboard() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Fetch data from Supabase
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch debts
      const { data: debtsData, error: debtsError } = await supabase
        .from('deudas_personales')
        .select('*')
        .order('created_at', { ascending: false });

      if (debtsError) throw debtsError;

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('pagos_deuda')
        .select('*')
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Calculate remaining balance for each debt
      const debtsWithBalance = debtsData.map((debt) => ({
        ...debt,
        remainingBalance: calculateRemainingBalance(debt, paymentsData)
      }));

      setDebts(debtsWithBalance);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addDebt = async (
    newDebt: Omit<Debt, 'id' | 'created_at' | 'updated_at' | 'remainingBalance'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('deudas_personales')
        .insert([newDebt])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const addedDebt = {
          ...data[0],
          remainingBalance: data[0].total_divisa
        };

        setDebts((prev) => [addedDebt, ...prev]);

        toast.success(`Deuda a ${newDebt.persona_name} ha sido registrada.`);
      }
    } catch (error) {
      console.error('Error adding debt:', error);
      toast.error('Error al registrar deuda');
    }
  };

  const addPayment = async (
    newPayment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('pagos_deuda')
        .insert([newPayment])
        .select();

      if (error) throw error;

      // Refresh data to get updated balances (the trigger will update the debt)
      await fetchData();

      toast.success('Pago registrado correctamente');
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Error al registrar pago');
    }
  };

  const openPaymentModal = (debt: Debt) => {
    setPaymentDebt(debt);
    setIsPaymentModalOpen(true);
  };

  const selectDebt = (debtId: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (debt) {
      openPaymentModal(debt);
    }
    setSelectedDebtId(debtId);
  };

  // Calculate total debt and remaining balance
  const totalDebt = debts.reduce((sum, debt) => sum + debt.total_divisa, 0);
  const totalRemaining = debts.reduce(
    (sum, debt) => sum + (debt.remainingBalance || 0),
    0
  );
  const totalPaid = totalDebt - totalRemaining;

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <DebtSummary
          totalDebt={totalDebt}
          totalRemaining={totalRemaining}
          totalPaid={totalPaid}
          isLoading={isLoading}
        />
      </div>

      <Tabs defaultValue='debts' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='debts'>Deudas</TabsTrigger>
          <TabsTrigger value='add-debt'>Agregar Deuda</TabsTrigger>
          <TabsTrigger value='add-payment'>Registrar Pago</TabsTrigger>
        </TabsList>

        <TabsContent value='debts'>
          <Card>
            <CardHeader>
              <CardTitle>Tus Deudas</CardTitle>
            </CardHeader>
            <CardContent>
              <DebtList
                debts={debts}
                payments={payments}
                onSelectDebt={selectDebt}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='add-debt'>
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nueva Deuda</CardTitle>
            </CardHeader>
            <CardContent>
              <AddDebtForm onAddDebt={addDebt} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='add-payment'>
          <Card>
            <CardHeader>
              <CardTitle>Registrar Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <AddPaymentForm
                debts={debts}
                onAddPayment={addPayment}
                selectedDebtId={selectedDebtId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
