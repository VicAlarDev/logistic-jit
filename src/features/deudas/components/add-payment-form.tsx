// add-payment-form.tsx

'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type Debt,
  type Payment,
  MonedaOrigenEnum,
  TasaTipoEnum
} from '@/types';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

const formSchema = z.object({
  deuda_id: z.string().min(1, 'Por favor seleccione una deuda'),
  description: z.string().optional(),
  payment_date: z.date(),
  original_currency: z.nativeEnum(MonedaOrigenEnum),
  payment_type: z.enum(['divisa', 'bolivares']),
  pago_divisa: z.coerce
    .number()
    .positive('El monto debe ser mayor que 0')
    .nullable(),
  pago_bolivares: z.coerce
    .number()
    .positive('El monto debe ser mayor que 0')
    .nullable(),
  tasa_cambio: z.coerce
    .number()
    .positive('La tasa debe ser mayor que 0')
    .nullable(),
  tipo_tasa: z.nativeEnum(TasaTipoEnum).nullable()
});

type FormValues = z.infer<typeof formSchema>;

interface AddPaymentFormProps {
  debts: Debt[];
  onAddPayment: (
    payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
  ) => void;
  selectedDebtId: string | null;
}

export default function AddPaymentForm({
  debts,
  onAddPayment,
  selectedDebtId
}: AddPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const [exchangeRates, setExchangeRates] = useState<{
    bcv: { price: number; last_update: string };
    enparalelovzla: { price: number; last_update: string };
    promedio?: { price: number; last_update: string };
  } | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [customRate, setCustomRate] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deuda_id: selectedDebtId || '',
      description: '',
      payment_date: new Date(),
      original_currency: MonedaOrigenEnum.USD,
      payment_type: 'divisa',
      pago_divisa: null,
      pago_bolivares: null,
      tasa_cambio: null,
      tipo_tasa: null
    }
  });

  // Fetch exchange rates from API
  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const res = await fetch(
        'https://pydolarve.org/api/v2/dollar?page=alcambio&format_date=default&rounded_price=true'
      );
      const data = await res.json();
      if (data.monitors) {
        const bcv = data.monitors.bcv;
        const paralelo = data.monitors.enparalelovzla;
        const promedio = {
          price: parseFloat(((bcv.price + paralelo.price) / 2).toFixed(2)),
          last_update: data.datetime.date + ' ' + data.datetime.time
        };
        setExchangeRates({
          bcv: { price: bcv.price, last_update: bcv.last_update },
          enparalelovzla: {
            price: paralelo.price,
            last_update: paralelo.last_update
          },
          promedio
        });
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('Error al obtener tasa de cambio');
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Auto-set tasa_cambio when tipo_tasa changes
  const watchTipoTasa = form.watch('tipo_tasa');
  useEffect(() => {
    if (watchTipoTasa && exchangeRates && !customRate) {
      let rate: number | undefined;
      if (watchTipoTasa === TasaTipoEnum.BCV) {
        rate = exchangeRates.bcv.price;
      } else if (watchTipoTasa === TasaTipoEnum.PARALELO) {
        rate = exchangeRates.enparalelovzla.price;
      } else if (watchTipoTasa === TasaTipoEnum.PROMEDIO) {
        rate = exchangeRates.promedio?.price;
      }
      if (rate) {
        form.setValue('tasa_cambio', rate, { shouldValidate: true });
      }
    }
  }, [watchTipoTasa, exchangeRates, customRate, form]);

  // Update form when selectedDebtId changes
  useEffect(() => {
    if (selectedDebtId) {
      form.setValue('deuda_id', selectedDebtId);
      const debt = debts.find((d) => d.id === selectedDebtId);
      if (debt) {
        setSelectedDebt(debt);
        form.setValue('original_currency', debt.original_currency);
      }
    }
  }, [selectedDebtId, debts, form]);

  // Update selectedDebt when deuda_id changes
  const watchDebtId = form.watch('deuda_id');
  useEffect(() => {
    if (watchDebtId) {
      const debt = debts.find((d) => d.id === watchDebtId);
      if (debt) {
        setSelectedDebt(debt);
        form.setValue('original_currency', debt.original_currency);
      } else {
        setSelectedDebt(null);
      }
    } else {
      setSelectedDebt(null);
    }
  }, [watchDebtId, debts, form]);

  const watchPaymentType = form.watch('payment_type');

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Validations
      if (values.payment_type === 'divisa' && !values.pago_divisa) {
        form.setError('pago_divisa', {
          type: 'manual',
          message: 'El monto en divisa es requerido'
        });
        setIsSubmitting(false);
        return;
      }
      if (values.payment_type === 'bolivares') {
        if (!values.pago_bolivares) {
          form.setError('pago_bolivares', {
            type: 'manual',
            message: 'El monto en bolívares es requerido'
          });
          setIsSubmitting(false);
          return;
        }
        if (!values.tasa_cambio) {
          form.setError('tasa_cambio', {
            type: 'manual',
            message: 'La tasa de cambio es requerida para pagos en bolívares'
          });
          setIsSubmitting(false);
          return;
        }
        if (!values.tipo_tasa) {
          form.setError('tipo_tasa', {
            type: 'manual',
            message: 'El tipo de tasa es requerido para pagos en bolívares'
          });
          setIsSubmitting(false);
          return;
        }
      }

      const paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'> = {
        deuda_id: values.deuda_id,
        description: values.description || null,
        payment_date: values.payment_date.toISOString(),
        original_currency: values.original_currency,
        pago_divisa:
          values.payment_type === 'divisa' ? values.pago_divisa : null,
        pago_bolivares:
          values.payment_type === 'bolivares' ? values.pago_bolivares : null,
        tasa_cambio:
          values.payment_type === 'bolivares' ? values.tasa_cambio : null,
        tipo_tasa: values.payment_type === 'bolivares' ? values.tipo_tasa : null
      };

      onAddPayment(paymentData);
      form.reset();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unpaidDebts = debts.filter((debt) => (debt.remainingBalance || 0) > 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='deuda_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seleccionar Deuda</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccione una deuda para pagar' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {unpaidDebts.length === 0 ? (
                    <SelectItem value='no-debts' disabled>
                      No hay deudas pendientes disponibles
                    </SelectItem>
                  ) : (
                    unpaidDebts.map((debt) => (
                      <SelectItem key={debt.id} value={debt.id}>
                        {debt.persona_name} -{' '}
                        {formatCurrency(
                          debt.remainingBalance || 0,
                          debt.original_currency
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedDebt && (
          <div className='bg-muted/30 rounded-md border p-4'>
            <h4 className='mb-2 font-medium'>Detalles de la Deuda</h4>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div>
                <span className='font-medium'>Acreedor:</span>{' '}
                {selectedDebt.persona_name}
              </div>
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
                <span className='font-medium'>Moneda:</span>{' '}
                {selectedDebt.original_currency}
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name='payment_date'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Fecha de Pago</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant='outline'
                      className={`w-full pl-3 text-left font-normal ${
                        !field.value && 'text-muted-foreground'
                      }`}
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
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='payment_type'
          render={({ field }) => (
            <FormItem className='space-y-3'>
              <FormLabel>Tipo de Pago</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className='flex flex-col space-y-1'
                >
                  <div className='hover:bg-muted flex cursor-pointer items-center space-x-2 rounded-md border p-3'>
                    <RadioGroupItem value='divisa' id='divisa' />
                    <Label htmlFor='divisa' className='cursor-pointer'>
                      Pago en Divisa ({selectedDebt?.original_currency || 'USD'}
                      )
                    </Label>
                  </div>
                  <div className='hover:bg-muted flex cursor-pointer items-center space-x-2 rounded-md border p-3'>
                    <RadioGroupItem value='bolivares' id='bolivares' />
                    <Label htmlFor='bolivares' className='cursor-pointer'>
                      Pago en Bolívares (VES)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchPaymentType === 'divisa' && (
          <FormField
            control={form.control}
            name='pago_divisa'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto en {selectedDebt?.original_currency || 'Divisa'}
                </FormLabel>
                <FormControl>
                  <div className='relative'>
                    <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        {selectedDebt?.original_currency ===
                        MonedaOrigenEnum.USD
                          ? '$'
                          : 'Bs.  '}
                      </span>
                    </div>
                    <Input
                      type='number'
                      step='0.01'
                      min='0.01'
                      max={selectedDebt?.remainingBalance}
                      placeholder='0.00'
                      className='pl-9'
                      {...field}
                      value={field.value === null ? '' : field.value}
                      onChange={(e) => {
                        const v =
                          e.target.value === ''
                            ? null
                            : parseFloat(e.target.value);
                        field.onChange(v);
                      }}
                    />
                  </div>
                </FormControl>
                {selectedDebt && (
                  <FormDescription>
                    Máximo pago:{' '}
                    {formatCurrency(
                      selectedDebt.remainingBalance || 0,
                      selectedDebt.original_currency
                    )}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {watchPaymentType === 'bolivares' && (
          <>
            <FormField
              control={form.control}
              name='pago_bolivares'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto en Bolívares</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                        <span className='text-gray-500 dark:text-gray-400'>
                          Bs.
                        </span>
                      </div>
                      <Input
                        type='number'
                        step='0.01'
                        min='0.01'
                        placeholder='0.00'
                        className='pl-9'
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => {
                          const v =
                            e.target.value === ''
                              ? null
                              : parseFloat(e.target.value);
                          field.onChange(v);
                        }}
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
                  <FormLabel>Tasa de Cambio</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.000001'
                      min='0.000001'
                      placeholder='Tasa de cambio'
                      {...field}
                      value={field.value === null ? '' : field.value}
                      onChange={(e) => {
                        const v =
                          e.target.value === ''
                            ? null
                            : parseFloat(e.target.value);
                        field.onChange(v);
                        const curr = form.getValues('tipo_tasa');
                        if (curr && curr !== TasaTipoEnum.CUSTOM) {
                          form.setValue('tipo_tasa', TasaTipoEnum.CUSTOM);
                          setCustomRate(true);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {isLoadingRates
                      ? 'Cargando tasa de cambio...'
                      : `Tasa de cambio para conversión de bolívares a ${
                          selectedDebt?.original_currency || 'divisa'
                        }`}
                  </FormDescription>
                  <FormMessage />
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
                    value={field.value || undefined}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setCustomRate(false);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Seleccione tipo de tasa' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TasaTipoEnum.PARALELO}>
                        Paralelo
                      </SelectItem>
                      <SelectItem value={TasaTipoEnum.BCV}>BCV</SelectItem>
                      <SelectItem value={TasaTipoEnum.PROMEDIO}>
                        Promedio
                      </SelectItem>
                      <SelectItem value={TasaTipoEnum.CUSTOM}>Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.value &&
                    field.value !== TasaTipoEnum.CUSTOM &&
                    exchangeRates && (
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Última actualización:{' '}
                        {field.value === TasaTipoEnum.PARALELO
                          ? exchangeRates.enparalelovzla.last_update
                          : field.value === TasaTipoEnum.BCV
                            ? exchangeRates.bcv.last_update
                            : exchangeRates.promedio?.last_update}
                      </p>
                    )}
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Agrega cualquier detalle adicional sobre este pago'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type='submit'
          className='w-full'
          disabled={isSubmitting || !selectedDebt || unpaidDebts.length === 0}
        >
          {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </form>
    </Form>
  );
}
