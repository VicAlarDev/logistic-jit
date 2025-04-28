// ─── FleteForm.tsx ────────────────────────────────────────────────────────────
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import ExpensesManager from '@/features/fletes/expenses-manager';
import InvoicesManager from '@/features/fletes/invoices-manager';

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

const formSchema = z.object({
  fo_number: z.string().min(1, 'Requerido'),
  driver_id: z.string().optional(),
  status: z.enum(['En Transito', 'Despachado', 'Relacionado', 'Pagado'], {
    required_error: 'Requerido'
  }),
  destination: z.string().min(1, 'Requerido'),
  facturas: z.array(facturaSchema).optional()
});

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [isPristine, setIsPristine] = useState(true);

  const form = useForm<FleteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fo_number: initialData?.fo_number || '',
      driver_id: initialData?.driver_id || undefined,
      status: initialData?.status || 'En Transito',
      destination: initialData?.destination || ''
    }
  });

  const { control, handleSubmit, watch } = form;

  useEffect(() => {
    supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .then(({ data }) => {
        if (data) setDrivers(data as Driver[]);
      });
  }, [supabase]);

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        setIsPristine(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const formatDate = (s?: string) => {
    if (!s) return '—';
    try {
      return format(new Date(s), 'dd MMM yyyy', { locale: es });
    } catch {
      return '—';
    }
  };

  const onSubmit: SubmitHandler<FleteFormValues> = async (vals) => {
    try {
      if (isEdit) {
        await updateFlete(initialData!.id!, vals);
        toast.success('Flete actualizado correctamente');
      } else {
        await addFlete(vals);
        toast.success('Flete creado correctamente');
      }
      setIsPristine(true);
      router.refresh();
    } catch (error) {
      toast.error('Ocurrió un error al guardar los cambios');
      console.error(error);
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
        <div className='sticky w-full lg:w-1/3'>
          {' '}
          {/* Formulario */}
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className=''>
              {/* Sidebar */}
              <div className=''>
                <Card>
                  <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>FO &amp; Conductor</CardDescription>
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
                            onValueChange={(val) =>
                              field.onChange(val === 'none' ? undefined : val)
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Seleccionar conductor' />
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
                                <SelectItem value='Pagado'>Pagado</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {/* Destino */}
                    <FormField
                      control={control}
                      name='destination'
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Destino del viaje</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Ej. Ciudad o estado'
                              {...field}
                            />
                          </FormControl>
                          {fieldState.error && (
                            <p className='mt-1 text-sm text-red-500'>
                              {fieldState.error.message}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
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
              </div>
            </form>
          </Form>
        </div>

        {/* Pestañas */}
        <div className='w-full lg:w-2/3'>
          <div className='lg:hidden'>
            <Tabs defaultValue='general'>
              <TabsList className='grid w-full grid-cols-2 text-xs sm:text-sm'>
                <TabsTrigger value='general'>Gastos</TabsTrigger>
                <TabsTrigger value='facturas'>Facturas</TabsTrigger>
              </TabsList>

              {/* Gastos */}
              <TabsContent value='general' className='mt-4'>
                <ExpensesManager fleteId={initialData?.id} />
              </TabsContent>

              {/* Facturas */}
              <TabsContent value='facturas' className='mt-4'>
                <InvoicesManager
                  fleteId={initialData?.id}
                  destination={initialData?.destination}
                  driver_id={initialData?.driver_id}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Vista de escritorio con secciones una debajo de otra */}
          <div className='hidden gap-6 lg:grid'>
            <div>
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-bold'>Gastos</h2>
                  <p className='text-muted-foreground'>
                    Gestione los gastos asociados al flete
                  </p>
                </div>
              </div>
              <ExpensesManager fleteId={initialData?.id} />
            </div>

            <div>
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-bold'>Facturas</h2>
                  <p className='text-muted-foreground'>
                    Agregue o edite facturas
                  </p>
                </div>
              </div>
              <InvoicesManager
                fleteId={initialData?.id}
                destination={initialData?.destination}
                driver_id={initialData?.driver_id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
