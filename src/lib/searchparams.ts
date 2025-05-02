import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf
} from 'nuqs/server';

export const searchParams = {
  // — Paginación —
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  // — Filtros "genéricos" (productos, etc.) —
  name: parseAsString,
  gender: parseAsString,
  // Cambiamos category a un array para poder usarlo como multi-select en Gastos
  category: parseAsArrayOf(parseAsString).withDefault([]),

  // — Filtros de Fletes —
  fo_number: parseAsString, // ?fo_number=ABC123
  status: parseAsArrayOf(parseAsString).withDefault([]), // ?status=En%20Transito&status=Despachado
  destination: parseAsString, // ?destination=Miami
  created_at_from: parseAsString, // ?created_at_from=1744689600000
  created_at_to: parseAsString, // ?created_at_to=1745640000000
  created_at: parseAsArrayOf(parseAsString).withDefault([]), // ?created_at=2025-04-01&created_at=2025-04-15

  // — Nuevos filtros para Gastos —
  original_currency: parseAsArrayOf(parseAsString).withDefault([]), // ?original_currency=USD&original_currency=VES
  tipo_tasa: parseAsArrayOf(parseAsString).withDefault([]), // ?tipo_tasa=bcv&tipo_tasa=promedio
  expense_date_from: parseAsString, // ?expense_date_from=1744689600000
  expense_date_to: parseAsString, // ?expense_date_to=1745640000000
  expense_date: parseAsArrayOf(parseAsString).withDefault([]) // ?expense_date=2025-04-01&expense_date=2025-04-15
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
