import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf
} from 'nuqs/server';

export const searchParams = {
  // Paginación
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  // Filtros "genéricos" (productos, etc.)
  name: parseAsString,
  gender: parseAsString,
  category: parseAsString,

  // Filtros específicos de Fletes
  fo_number: parseAsString, // ?fo_number=ABC123
  status: parseAsArrayOf(parseAsString).withDefault([]), // ?status=En%20Transito&status=Despachado
  destination: parseAsString, // ?destination=Miami

  // Nuevos parámetros para rangos de fechas
  created_at_from: parseAsString, // ?created_at_from=1744689600000
  created_at_to: parseAsString, // ?created_at_to=1745640000000

  // Mantener el original para compatibilidad
  created_at: parseAsArrayOf(parseAsString).withDefault([]) // ?created_at=2025-04-01&created_at=2025-04-15
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
