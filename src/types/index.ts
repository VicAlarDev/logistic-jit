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
  driver_id?: string | null;
  created_at: string;
  updated_at: string;
  status: 'En Transito' | 'Despachado' | 'Relacionado' | 'Pagado' | undefined;
  destination: string;
  costo_aproximado?: number;
  monto_pagado_origen?: number;
  pago_fecha?: string;
  moneda_origen?: 'USD' | 'VES';
  tasa_cambio?: number;
  cliente_id?: string | null;
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
