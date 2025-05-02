'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Gasto } from '@/types';

export function RecentGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGastos = async () => {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .limit(5)
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
  }, []);
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Gastos Recientes</CardTitle>
        <CardDescription>
          Se registraron {gastos.length} gasto{gastos.length !== 1 ? 's' : ''}{' '}
          este mes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {gastos.map((gasto) => {
            // Primeras dos letras de la categoría para la fallback del avatar
            const initials = gasto.category.slice(0, 2).toUpperCase();

            // Formateo de fecha (por ej. 28/04/2025)
            const date = new Date(gasto.expense_date).toLocaleDateString(
              'es-VE',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }
            );

            // Elegir monto y moneda
            const amount =
              gasto.pago_divisa != null
                ? `${gasto.original_currency} ${gasto.pago_divisa.toFixed(2)}`
                : `Bs ${gasto.pago_bolivares?.toFixed(2)}`;

            // Color rojo para negativos
            const amountClass = 'ml-auto font-medium text-red-600';

            return (
              <div key={gasto.id} className='flex items-center'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className='ml-4 space-y-1'>
                  <p className='text-sm font-medium'>{gasto.category}</p>
                  {gasto.description && (
                    <p className='text-muted-foreground text-sm'>
                      {gasto.description}
                    </p>
                  )}
                  <p className='text-muted-foreground text-xs'>{date}</p>
                </div>

                <div className={amountClass}>{amount}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
