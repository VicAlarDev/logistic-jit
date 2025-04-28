'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { VehicleFormValues } from '@/features/vehicles/vehicle-form';

export async function addVehicle(data: VehicleFormValues) {
  const supabase = await createClient();
  const { error } = await supabase.from('vehicles').insert([{ ...data }]);
  if (error) throw new Error(error.message);
  // Revalida la página de listado:
  revalidatePath('/dashboard/vehiculos');
}

export async function updateVehicle(id: string, data: VehicleFormValues) {
  const supabase = await createClient();
  const { error } = await supabase.from('vehicles').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/vehiculos');
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/vehiculos');
}
