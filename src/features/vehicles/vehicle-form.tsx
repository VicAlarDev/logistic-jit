'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { addVehicle, updateVehicle } from '@/app/actions/vehicle';

const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  brand: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  color: z.string().min(1, 'Required'),
  plate: z.string().min(1, 'Required')
});
export type VehicleFormValues = z.infer<typeof formSchema> & { id?: string };

interface VehicleFormProps {
  initialData: VehicleFormValues | null;
  pageTitle: string;
}

export default function VehicleForm({
  initialData,
  pageTitle
}: VehicleFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initialData?.id);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? {
      name: '',
      brand: '',
      model: '',
      color: '',
      plate: ''
    }
  });

  const onSubmit = (values: VehicleFormValues) => {
    startTransition(async () => {
      if (isEdit) {
        await updateVehicle(initialData!.id!, values);
      } else {
        await addVehicle(values);
      }
      router.push('/dashboard/vehiculos');
    });
  };

  return (
    <div className='mx-auto w-full'>
      <h2 className='mb-6 text-2xl font-bold'>{pageTitle}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder='Nombre del vehiculo' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='brand'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder='Marca' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='model'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder='Modelo' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='color'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder='Color' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='plate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input placeholder='Placa' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={pending}>
            {isEdit ? 'Actualizar Vehiculo' : 'Agregar Vehiculo'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
