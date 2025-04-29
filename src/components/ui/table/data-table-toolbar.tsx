'use client';

import type { Column, Table } from '@tanstack/react-table';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { DataTableDateFilter } from '@/components/ui/table/data-table-date-filter';
import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter';
import { DataTableSliderFilter } from '@/components/ui/table/data-table-slider-filter';
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Cross2Icon } from '@radix-ui/react-icons';

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  );

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
    // además limpiamos todos los params de la URL
    const params = new URLSearchParams(window.location.search);
    columns.forEach((col) => params.delete(col.id));
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [table, columns]);

  return (
    <div
      role='toolbar'
      aria-orientation='horizontal'
      className={cn(
        'flex w-full items-start justify-between gap-2 p-1',
        className
      )}
      {...props}
    >
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {isFiltered && (
          <Button
            aria-label='Reset filters'
            variant='outline'
            size='sm'
            className='border-dashed'
            onClick={onReset}
          >
            <Cross2Icon />
            Reiniciar
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
  column
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Función genérica que actualiza un parámetro de la URL (shallow)
  const updateSearchParam = React.useCallback(
    (id: string, value: any) => {
      const params = new URLSearchParams(searchParams.toString());

      // Primero borramos valores previos
      params.delete(id);

      if (Array.isArray(value)) {
        // por ejemplo status = ['En Transito', 'Despachado']
        value
          .filter((v) => v !== undefined && v !== '')
          .forEach((v: string) => params.append(id, v));
      } else {
        if (value !== undefined && value !== '') params.set(id, value);
      }

      // reconstruimos la URL actualizando solo el ?query…
      const href = `${window.location.pathname}?${params.toString()}`;
      // @ts-ignore
      router.replace(href, { shallow: true });
    },
    [searchParams, router]
  );

  // Envolver setFilterValue de la columna
  const setFilter = React.useCallback(
    (value: any) => {
      column.setFilterValue(value);
      updateSearchParam(column.id, value);
    },
    [column, updateSearchParam]
  );

  // Creamos un “column override” que use nuestro setFilter
  const overrideColumn = React.useMemo(
    () => ({
      ...column,
      setFilterValue: setFilter
    }),
    [column, setFilter]
  );

  const onFilterRender = React.useCallback(() => {
    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
      case 'text':
        return (
          <Input
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={(column.getFilterValue() as string) ?? ''}
            onChange={(e) => setFilter(e.target.value)}
            className='h-8 w-40 lg:w-56'
          />
        );

      case 'number':
        return (
          <div className='relative'>
            <Input
              type='number'
              inputMode='numeric'
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ''}
              onChange={(e) => setFilter(e.target.value)}
              className={cn('h-8 w-[120px]', columnMeta.unit && 'pr-8')}
            />
            {columnMeta.unit && (
              <span className='bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm'>
                {columnMeta.unit}
              </span>
            )}
          </div>
        );

      case 'range':
        return (
          <DataTableSliderFilter
            column={overrideColumn}
            title={columnMeta.label ?? column.id}
          />
        );

      case 'date':
      case 'dateRange':
        return (
          <DataTableDateFilter
            column={overrideColumn}
            title={columnMeta.label ?? column.id}
            multiple={columnMeta.variant === 'dateRange'}
          />
        );

      case 'select':
      case 'multiSelect':
        return (
          <DataTableFacetedFilter
            column={overrideColumn}
            title={columnMeta.label ?? column.id}
            options={columnMeta.options ?? []}
            multiple={columnMeta.variant === 'multiSelect'}
          />
        );

      default:
        return null;
    }
  }, [column, columnMeta, overrideColumn, setFilter]);

  return onFilterRender();
}
