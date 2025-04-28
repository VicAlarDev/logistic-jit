'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Flete } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CellAction } from './cell-action';
import { Badge } from '@/components/ui/badge';

export const columns: ColumnDef<Flete>[] = [
  {
    accessorKey: 'fo_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='FO Number' />
    )
  },
  {
    id: 'driver',
    accessorFn: (row) =>
      row.drivers ? `${row.drivers.first_name} ${row.drivers.last_name}` : '-',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Conductor' />
    )
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estatus' />
    ),
    cell: ({ row }) =>
      row.getValue('status') === 'En Transito' ? (
        <Badge className='bg-orange-500 font-semibold'>
          {row.getValue('status')}
        </Badge>
      ) : row.getValue('status') === 'Despachado' ? (
        <Badge className='bg-green-500 font-semibold'>
          {row.getValue('status')}
        </Badge>
      ) : (
        <Badge className='bg-sky-500 font-semibold'>
          {row.getValue('status')}
        </Badge>
      )
  },
  {
    accessorKey: 'destination',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Destino' />
    )
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Creado' />
    ),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
