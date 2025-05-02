'use client';

import React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
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

interface BarGraphProps {
  gastos: Gasto[];
  from?: Date;
  to?: Date;
}

// Solo métricas que realmente usamos
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

// Extraemos el tipo de clave de chartConfig
type MetricKey = keyof typeof chartConfig; // "bolivares" | "divisa"

export function BarGraphGastos({ gastos, from, to }: BarGraphProps) {
  const [activeChart, setActiveChart] = React.useState<MetricKey>('bolivares');

  // 1) Agrupamos por fecha
  const chartData = React.useMemo(() => {
    const map = new Map<
      string,
      { date: string; bolivares: number; divisa: number }
    >();
    gastos.forEach((g) => {
      const date = g.expense_date;
      if (!map.has(date)) {
        map.set(date, { date, bolivares: 0, divisa: 0 });
      }
      const entry = map.get(date)!;
      entry.bolivares += g.pago_bolivares ?? 0;
      entry.divisa += g.pago_divisa ?? 0;
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [gastos]);

  // 2) Totales
  const total = React.useMemo(
    () => ({
      bolivares: chartData.reduce((s, d) => s + d.bolivares, 0),
      divisa: chartData.reduce((s, d) => s + d.divisa, 0)
    }),
    [chartData]
  );

  // 3) Render solo en cliente
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Gastos</CardTitle>
          <CardDescription>
            Total acumulado en {activeChart === 'bolivares' ? 'Bs' : 'divisa'}:{' '}
            {total[activeChart].toLocaleString('es-VE', {
              style: 'currency',
              currency: activeChart === 'bolivares' ? 'VES' : 'USD',
              minimumFractionDigits: 2
            })}
          </CardDescription>
          {from && to && (
            <CardDescription>
              {from.toLocaleDateString('es-VE')} –{' '}
              {to.toLocaleDateString('es-VE')}
            </CardDescription>
          )}
        </div>

        <div className='flex'>
          {(Object.keys(chartConfig) as MetricKey[]).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
              onClick={() => setActiveChart(key)}
            >
              <span className='text-muted-foreground text-xs'>
                {chartConfig[key].label}
              </span>
              <span className='text-lg leading-none font-bold sm:text-3xl'>
                {total[key].toLocaleString('es-VE')}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor={chartConfig[activeChart].color}
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor={chartConfig[activeChart].color}
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short'
                })
              }
            />
            <ChartTooltip
              cursor={{
                fill: chartConfig[activeChart].color,
                opacity: 0.1
              }}
              content={
                <ChartTooltipContent
                  className='w-[150px]'
                  nameKey={activeChart}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  }
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill='url(#fillBar)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
