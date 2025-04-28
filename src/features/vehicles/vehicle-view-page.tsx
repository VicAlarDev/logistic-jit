import { createClient } from '@/lib/supabase/server';
import VehicleForm from './vehicle-form';
import { notFound } from 'next/navigation';
import type { Vehicle } from '@/types';

interface Props {
  vehicleId: string;
}

export default async function VehicleViewPage({ vehicleId }: Props) {
  let initialData: Vehicle | null = null;
  let pageTitle = 'Create New Vehicle';

  if (vehicleId !== 'new') {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();
    if (error || !data) notFound();
    initialData = data;
    pageTitle = 'Edit Vehicle';
  }

  return <VehicleForm initialData={initialData} pageTitle={pageTitle} />;
}
