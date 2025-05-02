'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const EXPENSE_CATEGORIES = [
  'Combustible',
  'Peajes',
  'Viáticos',
  'Mantenimiento',
  'Reparaciones',
  'Hospedaje',
  'Alimentación',
  'Otros'
] as const;

const TASA_TIPOS = ['paralelo', 'bcv', 'promedio', 'custom'] as const;
const MONEDAS = ['USD', 'VES'] as const;

/** Esquema de validación **/
export const expenseSchema = z
  .object({
    category: z.string().min(1, 'Categoría requerida'),
    description: z.string().optional(),
    expense_date: z.string().min(1, 'Fecha requerida'),
    original_currency: z.enum(MONEDAS, {
      required_error: 'Moneda original requerida'
    }),
    pago_divisa: z.coerce.number().nonnegative('Debe ser ≥ 0').optional(),
    pago_bolivares: z.coerce.number().nonnegative('Debe ser ≥ 0').optional(),
    tasa_cambio: z.coerce
      .number()
      .positive('Tasa de cambio debe ser positiva')
      .optional(),
    tipo_tasa: z.enum(TASA_TIPOS).optional()
  })
  // Si la moneda original es USD, pago_divisa es obligatorio
  .refine(
    (d) =>
      d.original_currency === 'USD'
        ? d.pago_divisa !== undefined && d.pago_divisa > 0
        : true,
    {
      message: 'Debe ingresar el pago en USD',
      path: ['pago_divisa']
    }
  )
  // Si la moneda original es VES, pago_bolivares es obligatorio
  .refine(
    (d) =>
      d.original_currency === 'VES'
        ? d.pago_bolivares !== undefined && d.pago_bolivares > 0
        : true,
    {
      message: 'Debe ingresar el pago en VES',
      path: ['pago_bolivares']
    }
  )
  // Si hay pago en VES, se requiere tasa y tipo de tasa
  .refine(
    (d) =>
      d.pago_bolivares === undefined ||
      (d.tasa_cambio !== undefined && d.tipo_tasa !== undefined),
    {
      message:
        'Si hay pago en bolívares, la tasa de cambio y el tipo de tasa son obligatorios',
      path: ['tasa_cambio']
    }
  );

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export interface Expense {
  id: string;
  flete_id: string | null;
  category: string;
  description: string | null;
  expense_date: string;
  original_currency: (typeof MONEDAS)[number];
  pago_divisa: number | null;
  pago_bolivares: number | null;
  tasa_cambio: number | null;
  tipo_tasa: (typeof TASA_TIPOS)[number] | null;
  created_at: string;
  updated_at: string;
}

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExpense: Expense | null;
  onSubmitSuccess: (expense: Expense) => void;
  fleteId?: string;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  currentExpense,
  onSubmitSuccess,
  fleteId
}: ExpenseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<{
    bcv: { price: number; last_update: string };
    enparalelovzla: { price: number; last_update: string };
    promedio?: { price: number; last_update: string };
  } | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [customRate, setCustomRate] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: currentExpense?.category || '',
      description: currentExpense?.description || '',
      expense_date:
        currentExpense?.expense_date || format(new Date(), 'yyyy-MM-dd'),
      original_currency: currentExpense?.original_currency || 'USD',
      pago_divisa: currentExpense?.pago_divisa || undefined,
      pago_bolivares: currentExpense?.pago_bolivares || undefined,
      tasa_cambio: currentExpense?.tasa_cambio || undefined,
      tipo_tasa: currentExpense?.tipo_tasa || undefined
    }
  });

  // Reset form when currentExpense changes
  useEffect(() => {
    if (open) {
      form.reset({
        category: currentExpense?.category || '',
        description: currentExpense?.description || '',
        expense_date:
          currentExpense?.expense_date || format(new Date(), 'yyyy-MM-dd'),
        original_currency: currentExpense?.original_currency || 'USD',
        pago_divisa: currentExpense?.pago_divisa || undefined,
        pago_bolivares: currentExpense?.pago_bolivares || undefined,
        tasa_cambio: currentExpense?.tasa_cambio || undefined,
        tipo_tasa: currentExpense?.tipo_tasa || undefined
      });
    }
  }, [currentExpense, open, form]);

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const response = await fetch(
        'https://pydolarve.org/api/v2/dollar?page=alcambio&format_date=default&rounded_price=true'
      );
      const data = await response.json();

      if (data.monitors) {
        const bcvRate = data.monitors.bcv;
        const parallelRate = data.monitors.enparalelovzla;

        // Calculate average rate
        const avgRate = {
          price: Number.parseFloat(
            ((bcvRate.price + parallelRate.price) / 2).toFixed(2)
          ),
          last_update: data.datetime.date + ' ' + data.datetime.time
        };

        setExchangeRates({
          bcv: {
            price: bcvRate.price,
            last_update: bcvRate.last_update
          },
          enparalelovzla: {
            price: parallelRate.price,
            last_update: parallelRate.last_update
          },
          promedio: avgRate
        });
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('Error al obtener tasas de cambio');
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Fetch exchange rates on mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const origin = form.watch('original_currency');
  const pagoDiv = form.watch('pago_divisa');
  const pagoBs = form.watch('pago_bolivares');
  const tasa = form.watch('tasa_cambio');

  // Si la moneda original es VES, al cambiar pago_bolivares o tasa calculo pago_divisa
  useEffect(() => {
    if (
      origin === 'VES' &&
      pagoBs !== undefined &&
      !isNaN(pagoBs) &&
      tasa !== undefined &&
      tasa > 0
    ) {
      const div = Number.parseFloat((pagoBs / tasa).toFixed(2));
      form.setValue('pago_divisa', div, { shouldValidate: true });
    }
  }, [origin, pagoBs, tasa, form]);

  // Si la moneda original es USD, al cambiar pago_divisa o tasa calculo pago_bolivares
  useEffect(() => {
    if (
      origin === 'USD' &&
      pagoDiv !== undefined &&
      !isNaN(pagoDiv) &&
      tasa !== undefined &&
      tasa > 0
    ) {
      const bs = Number.parseFloat((pagoDiv * tasa).toFixed(2));
      form.setValue('pago_bolivares', bs, { shouldValidate: true });
    }
  }, [origin, pagoDiv, tasa, form]);

  // Update exchange rate when rate type changes
  useEffect(() => {
    const tipoTasa = form.watch('tipo_tasa');

    if (tipoTasa && exchangeRates && !customRate) {
      let rate;

      if (tipoTasa === 'bcv') {
        rate = exchangeRates.bcv.price;
      } else if (tipoTasa === 'paralelo') {
        rate = exchangeRates.enparalelovzla.price;
      } else if (tipoTasa === 'promedio') {
        rate = exchangeRates.promedio?.price;
      }

      if (rate) {
        form.setValue('tasa_cambio', rate, { shouldValidate: true });
      }
    }
  }, [form.watch('tipo_tasa'), exchangeRates, customRate, form]);

  const onSubmit = async (values: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      if (currentExpense) {
        const { data, error } = await supabase
          .from('gastos')
          .update({
            ...values,
            flete_id: fleteId ?? null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentExpense.id)
          .select()
          .single();
        if (error) throw error;
        onSubmitSuccess(data as Expense);
        toast.success('Gasto actualizado correctamente');
      } else {
        const { data, error } = await supabase
          .from('gastos')
          .insert({
            ...values,
            flete_id: fleteId ?? null
          })
          .select()
          .single();
        if (error) throw error;
        onSubmitSuccess(data as Expense);
        toast.success('Gasto creado correctamente');
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error('Supabase error:', err);
      toast.error(
        currentExpense
          ? 'Error al actualizar el gasto'
          : 'Error al crear el gasto'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentExpense ? 'Editar Gasto' : 'Agregar Gasto'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Categoría, descripción y fecha */}
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Seleccione...' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='expense_date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Moneda original */}
            <FormField
              control={form.control}
              name='original_currency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda Original</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='USD o VES' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONEDAS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Pago en USD */}
            <FormField
              control={form.control}
              name='pago_divisa'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pago en USD</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='0.00'
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Pago en VES */}
            <FormField
              control={form.control}
              name='pago_bolivares'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pago en VES</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='0.00'
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Tasa y tipo de tasa */}
            <FormField
              control={form.control}
              name='tasa_cambio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa de Cambio</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.0001'
                      placeholder='Ej. 24.0000'
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // If user manually changes the value, set customRate to true
                        const tipoTasa = form.watch('tipo_tasa');
                        if (tipoTasa && tipoTasa !== 'custom') {
                          form.setValue('tipo_tasa', 'custom');
                          setCustomRate(true);
                        }
                      }}
                    />
                  </FormControl>
                  {isLoadingRates && (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Cargando tasas de cambio...
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='tipo_tasa'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Tasa</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setCustomRate(false);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='—' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='paralelo'>Paralelo</SelectItem>
                      <SelectItem value='bcv'>BCV</SelectItem>
                      <SelectItem value='promedio'>Promedio</SelectItem>
                      <SelectItem value='custom'>Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.value && field.value !== 'custom' && exchangeRates && (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Última actualización:{' '}
                      {field.value === 'paralelo'
                        ? exchangeRates.enparalelovzla.last_update
                        : field.value === 'bcv'
                          ? exchangeRates.bcv.last_update
                          : exchangeRates.promedio?.last_update}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || form.formState.isSubmitting}
              >
                {isSubmitting
                  ? currentExpense
                    ? 'Actualizando...'
                    : 'Agregando...'
                  : currentExpense
                    ? 'Actualizar'
                    : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
