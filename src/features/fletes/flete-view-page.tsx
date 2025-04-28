import { createClient } from '@/lib/supabase/server';
import FleteFormPage from '@/features/fletes/flete-form';
import { notFound } from 'next/navigation';
import type { Flete } from '@/types';

interface Props {
  fleteId: string;
}

export default async function FleteViewPage({ fleteId }: Props) {
  let initialData: Flete | null = null;
  let pageTitle = 'Crear Nuevo Flete';

  if (fleteId !== 'new') {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('fletes')
      .select('*, drivers(id, first_name, last_name), facturas(*)')
      .eq('id', fleteId)
      .single();
    if (error || !data) notFound();
    initialData = data as Flete;
    pageTitle = 'Editar Flete';
  }

  return <FleteFormPage initialData={initialData} pageTitle={pageTitle} />;
}
