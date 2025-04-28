import { createClient } from '@/lib/supabase/server';
import { searchParamsCache } from '@/lib/searchparams';
import { VehiclesTable } from './vehicles-table';
import { columns } from './vehicles-table/columns';

export default async function VehicleListingPage() {
  const page = searchParamsCache.get('page') ?? 1;
  const perPage = searchParamsCache.get('perPage') ?? 10;
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .range((page - 1) * perPage, page * perPage - 1);
  if (error) throw error;
  return (
    <VehiclesTable
      data={data || []}
      totalItems={count || 0}
      columns={columns}
    />
  );
}
