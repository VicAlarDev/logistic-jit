import { Icons } from '@/components/icons';

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  color: string;
  plate: string;
}

export interface Driver {
  id: string;
  cedula: string;
  first_name: string;
  last_name: string;
  vehicle_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Factura {
  id: string;
  invoice_number: string;
  client_name: string;
  load_date: string; // ISO date string
  delivery_date?: string; // ISO date string
  state_dest?: string;
  city_dest?: string;
  weight_kg?: number;
  observation?: string;
  flete_id: string;
  driver_id?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface Flete {
  id: string;
  fo_number: string;

  // Relaciones
  driver_id?: string | null;
  cliente_id?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Estado y destinos
  status: 'En Transito' | 'Despachado' | 'Relacionado' | 'Facturado' | 'Pagado';
  destination: string;

  // Costos originales / pagos al origen
  costo_aproximado?: number;
  monto_pagado_origen?: number;
  moneda_origen: 'USD' | 'VES';
  tasa_cambio?: number;
  pago_fecha?: string;
  monto_pagado_usd?: number;
  monto_pagado_ves?: number;

  // → Campos nuevos de pago al chofer
  monto_pago_chofer?: number; // monto en USD que se debe pagar al chofer
  pagado_chofer: boolean; // true si ya se le pagó
  fecha_pago_chofer?: string; // fecha en que se pagó
  pago_moneda_chofer: 'USD' | 'VES'; // moneda de pago (cuando pagado_chofer = true)
  pago_tasa_cambio_chofer?: number; // requerida si pago_moneda_chofer = 'VES'

  // → Campos nuevos de pago al ayudante
  monto_pago_ayudante?: number;
  pagado_ayudante: boolean;
  fecha_pago_ayudante?: string;
  pago_moneda_ayudante: 'USD' | 'VES';
  pago_tasa_cambio_ayudante?: number;

  // Joins opcionales
  drivers?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  facturas?: Factura[];
}

export interface Cliente {
  id: string;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export interface Gasto {
  id: string;
  flete_id: string | null;
  category: string;
  description: string | null;
  expense_date: string; // ISO date string
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  tasa_cambio: number | null;
  pago_divisa: number | null;
  pago_bolivares: number | null;
  tipo_tasa: string | null; // coincide con public.tasa_tipo_enum
  original_currency: string; // coincide con public.moneda_origen_enum
}

export enum MonedaOrigenEnum {
  USD = 'USD',
  VES = 'VES'
}

export enum TasaTipoEnum {
  BCV = 'bcv',
  CUSTOM = 'personalizada'
}

export interface Debt {
  id: string;
  persona_name: string;
  description: string;
  original_currency: MonedaOrigenEnum;
  total_divisa: number;
  tasa_cambio: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  // Campos calculados
  remainingBalance?: number;
}

export interface Payment {
  id: string;
  deuda_id: string;
  description: string | null;
  payment_date: string;
  original_currency: MonedaOrigenEnum;
  tasa_cambio: number | null;
  pago_divisa: number | null;
  pago_bolivares: number | null;
  tipo_tasa: TasaTipoEnum | null;
  created_at: string;
  updated_at: string;
}
