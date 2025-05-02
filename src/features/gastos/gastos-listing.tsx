import { createClient } from '@/lib/supabase/client';
import { searchParamsCache } from '@/lib/searchparams';
import { GastosTable } from '@/features/gastos/gastos-table';
import type { Gasto } from '@/types';
import { columns } from '@/features/gastos/gastos-table/column';

export default async function GastosListingPage() {
  const page = searchParamsCache.get('page') ?? 1;
  const perPage = searchParamsCache.get('perPage') ?? 10;
  const categories = searchParamsCache.get('category') ?? ([] as string[]);
  const currencies =
    searchParamsCache.get('original_currency') ?? ([] as string[]);
  const tipoTasas = searchParamsCache.get('tipo_tasa') ?? ([] as string[]);

  // Filtros de fecha de gasto
  const from = searchParamsCache.get('expense_date_from') ?? '';
  const to = searchParamsCache.get('expense_date_to') ?? '';
  const dateArr = searchParamsCache.get('expense_date') ?? ([] as string[]);

  let startISO: string | undefined;
  let endISO: string | undefined;

  if (from) {
    const ms = parseInt(from, 10);
    if (!isNaN(ms)) startISO = new Date(ms).toISOString();
  }
  if (to) {
    const ms = parseInt(to, 10);
    if (!isNaN(ms)) {
      const endDate = new Date(ms);
      endDate.setHours(23, 59, 59, 999);
      endISO = endDate.toISOString();
    }
  }
  if (!startISO && dateArr.length >= 1) {
    const ms = parseInt(dateArr[0], 10);
    if (!isNaN(ms)) startISO = new Date(ms).toISOString();
  }
  if (!endISO && dateArr.length >= 2) {
    const ms = parseInt(dateArr[1], 10);
    if (!isNaN(ms)) {
      const endDate = new Date(ms);
      endDate.setHours(23, 59, 59, 999);
      endISO = endDate.toISOString();
    }
  }

  const supabase = createClient();
  let query = supabase.from('gastos').select('*', { count: 'exact' });

  if (categories.length > 0) query = query.in('category', categories);
  if (currencies.length > 0) query = query.in('original_currency', currencies);
  if (tipoTasas.length > 0) query = query.in('tipo_tasa', tipoTasas);
  if (startISO) query = query.gte('expense_date', startISO);
  if (endISO) query = query.lte('expense_date', endISO);

  query = query.order('expense_date', { ascending: false });

  const fromIdx = (page - 1) * perPage;
  const toIdx = page * perPage - 1;
  const { data, count, error } = await query.range(fromIdx, toIdx);
  if (error) throw error;

  console.log(data);

  return (
    <GastosTable<Gasto, unknown>
      data={(data as Gasto[]) || []}
      totalItems={count || 0}
      columns={columns}
    />
  );
}
