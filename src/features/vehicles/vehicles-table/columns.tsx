'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Vehicle } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Vehicle>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nombre' />
    )
  },
  {
    accessorKey: 'brand',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Marca' />
    )
  },
  {
    accessorKey: 'model',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Modelo' />
    )
  },
  {
    accessorKey: 'color',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Color' />
    )
  },
  {
    accessorKey: 'plate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Placa' />
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
