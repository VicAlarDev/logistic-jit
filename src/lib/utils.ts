import { type ClassValue, clsx } from 'clsx';
import { redirect } from 'next/navigation';

import { twMerge } from 'tailwind-merge';
import { Debt, MonedaOrigenEnum, Payment } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate'
      ? (accurateSizes[i] ?? 'Bytest')
      : (sizes[i] ?? 'Bytes')
  }`;
}

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: 'error' | 'success',
  path: string,
  message: string
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function calculateRemainingBalance(
  debt: Debt,
  payments: Payment[]
): number {
  const debtPayments = payments.filter(
    (payment) => payment.deuda_id === debt.id
  );

  let totalPaid = 0;

  for (const payment of debtPayments) {
    if (payment.pago_divisa !== null) {
      totalPaid += payment.pago_divisa;
    } else if (payment.pago_bolivares !== null && payment.tasa_cambio) {
      // Convertir de bolívares a la divisa original
      totalPaid += payment.pago_bolivares / payment.tasa_cambio;
    }
  }

  return Math.max(0, debt.total_divisa - totalPaid);
}

export function formatExchangeRate(rate: number | null): string {
  if (rate === null) return 'N/A';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(rate);
}

export function formatCurrency(
  amount: number,
  currencyCode: MonedaOrigenEnum = MonedaOrigenEnum.USD
): string {
  const currencyMap = {
    [MonedaOrigenEnum.USD]: { locale: 'en-US', currency: 'USD' },
    [MonedaOrigenEnum.VES]: { locale: 'es-VE', currency: 'VES' }
  };

  const { locale, currency } = currencyMap[currencyCode];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Función para obtener las tasas de cambio actuales
 * Utiliza la API de pydolarve.org para obtener tasas BCV y paralelo
 */
export async function fetchExchangeRates() {
  try {
    const response = await fetch(
      'https://pydolarve.org/api/v2/dollar?page=alcambio&format_date=default&rounded_price=true'
    );

    if (!response.ok) {
      throw new Error(`Error en la respuesta: ${response.status}`);
    }

    const data = await response.json();

    if (data.monitors) {
      const bcvRate = data.monitors.bcv;
      const parallelRate = data.monitors.enparalelovzla;

      // Calcular tasa promedio
      const avgRate = {
        price: Number.parseFloat(
          ((bcvRate.price + parallelRate.price) / 2).toFixed(2)
        ),
        last_update: data.datetime.date + ' ' + data.datetime.time
      };

      return {
        bcv: {
          price: bcvRate.price,
          last_update: bcvRate.last_update
        },
        enparalelovzla: {
          price: parallelRate.price,
          last_update: parallelRate.last_update
        },
        promedio: avgRate
      };
    }

    throw new Error('No se encontraron datos de tasas de cambio');
  } catch (error) {
    console.error('Error al obtener tasas de cambio:', error);
    throw error;
  }
}
