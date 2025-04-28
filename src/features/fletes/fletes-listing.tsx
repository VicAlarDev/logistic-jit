import { createClient } from '@/lib/supabase/server';
import { searchParamsCache } from '@/lib/searchparams';
import { FletesTable } from '@/features/fletes/fletes-table';

import type { Flete } from '@/types';
import { columns } from '@/features/fletes/fletes-table/columns';

export default async function FletesListingPage() {
  const page = searchParamsCache.get('page') ?? 1;
  const perPage = searchParamsCache.get('perPage') ?? 10;
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from('fletes')
    .select('*, drivers(first_name, last_name)', { count: 'exact' })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error) throw error;

  return (
    <FletesTable
      data={(data as Flete[]) || []}
      totalItems={count || 0}
      columns={columns}
    />
  );
}
