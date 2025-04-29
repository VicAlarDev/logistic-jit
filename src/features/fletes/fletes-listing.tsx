import { createClient } from '@/lib/supabase/server';
import { searchParamsCache } from '@/lib/searchparams';
import { FletesTable } from '@/features/fletes/fletes-table';
import type { Flete } from '@/types';
import { columns } from '@/features/fletes/fletes-table/columns';

export default async function FletesListingPage() {
  const page = searchParamsCache.get('page') ?? 1;
  const perPage = searchParamsCache.get('perPage') ?? 10;
  const foNumber = searchParamsCache.get('fo_number') ?? '';
  const statuses = searchParamsCache.get('status') ?? ([] as string[]);
  const destination = searchParamsCache.get('destination') ?? '';

  // Obtener parámetros de fecha (nuevos y antiguos)
  const createdAtFrom = searchParamsCache.get('created_at_from') ?? '';
  const createdAtTo = searchParamsCache.get('created_at_to') ?? '';
  const createdAtArr = searchParamsCache.get('created_at') ?? ([] as string[]);

  // Determinar fechas de inicio y fin
  let startISO: string | undefined;
  let endISO: string | undefined;

  // Primero intentar con los nuevos parámetros específicos
  if (createdAtFrom) {
    const ms = parseInt(createdAtFrom, 10);
    if (!isNaN(ms)) startISO = new Date(ms).toISOString();
  }
  if (createdAtTo) {
    const ms = parseInt(createdAtTo, 10);
    if (!isNaN(ms)) {
      // Ajustar la fecha final para incluir todo el día
      const endDate = new Date(ms);
      endDate.setHours(23, 59, 59, 999); // Establecer al final del día
      endISO = endDate.toISOString();
    }
  }

  // Si no hay nuevos parámetros, intentar con el array (compatibilidad)
  if (!startISO && createdAtArr.length >= 1) {
    const ms = parseInt(createdAtArr[0], 10);
    if (!isNaN(ms)) startISO = new Date(ms).toISOString();
  }
  if (!endISO && createdAtArr.length >= 2) {
    const ms = parseInt(createdAtArr[1], 10);
    if (!isNaN(ms)) {
      // Ajustar la fecha final para incluir todo el día
      const endDate = new Date(ms);
      endDate.setHours(23, 59, 59, 999); // Establecer al final del día
      endISO = endDate.toISOString();
    }
  }

  const supabase = await createClient();
  let query = supabase
    .from('fletes')
    .select('*, drivers(first_name, last_name)', { count: 'exact' });

  if (foNumber) query = query.ilike('fo_number', `%${foNumber}%`);
  if (statuses.length > 0) query = query.in('status', statuses);
  if (destination) query = query.ilike('destination', `%${destination}%`);
  if (startISO) query = query.gte('created_at', startISO);
  if (endISO) query = query.lte('created_at', endISO);

  // Ordenamos descendente por fecha
  query = query.order('created_at', { ascending: false });

  // Paginación
  const from = (page - 1) * perPage;
  const to = page * perPage - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return (
    <FletesTable<Flete, unknown>
      data={(data as Flete[]) || []}
      totalItems={count || 0}
      columns={columns}
    />
  );
}
