'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Flete } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CellAction } from './cell-action';
import { Badge } from '@/components/ui/badge';
import { STATUS_OPTIONS } from './options';
import { Product } from '@/constants/data';

export const columns: ColumnDef<Flete>[] = [
  {
    accessorKey: 'fo_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='FO Number' />
    ),
    enableColumnFilter: true,
    meta: {
      label: 'FO Number',
      placeholder: 'Buscar FO Number',
      variant: 'text'
    }
  },
  {
    id: 'driver',
    accessorFn: (row) =>
      row.drivers ? `${row.drivers.first_name} ${row.drivers.last_name}` : '-',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Conductor' />
    ),
    enableColumnFilter: false
  },
  {
    accessorKey: 'destination',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Destino' />
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Destino',
      placeholder: 'Buscar Destino',
      variant: 'text'
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estatus' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Flete['status']>();
      const color =
        status === 'En Transito'
          ? 'bg-orange-500'
          : status === 'Despachado'
            ? 'bg-green-500'
            : 'bg-sky-500';

      return <Badge className={`${color} font-semibold`}>{status}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Estatus',
      variant: 'multiSelect',
      options: STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Creado' />
    ),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    enableColumnFilter: true,
    meta: {
      label: 'Fecha de Creación',
      variant: 'dateRange'
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
