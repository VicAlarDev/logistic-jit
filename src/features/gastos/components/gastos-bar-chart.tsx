// features/gastos/components/gastos-bar-chart.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarGraphGastos } from './barchart';
import { useDateRange } from '@/hooks/date-context';
import { Gasto } from '@/types';

export default function GastosBarChart() {
  const { dateRange } = useDateRange();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    const fetchGastos = async () => {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const from = dateRange.from?.toISOString().slice(0, 10);
      const to = dateRange.to?.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .gte('expense_date', from)
        .lte('expense_date', to)
        .order('expense_date', { ascending: true });

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setGastos(data as Gasto[]);
      }

      setLoading(false);
    };

    fetchGastos();
  }, [dateRange]);

  if (loading) return <p className='p-4 text-gray-500'>Cargando datos…</p>;
  if (error) return <p className='p-4 text-red-600'>Error: {error}</p>;

  return (
    <BarGraphGastos gastos={gastos} from={dateRange?.from} to={dateRange?.to} />
  );
}
