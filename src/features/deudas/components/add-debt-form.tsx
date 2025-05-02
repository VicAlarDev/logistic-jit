'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Debt, MonedaOrigenEnum } from '@/types';

const formSchema = z.object({
  persona_name: z.string().min(1, 'El nombre del acreedor es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  original_currency: z.nativeEnum(MonedaOrigenEnum),
  total_divisa: z.coerce.number().positive('El monto debe ser mayor que 0'),
  tasa_cambio: z.coerce
    .number()
    .positive('La tasa debe ser mayor que 0')
    .nullable()
    .optional(),
  due_date: z.date().nullable().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface AddDebtFormProps {
  onAddDebt: (
    debt: Omit<Debt, 'id' | 'created_at' | 'updated_at' | 'remainingBalance'>
  ) => void;
}

export default function AddDebtForm({ onAddDebt }: AddDebtFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      persona_name: '',
      description: '',
      original_currency: MonedaOrigenEnum.USD,
      total_divisa: undefined,
      tasa_cambio: null,
      due_date: null
    }
  });

  const watchCurrency = form.watch('original_currency');

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Format the date to ISO string if it exists
      const due_date = values.due_date ? values.due_date.toISOString() : null;

      onAddDebt({
        persona_name: values.persona_name,
        description: values.description,
        original_currency: values.original_currency,
        total_divisa: values.total_divisa,
        tasa_cambio: values.tasa_cambio ?? null,
        due_date
      });

      form.reset();
    } catch (error) {
      toast.error('Error al crear deuda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='persona_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acreedor</FormLabel>
              <FormControl>
                <Input
                  placeholder='Ingrese el nombre del acreedor'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                La persona u organización a la que le debes dinero.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Describa el motivo de la deuda'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='original_currency'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccione la moneda' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={MonedaOrigenEnum.USD}>
                      USD (Dólar)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='total_divisa'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        {watchCurrency === MonedaOrigenEnum.USD ? '$' : 'Bs.'}
                      </span>
                    </div>
                    <Input
                      type='number'
                      step='0.01'
                      min='0.01'
                      placeholder='0.00'
                      className='pl-7'
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='tasa_cambio'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tasa de Cambio (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    step='0.000001'
                    min='0.000001'
                    placeholder='Tasa de cambio'
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={(e) => {
                      const value =
                        e.target.value === ''
                          ? null
                          : Number.parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Tasa de cambio para conversión a bolívares.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='due_date'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Fecha Límite (Opcional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={`w-full pl-3 text-left font-normal ${!field.value && 'text-muted-foreground'}`}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: es })
                      ) : (
                        <span>Seleccione una fecha</span>
                      )}
                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date('1900-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Fecha límite para pagar esta deuda.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? 'Agregando...' : 'Agregar Deuda'}
        </Button>
      </form>
    </Form>
  );
}
