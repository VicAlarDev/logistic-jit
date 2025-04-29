'use client';

import type { Column } from '@tanstack/react-table';
import { CalendarIcon, XCircle } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/format';

type DateSelection = Date[] | DateRange;

function getIsDateRange(value: DateSelection): value is DateRange {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function parseAsDate(timestamp: number | string | undefined): Date | undefined {
  if (!timestamp) return undefined;
  const numericTimestamp =
    typeof timestamp === 'string' ? Number(timestamp) : timestamp;
  const date = new Date(numericTimestamp);
  return !Number.isNaN(date.getTime()) ? date : undefined;
}

function parseColumnFilterValue(value: unknown) {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'number' || typeof item === 'string') {
        return item;
      }
      return undefined;
    });
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return [value];
  }

  return [];
}

interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
  multiple?: boolean;
}

export function DataTableDateFilter<TData>({
  column,
  title,
  multiple
}: DataTableDateFilterProps<TData>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const columnId = column.id;

  // Para rangos, usamos parámetros separados
  const fromParamName = `${columnId}_from`;
  const toParamName = `${columnId}_to`;

  // Obtener valores actuales de los parámetros
  const fromParam = searchParams.get(fromParamName);
  const toParam = searchParams.get(toParamName);
  const singleParam = searchParams.get(columnId);

  const selectedDates = React.useMemo<DateSelection>(() => {
    if (multiple) {
      return {
        from: fromParam ? parseAsDate(fromParam) : undefined,
        to: toParam ? parseAsDate(toParam) : undefined
      };
    } else {
      const date = singleParam ? parseAsDate(singleParam) : undefined;
      return date ? [date] : [];
    }
  }, [fromParam, toParam, singleParam, multiple]);

  const updateSearchParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Aplicar actualizaciones
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Actualizar URL
      const href = `${window.location.pathname}?${params.toString()}`;
      router.replace(href);
    },
    [searchParams, router]
  );

  const onSelect = React.useCallback(
    (date: Date | DateRange | undefined) => {
      if (!date) {
        if (multiple) {
          updateSearchParams({
            [fromParamName]: null,
            [toParamName]: null
          });
        } else {
          updateSearchParams({ [columnId]: null });
        }
        return;
      }

      if (multiple && !('getTime' in date)) {
        // Para rangos, usamos parámetros separados
        updateSearchParams({
          [fromParamName]: date.from?.getTime()?.toString() || null,
          [toParamName]: date.to?.getTime()?.toString() || null
        });
      } else if (!multiple && 'getTime' in date) {
        // Para fechas individuales, usamos el parámetro original
        updateSearchParams({ [columnId]: date.getTime().toString() });
      }
    },
    [columnId, fromParamName, toParamName, multiple, updateSearchParams]
  );

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (multiple) {
        updateSearchParams({
          [fromParamName]: null,
          [toParamName]: null
        });
      } else {
        updateSearchParams({ [columnId]: null });
      }
    },
    [columnId, fromParamName, toParamName, multiple, updateSearchParams]
  );

  const hasValue = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return false;
      return selectedDates.from || selectedDates.to;
    }
    if (!Array.isArray(selectedDates)) return false;
    return selectedDates.length > 0;
  }, [multiple, selectedDates]);

  const formatDateRange = React.useCallback((range: DateRange) => {
    if (!range.from && !range.to) return '';
    if (range.from && range.to) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`;
    }
    return formatDate(range.from ?? range.to);
  }, []);

  const label = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return null;

      const hasSelectedDates = selectedDates.from || selectedDates.to;
      const dateText = hasSelectedDates
        ? formatDateRange(selectedDates)
        : 'Select date range';

      return (
        <span className='flex items-center gap-2'>
          <span>{title}</span>
          {hasSelectedDates && (
            <>
              <Separator
                orientation='vertical'
                className='mx-0.5 data-[orientation=vertical]:h-4'
              />
              <span>{dateText}</span>
            </>
          )}
        </span>
      );
    }

    if (getIsDateRange(selectedDates)) return null;

    const hasSelectedDate = selectedDates.length > 0;
    const dateText = hasSelectedDate
      ? formatDate(selectedDates[0])
      : 'Select date';

    return (
      <span className='flex items-center gap-2'>
        <span>{title}</span>
        {hasSelectedDate && (
          <>
            <Separator
              orientation='vertical'
              className='mx-0.5 data-[orientation=vertical]:h-4'
            />
            <span>{dateText}</span>
          </>
        )}
      </span>
    );
  }, [selectedDates, multiple, formatDateRange, title]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='border-dashed'>
          {hasValue ? (
            <div
              role='button'
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              onClick={onReset}
              className='focus-visible:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:outline-none'
            >
              <XCircle />
            </div>
          ) : (
            <CalendarIcon />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        {multiple ? (
          <Calendar
            initialFocus
            mode='range'
            selected={
              getIsDateRange(selectedDates)
                ? selectedDates
                : { from: undefined, to: undefined }
            }
            onSelect={onSelect}
          />
        ) : (
          <Calendar
            initialFocus
            mode='single'
            selected={
              !getIsDateRange(selectedDates) ? selectedDates[0] : undefined
            }
            onSelect={onSelect}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
