'use client';

import React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Gasto } from '@/types';

interface AreaGraphGastosProps {
  gastos: Gasto[];
  from?: Date;
  to?: Date;
}

const chartConfig = {
  bolivares: {
    label: 'Bolívares',
    color: 'var(--destructive)'
  },
  divisa: {
    label: 'Divisa',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function AreaGraphGastos({ gastos, from, to }: AreaGraphGastosProps) {
  // 1) Agrupar por mes
  const data = React.useMemo(() => {
    const map = new Map<
      string,
      { month: string; bolivares: number; divisa: number }
    >();
    gastos.forEach((g) => {
      const d = new Date(g.expense_date);
      const key = d.toISOString().slice(0, 7); // "YYYY-MM"
      const lbl = d.toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric'
      }); // "abr. 2025"
      if (!map.has(key)) {
        map.set(key, { month: lbl, bolivares: 0, divisa: 0 });
      }
      const e = map.get(key)!;
      e.bolivares += g.pago_bolivares ?? 0;
      e.divisa += g.pago_divisa ?? 0;
    });
    return Array.from(map.values()).sort(
      (a, b) => Date.parse(a.month) - Date.parse(b.month)
    );
  }, [gastos]);

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Gastos Mensuales</CardTitle>
        {from && to && (
          <CardDescription>
            {from.toLocaleDateString()} – {to.toLocaleDateString()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer config={chartConfig} className='h-[250px] w-full'>
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id='fillBolivares' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor={chartConfig.bolivares.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor={chartConfig.bolivares.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillDivisa' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor={chartConfig.divisa.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor={chartConfig.divisa.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => v.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='bolivares'
              type='natural'
              fill='url(#fillBolivares)'
              stroke={chartConfig.bolivares.color}
              stackId='a'
            />
            <Area
              dataKey='divisa'
              type='natural'
              fill='url(#fillDivisa)'
              stroke={chartConfig.divisa.color}
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-center justify-between text-sm'>
          <span>
            {from && to
              ? `Periodo: ${from.toLocaleDateString()} – ${to.toLocaleDateString()}`
              : ''}
          </span>
          <span className='text-muted-foreground flex items-center gap-1'>
            Tendencia <IconTrendingUp className='h-4 w-4' />
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
