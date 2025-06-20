'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { addFlete, updateFlete } from '@/app/actions/flete';
import type { Driver, Flete } from '@/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import ExpensesManager from '@/features/fletes/expenses-manager';
import InvoicesManager from '@/features/fletes/invoices-manager';

interface Cliente {
  id: string;
  nombre: string;
}

// — Schemas Zod —
const facturaSchema = z.object({
  invoice_number: z.string().min(1, 'Requerido'),
  client_name: z.string().min(1, 'Requerido'),
  load_date: z.string().min(1, 'Requerido'),
  delivery_date: z.string().optional(),
  state_dest: z.string().optional(),
  city_dest: z.string().optional(),
  weight_kg: z.coerce.number().optional(),
  observation: z.string().optional(),
  driver_id: z.string().optional()
});

const formSchema = z
  .object({
    fo_number: z.string().min(1, 'Requerido'),
    driver_id: z.string().optional(),
    cliente_id: z.string().min(1, 'Requerido'),
    status: z.enum(
      ['En Transito', 'Despachado', 'Relacionado', 'Facturado', 'Pagado'],
      {
        required_error: 'Requerido'
      }
    ),
    destination: z.string().min(1, 'Requerido'),
    costo_aproximado: z.coerce.number().nonnegative('Debe ser ≥ 0').optional(),

    // — campos de pago —
    pago_fecha: z.string().optional(),
    monto_pagado_origen: z.coerce
      .number()
      .nonnegative('Debe ser ≥ 0')
      .optional(),
    moneda_origen: z.enum(['USD', 'VES']),
    tasa_cambio: z.coerce.number().positive('Debe ser > 0').optional(),

    // — campos de pago chofer —
    monto_pago_chofer: z.coerce.number().nonnegative('Debe ser ≥ 0').optional(),
    pagado_chofer: z.boolean().optional(),
    fecha_pago_chofer: z.string().optional(),
    pago_moneda_chofer: z.enum(['USD', 'VES']).default('USD'),
    pago_tasa_cambio_chofer: z.coerce
      .number()
      .positive('Debe ser > 0')
      .optional(),

    // — campos de pago ayudante —
    monto_pago_ayudante: z.coerce
      .number()
      .nonnegative('Debe ser ≥ 0')
      .optional(),
    pagado_ayudante: z.boolean().optional(),
    fecha_pago_ayudante: z.string().optional(),
    pago_moneda_ayudante: z.enum(['USD', 'VES']).default('USD'),
    pago_tasa_cambio_ayudante: z.coerce
      .number()
      .positive('Debe ser > 0')
      .optional(),

    facturas: z.array(facturaSchema).optional()
  })
  // Validaciones condicionales
  .refine(
    (d) =>
      d.status !== 'Pagado' || (d.pago_fecha && d.monto_pagado_origen != null),
    {
      message:
        'Cuando el status es "Pagado", la fecha y el monto de pago son requeridos',
      path: ['pago_fecha']
    }
  )
  .refine(
    (d) =>
      d.status !== 'Pagado' ||
      d.moneda_origen === 'USD' ||
      (d.moneda_origen === 'VES' && d.tasa_cambio != null),
    {
      message: 'Cuando la moneda es VES, la tasa de cambio es requerida',
      path: ['tasa_cambio']
    }
  )
  .refine(
    (d) =>
      !d.pagado_chofer ||
      !d.fecha_pago_chofer ||
      d.fecha_pago_chofer.length > 0,
    {
      message:
        'La fecha de pago es requerida cuando el chofer está marcado como pagado',
      path: ['fecha_pago_chofer']
    }
  )
  .refine(
    (d) =>
      !d.pagado_chofer ||
      d.pago_moneda_chofer === 'USD' ||
      (d.pago_moneda_chofer === 'VES' && d.pago_tasa_cambio_chofer != null),
    {
      message:
        'Cuando la moneda del chofer es VES, la tasa de cambio es requerida',
      path: ['pago_tasa_cambio_chofer']
    }
  )
  .refine(
    (d) =>
      !d.pagado_ayudante ||
      !d.fecha_pago_ayudante ||
      d.fecha_pago_ayudante.length > 0,
    {
      message:
        'La fecha de pago es requerida cuando el ayudante está marcado como pagado',
      path: ['fecha_pago_ayudante']
    }
  )
  .refine(
    (d) =>
      !d.pagado_ayudante ||
      d.pago_moneda_ayudante === 'USD' ||
      (d.pago_moneda_ayudante === 'VES' && d.pago_tasa_cambio_ayudante != null),
    {
      message:
        'Cuando la moneda del ayudante es VES, la tasa de cambio es requerida',
      path: ['pago_tasa_cambio_ayudante']
    }
  );

