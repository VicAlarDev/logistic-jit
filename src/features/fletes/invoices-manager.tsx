'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, MessageCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { createClient } from '@/lib/supabase/client';
import { addFactura, deleteFactura, updateFactura } from '@/app/actions/flete';
import { toast } from 'sonner';
import type { Driver } from '@/types';

const supabase = createClient();

// 1) Schema base
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

// 2) Extendemos para que guías sean array de objetos
const extendedSchema = facturaSchema.extend({
  guias: z.array(
    z.object({
      guia_number: z.string().min(1, 'Guía requerida')
    })
  )
});

type InvoiceFormValues = z.infer<typeof extendedSchema>;

interface Factura {
  id: string;
  flete_id: string;
  invoice_number: string;
  client_name: string;
  load_date: string;
  delivery_date: string | null;
  state_dest: string | null;
  city_dest: string | null;
  weight_kg: number | null;
  observation: string | null;
  driver_id: string | null;
  created_at: string;
  updated_at: string;
  guias_despacho?: { guia_number: string }[];
}

interface InvoicesManagerProps {
  fleteId?: string;
  destination?: string;
  driver_id?: string | null;
}

export default function InvoicesManager({
  fleteId,
  destination,
  driver_id
}: InvoicesManagerProps) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [current, setCurrent] = useState<Factura | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facturaToDelete, setFacturaToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario con RHF + zod
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      invoice_number: '',
      client_name: '',
      load_date: format(new Date(), 'yyyy-MM-dd'),
      delivery_date: '',
      state_dest: destination || '',
      city_dest: '',
      weight_kg: 0,
      observation: '',
      driver_id: driver_id || '',
      guias: [] // array inicial
    }
  });

  // FieldArray para guías
  const {
    fields: guiaFields,
    append,
    remove
  } = useFieldArray({
    control: form.control,
    name: 'guias'
  });

  // Carga de conductores
  useEffect(() => {
    setLoadingDrivers(true);
    supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .then(({ data, error }) => {
        if (!error && data) setDrivers(data as Driver[]);
        setLoadingDrivers(false);
      });
  }, []);

  // Carga de facturas + guías
  useEffect(() => {
    if (!fleteId) {
      setFacturas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('facturas')
      .select('*, guias_despacho(guia_number)')
      .eq('flete_id', fleteId)
      .order('load_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast.error('Error al cargar facturas');
        } else {
          setFacturas(data as Factura[]);
        }
        setLoading(false);
      });
  }, [fleteId]);

  const handleAdd = () => {
    setCurrent(null);
    form.reset({
      invoice_number: '',
      client_name: '',
      load_date: format(new Date(), 'yyyy-MM-dd'),
      delivery_date: '',
      state_dest: destination || '',
      city_dest: '',
      weight_kg: 0,
      observation: '',
      driver_id: driver_id || '',
      guias: []
    });
    setDialogOpen(true);
  };

  const handleEdit = (f: Factura) => {
    setCurrent(f);
    form.reset({
      invoice_number: f.invoice_number,
      client_name: f.client_name,
      load_date: f.load_date,
      delivery_date: f.delivery_date ?? '',
      state_dest: f.state_dest ?? '',
      city_dest: f.city_dest ?? '',
      weight_kg: f.weight_kg ?? 0,
      observation: f.observation ?? '',
      driver_id: f.driver_id ?? '',
      guias:
        f.guias_despacho?.map((g) => ({ guia_number: g.guia_number })) ?? []
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setFacturaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!facturaToDelete) return;
    try {
      await deleteFactura(facturaToDelete);
      setFacturas((prev) => prev.filter((f) => f.id !== facturaToDelete));
      toast.success('Factura eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
    setDeleteDialogOpen(false);
    setFacturaToDelete(null);
  };

  const onSubmit = async (vals: InvoiceFormValues) => {
    if (!fleteId) {
      toast.error('Guarda el flete antes de añadir facturas');
      return;
    }
    setIsSubmitting(true);

    const { guias, ...invoiceFields } = vals;

    try {
      if (current) {
        // Actualizar
        const updated = await updateFactura(current.id, invoiceFields);
        await supabase
          .from('guias_despacho')
          .delete()
          .eq('factura_id', current.id);

        if (guias.length) {
          await supabase.from('guias_despacho').insert(
            guias.map(({ guia_number }) => ({
              factura_id: current.id,
              guia_number
            }))
          );
        }

        const saved: Factura = {
          ...updated,
          guias_despacho: guias.map(({ guia_number }) => ({
            guia_number
          }))
        };
        setFacturas((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
        toast.success('Factura actualizada');
      } else {
        // Crear nueva
        const inserted = await addFactura(fleteId, invoiceFields);
        if (guias.length) {
          await supabase.from('guias_despacho').insert(
            guias.map(({ guia_number }) => ({
              factura_id: inserted.id,
              guia_number
            }))
          );
        }
        const saved: Factura = {
          ...inserted,
          guias_despacho: guias.map(({ guia_number }) => ({
            guia_number
          }))
        };
        setFacturas((prev) => [...prev, saved]);
        toast.success('Factura creada');
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar factura');
    } finally {
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const getDriverName = (id: string) => {
    const d = drivers.find((d) => d.id === id);
    return d ? `${d.first_name} ${d.last_name}` : '—';
  };

  return (
    <div className='max-w-[95vw] space-y-4 md:max-w-full'>
      {/* Botón Agregar */}
      <div className='flex justify-start'>
        <Button onClick={handleAdd} disabled={!fleteId}>
          <Plus className='mr-2 h-4 w-4' /> Agregar Factura
        </Button>
      </div>

      {/* Tabla de facturas */}
      <div className='rounded-lg border'>
        {loading ? (
          <p className='p-4'>Cargando…</p>
        ) : facturas.length > 0 ? (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Núm.</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Guías</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Obs.</TableHead>
                  <TableHead className='text-right'>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.invoice_number}</TableCell>
                    <TableCell>{f.client_name}</TableCell>
                    <TableCell>
                      {f.guias_despacho && f.guias_despacho.length > 0
                        ? f.guias_despacho.map((g) => g.guia_number).join(', ')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(f.load_date).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>{f.city_dest || f.state_dest || '—'}</TableCell>
                    <TableCell>
                      {f.observation ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant='ghost' size='icon'>
                                <MessageCircle className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{f.observation}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleEdit(f)}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDelete(f.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className='text-muted-foreground py-6 text-center'>
            {fleteId
              ? 'No hay facturas aún'
              : 'Guarda el flete para agregar facturas'}
          </p>
        )}
      </div>

      {/* — Dialog Formulario — */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {current ? 'Editar Factura' : 'Nueva Factura'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='invoice_number'
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      {fieldState.error && (
                        <p className='mt-1 text-xs text-red-500'>
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='client_name'
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      {fieldState.error && (
                        <p className='mt-1 text-xs text-red-500'>
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='load_date'
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Fecha carga</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      {fieldState.error && (
                        <p className='mt-1 text-xs text-red-500'>
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='delivery_date'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha entrega</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='state_dest'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado destino</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='city_dest'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad destino</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='weight_kg'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input type='number' step='0.01' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='driver_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conductor</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={loadingDrivers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Seleccionar' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingDrivers ? (
                            <SelectItem value='loading' disabled>
                              Cargando…
                            </SelectItem>
                          ) : drivers.length > 0 ? (
                            drivers.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.first_name} {d.last_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value='none' disabled>
                              No hay conductores
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='observation'
                  render={({ field }) => (
                    <FormItem className='col-span-2'>
                      <FormLabel>Observación</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Campos dinámicos de Guías */}
              <div className='space-y-2'>
                <FormLabel>Guías de despacho</FormLabel>
                {guiaFields.map((g, idx) => (
                  <div key={g.id} className='flex items-center space-x-2'>
                    <FormControl className='flex-1'>
                      <Input
                        placeholder='Número de guía'
                        {...form.register(`guias.${idx}.guia_number` as const)}
                        defaultValue={g.guia_number}
                      />
                    </FormControl>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => append({ guia_number: '' })}
                >
                  <Plus className='mr-2 h-4 w-4' /> Agregar Guía
                </Button>
              </div>

              <DialogFooter>
                <Button variant='outline' onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting || form.formState.isSubmitting}
                >
                  {isSubmitting
                    ? current
                      ? 'Actualizando...'
                      : 'Agregando...'
                    : current
                      ? 'Actualizar'
                      : 'Agregar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <p>¿Está seguro que desea eliminar esta factura?</p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
