'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Gasto } from '@/types';
import { CellAction } from './cell-action';

const EXPENSE_CATEGORIES = [
  'Combustible',
  'Peajes',
  'Viáticos',
  'Mantenimiento',
  'Reparaciones',
  'Hospedaje',
  'Alimentación',
  'Otros'
] as const;

const MONEDAS = ['USD', 'VES'] as const;

const TASA_TIPOS = ['paralelo', 'bcv', 'promedio', 'custom'] as const;

export const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({
  label: c,
  value: c
}));

export const CURRENCY_OPTIONS = MONEDAS.map((m) => ({
  label: m,
  value: m
}));

export const RATE_TYPE_OPTIONS = TASA_TIPOS.map((t) => ({
  label: t,
  value: t
}));

export const columns: ColumnDef<Gasto>[] = [
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Categoría' />
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Categoría',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS
    }
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Descripción' />
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Descripción',
      placeholder: 'Buscar descripción',
      variant: 'text'
    }
  },
  {
    accessorKey: 'original_currency',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Moneda' />
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Moneda',
      variant: 'multiSelect',
      options: CURRENCY_OPTIONS
    }
  },
  {
    accessorKey: 'pago_divisa',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='USD' />
    ),
    cell: ({ cell }) => {
      const value = cell.getValue<number>();
      return value != null
        ? new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'USD'
          }).format(value)
        : '—';
    },
    enableColumnFilter: false
  },
  {
    accessorKey: 'pago_bolivares',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='VES' />
    ),
    cell: ({ cell }) => {
      const value = cell.getValue<number>();
      return value != null
        ? `Bs. ${new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value)}`
        : '—';
    },
    enableColumnFilter: false
  },
  {
    accessorKey: 'tasa_cambio',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tasa' />
    ),
    cell: ({ cell }) => {
      const value = cell.getValue<number>();
      return value != null
        ? new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
          }).format(value)
        : '—';
    },
    enableColumnFilter: false
  },
  {
    accessorKey: 'tipo_tasa',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tipo Tasa' />
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Tipo de Tasa',
      variant: 'multiSelect',
      options: RATE_TYPE_OPTIONS
    }
  },
  {
    accessorKey: 'expense_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fecha' />
    ),
    cell: ({ row }) => new Date(row.original.expense_date).toLocaleDateString(),
    enableColumnFilter: true,
    meta: {
      label: 'Fecha',
      variant: 'dateRange'
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
