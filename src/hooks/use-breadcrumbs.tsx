'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Mappings fijos (igual que antes)
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/employee': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Employee', link: '/dashboard/employee' }
  ],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Product', link: '/dashboard/product' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    // 1) Mappings exactos
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // 2) Dinámico
    const segments = pathname.split('/').filter(Boolean);

    return segments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/');

      // a) Regla global: "new" → "Nuevo"
      if (segment.toLowerCase() === 'new') {
        return { title: 'Nuevo', link: path };
      }

      // b) Especial /dashboard/fletes/:id  → truncar a 5 dígitos
      if (
        segments[0] === 'dashboard' &&
        segments[1] === 'fletes' &&
        index === 2
      ) {
        const truncated = segment.length > 5 ? segment.slice(0, 5) : segment;
        return { title: truncated, link: path };
      }

      // c) Caso por defecto: capitalizar la primera letra
      const title = segment.charAt(0).toUpperCase() + segment.slice(1);
      return { title, link: path };
    });
  }, [pathname]);

  return breadcrumbs;
}