export type FleteFormValues = z.infer<typeof formSchema> & { id?: string };

interface FleteFormPageProps {
  initialData: Flete | null;
  pageTitle: string;
}

export default function FleteFormPage({
  initialData,
  pageTitle
}: FleteFormPageProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);
  const supabase = createClient();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isPristine, setIsPristine] = useState(true);

  const form = useForm<FleteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fo_number: initialData?.fo_number || '',
      driver_id: initialData?.driver_id || undefined,
      cliente_id: initialData?.cliente_id || '',
      status: initialData?.status || 'En Transito',
      destination: initialData?.destination || '',
      costo_aproximado: initialData?.costo_aproximado ?? undefined,

      pago_fecha: initialData?.pago_fecha ?? undefined,
      monto_pagado_origen: initialData?.monto_pagado_origen ?? undefined,
      moneda_origen: initialData?.moneda_origen || 'USD',
      tasa_cambio: initialData?.tasa_cambio ?? undefined,

      // Nuevos campos chofer
      monto_pago_chofer: initialData?.monto_pago_chofer ?? undefined,
      pagado_chofer: initialData?.pagado_chofer ?? false,
      fecha_pago_chofer: initialData?.fecha_pago_chofer ?? undefined,
      pago_moneda_chofer: initialData?.pago_moneda_chofer || 'USD',
      pago_tasa_cambio_chofer:
        initialData?.pago_tasa_cambio_chofer ?? undefined,

      // Nuevos campos ayudante
      monto_pago_ayudante: initialData?.monto_pago_ayudante ?? undefined,
      pagado_ayudante: initialData?.pagado_ayudante ?? false,
      fecha_pago_ayudante: initialData?.fecha_pago_ayudante ?? undefined,
      pago_moneda_ayudante: initialData?.pago_moneda_ayudante || 'USD',
      pago_tasa_cambio_ayudante:
        initialData?.pago_tasa_cambio_ayudante ?? undefined,

      facturas: initialData?.facturas || []
    }
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = form;

  const statusValue = watch('status');
  const monedaValue = watch('moneda_origen');
  const pagadoChofer = watch('pagado_chofer');
  const monedaChofer = watch('pago_moneda_chofer');
  const pagadoAyudante = watch('pagado_ayudante');
  const monedaAyudante = watch('pago_moneda_ayudante');
  const clienteIdVal = watch('cliente_id');
  const selectedClie = clientes.find((c) => c.id === clienteIdVal);
  const isCDE = selectedClie?.nombre === 'CDE';

  // Cargar drivers y clientes
  useEffect(() => {
    supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .then(({ data }) => data && setDrivers(data as Driver[]));

    supabase
      .from('clientes')
      .select('id, nombre')
      .then(({ data }) => data && setClientes(data as Cliente[]));
  }, [supabase]);

  // Detectar cambios para habilitar/deshabilitar botón
  useEffect(() => {
    const sub = form.watch((_, { type }) => {
      if (type === 'change') setIsPristine(false);
    });
    return () => sub.unsubscribe();
  }, [form]);

  // Limpiar campos de pago si no está Pagado
  useEffect(() => {
    if (statusValue !== 'Pagado') {
      setValue('pago_fecha', undefined);
      setValue('monto_pagado_origen', undefined);
      setValue('moneda_origen', 'USD');
      setValue('tasa_cambio', undefined);
    }

    if (statusValue === 'En Transito') {
      setValue('pagado_chofer', false);
      setValue('fecha_pago_chofer', undefined);
      setValue('pago_moneda_chofer', 'USD');
      setValue('pago_tasa_cambio_chofer', undefined);
      setValue('pagado_ayudante', false);
      setValue('fecha_pago_ayudante', undefined);
      setValue('pago_moneda_ayudante', 'USD');
      setValue('pago_tasa_cambio_ayudante', undefined);
    }
  }, [statusValue, setValue]);

  const onSubmit: SubmitHandler<FleteFormValues> = async (vals) => {
    try {
      if (isEdit) {
        await updateFlete(initialData!.id!, vals);
        toast.success('Flete actualizado correctamente');
      } else {
        const nuevo = await addFlete(vals);
        toast.success('Flete creado correctamente');
        console.log(nuevo);

        router.replace(`/dashboard/fletes/${nuevo.id}`);
      }
      setIsPristine(true);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al guardar los cambios');
    }
  };

  return (
    <div suppressHydrationWarning className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => router.push('/dashboard/fletes')}
        >
          ←
        </Button>
        <h1 className='text-3xl font-bold'>{pageTitle}</h1>
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Formulario */}
        <div className='sticky w-full lg:w-1/3'>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>General</CardTitle>
                  <CardDescription>FO, Conductor y Cliente</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* FO Number */}
                  <FormField
                    control={control}
                    name='fo_number'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FO Number</FormLabel>
                        <FormControl>
                          <Input placeholder='Ej. FO12345' {...field} />
                        </FormControl>
                        {errors.fo_number && (
                          <p className='mt-1 text-sm text-red-500'>
                            {errors.fo_number.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Conductor */}
                  <FormField
                    control={control}
                    name='driver_id'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conductor</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) =>
                            field.onChange(v === 'none' ? undefined : v)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='— Ninguno —' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='none'>— Ninguno —</SelectItem>
                            {drivers.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.first_name} {d.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Cliente */}
                  <FormField
                    control={control}
                    name='cliente_id'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Seleccionar cliente' />
                            </SelectTrigger>
                            <SelectContent>
                              {clientes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        {errors.cliente_id && (
                          <p className='mt-1 text-sm text-red-500'>
                            {errors.cliente_id.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Seleccionar status' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='En Transito'>
                                En Transito
                              </SelectItem>
                              <SelectItem value='Despachado'>
                                Despachado
                              </SelectItem>
                              <SelectItem value='Relacionado'>
                                Relacionado
                              </SelectItem>
                              <SelectItem value='Facturado'>
                                Facturado
                              </SelectItem>
                              <SelectItem value='Pagado'>Pagado</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        {errors.status && (
                          <p className='mt-1 text-sm text-red-500'>
                            {errors.status.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Destino */}
                  <FormField
                    control={control}
                    name='destination'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino del viaje</FormLabel>
                        <FormControl>
                          <Input placeholder='Ej. Ciudad o estado' {...field} />
                        </FormControl>
                        {errors.destination && (
                          <p className='mt-1 text-sm text-red-500'>
                            {errors.destination.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Costo Aproximado */}
                  <FormField
                    control={control}
                    name='costo_aproximado'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Aproximado</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='Ej. 1500.00'
                            {...field}
                          />
                        </FormControl>
                        {errors.costo_aproximado && (
                          <p className='mt-1 text-sm text-red-500'>
                            {errors.costo_aproximado.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* — Campos de pago solo si status = Pagado — */}
                  {statusValue === 'Pagado' && (
                    <>
                      {/* Fecha de pago */}
                      <FormField
                        control={control}
                        name='pago_fecha'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Pago</FormLabel>
                            <FormControl>
                              <Input type='date' {...field} />
                            </FormControl>
                            {errors.pago_fecha && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.pago_fecha.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Monto en moneda de origen */}
                      <FormField
                        control={control}
                        name='monto_pagado_origen'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto de Pago</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                step='0.01'
                                placeholder='Ej. 1000.00'
                                {...field}
                              />
                            </FormControl>
                            {errors.monto_pagado_origen && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.monto_pagado_origen.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Selección de moneda */}
                      <FormField
                        control={control}
                        name='moneda_origen'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moneda</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder='USD / VES' />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='USD'>USD</SelectItem>
                                  <SelectItem value='VES'>VES</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Tasa de cambio (solo si VES) */}
                      {monedaValue === 'VES' && (
                        <FormField
                          control={control}
                          name='tasa_cambio'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tasa de Cambio</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.0001'
                                  placeholder='Ej. 30.25'
                                  {...field}
                                />
                              </FormControl>
                              {errors.tasa_cambio && (
                                <p className='mt-1 text-sm text-red-500'>
                                  {errors.tasa_cambio.message}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}

                  {/* — Sección de Pagos Chofer y Ayudante — */}
                  <div className='space-y-4 border-t pt-4'>
                    <h3 className='text-lg font-semibold'>Pagos Personal</h3>

                    {/* Chofer */}
                    <div className='space-y-3 rounded-lg border p-4'>
                      <h4 className='font-medium'>Chofer</h4>

                      {/* Monto Pago Chofer */}
                      <FormField
                        control={control}
                        name='monto_pago_chofer'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto Pago Chofer (USD)</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                step='0.01'
                                placeholder='Ej. 50.00'
                                {...field}
                              />
                            </FormControl>
                            {errors.monto_pago_chofer && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.monto_pago_chofer.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Pagado Chofer */}
                      <FormField
                        control={control}
                        name='pagado_chofer'
                        render={({ field }) => (
                          <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={statusValue === 'En Transito'}
                              />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Chofer Pagado</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Campos adicionales si chofer está pagado */}
                      {pagadoChofer && (
                        <>
                          {/* Fecha Pago Chofer */}
                          <FormField
                            control={control}
                            name='fecha_pago_chofer'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha Pago Chofer</FormLabel>
                                <FormControl>
                                  <Input type='date' {...field} />
                                </FormControl>
                                {errors.fecha_pago_chofer && (
                                  <p className='mt-1 text-sm text-red-500'>
                                    {errors.fecha_pago_chofer.message}
                                  </p>
                                )}
                              </FormItem>
                            )}
                          />

                          {/* Moneda Chofer */}
                          <FormField
                            control={control}
                            name='pago_moneda_chofer'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Moneda Pago Chofer</FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder='USD / VES' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value='USD'>USD</SelectItem>
                                      <SelectItem value='VES'>VES</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Tasa Cambio Chofer (solo si VES) */}
                          {monedaChofer === 'VES' && (
                            <FormField
                              control={control}
                              name='pago_tasa_cambio_chofer'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tasa de Cambio Chofer</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.0001'
                                      placeholder='Ej. 30.25'
                                      {...field}
                                    />
                                  </FormControl>
                                  {errors.pago_tasa_cambio_chofer && (
                                    <p className='mt-1 text-sm text-red-500'>
                                      {errors.pago_tasa_cambio_chofer.message}
                                    </p>
                                  )}
                                </FormItem>
                              )}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Ayudante */}
                    <div className='space-y-3 rounded-lg border p-4'>
                      <h4 className='font-medium'>Ayudante</h4>

                      {/* Monto Pago Ayudante */}
                      <FormField
                        control={control}
                        name='monto_pago_ayudante'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto Pago Ayudante (USD)</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                step='0.01'
                                placeholder='Ej. 30.00'
                                {...field}
                              />
                            </FormControl>
                            {errors.monto_pago_ayudante && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.monto_pago_ayudante.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Pagado Ayudante */}
                      <FormField
                        control={control}
                        name='pagado_ayudante'
                        render={({ field }) => (
                          <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={statusValue === 'En Transito'}
                              />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Ayudante Pagado</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Campos adicionales si ayudante está pagado */}
                      {pagadoAyudante && (
                        <>
                          {/* Fecha Pago Ayudante */}
                          <FormField
                            control={control}
                            name='fecha_pago_ayudante'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha Pago Ayudante</FormLabel>
                                <FormControl>
                                  <Input type='date' {...field} />
                                </FormControl>
                                {errors.fecha_pago_ayudante && (
                                  <p className='mt-1 text-sm text-red-500'>
                                    {errors.fecha_pago_ayudante.message}
                                  </p>
                                )}
                              </FormItem>
                            )}
                          />

                          {/* Moneda Ayudante */}
                          <FormField
                            control={control}
                            name='pago_moneda_ayudante'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Moneda Pago Ayudante</FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder='USD / VES' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value='USD'>USD</SelectItem>
                                      <SelectItem value='VES'>VES</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Tasa Cambio Ayudante (solo si VES) */}
                          {monedaAyudante === 'VES' && (
                            <FormField
                              control={control}
                              name='pago_tasa_cambio_ayudante'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tasa de Cambio Ayudante</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.0001'
                                      placeholder='Ej. 30.25'
                                      {...field}
                                    />
                                  </FormControl>
                                  {errors.pago_tasa_cambio_ayudante && (
                                    <p className='mt-1 text-sm text-red-500'>
                                      {errors.pago_tasa_cambio_ayudante.message}
                                    </p>
                                  )}
                                </FormItem>
                              )}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type='submit'
                    className='w-full'
                    disabled={isEdit && isPristine}
                  >
                    {isEdit ? 'Guardar Cambios' : 'Crear Flete'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>

        {/* Gastos & Facturas */}
        <div className='w-full lg:w-2/3'>
          {/* Mobile: Tabs */}
          <div className='lg:hidden'>
            <Tabs defaultValue='general'>
              <TabsList className='grid w-full grid-cols-2 text-xs sm:text-sm'>
                <TabsTrigger value='general'>Gastos</TabsTrigger>
                {!isCDE && <TabsTrigger value='facturas'>Facturas</TabsTrigger>}
              </TabsList>
              <TabsContent value='general' className='mt-4'>
                <ExpensesManager fleteId={initialData?.id} />
              </TabsContent>
              {!isCDE && (
                <TabsContent value='facturas' className='mt-4'>
                  <InvoicesManager
                    fleteId={initialData?.id}
                    destination={initialData?.destination}
                    driver_id={initialData?.driver_id}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Desktop: secciones */}
          <div className='hidden gap-6 lg:grid'>
            <section>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold'>Gastos</h2>
                <p className='text-muted-foreground'>
                  Gestione los gastos asociados al flete
                </p>
              </div>
              <ExpensesManager fleteId={initialData?.id} />
            </section>

            {!isCDE && (
              <section>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-bold'>Facturas</h2>
                  <p className='text-muted-foreground'>
                    Agregue o edite facturas
                  </p>
                </div>
                <InvoicesManager
                  fleteId={initialData?.id}
                  destination={initialData?.destination}
                  driver_id={initialData?.driver_id}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
