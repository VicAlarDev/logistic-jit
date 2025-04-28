// ─── actions/flete.ts ─────────────────────────────────────────────────────────
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { FleteFormValues } from '@/features/fletes/flete-form';
import { FacturaInput } from '@/features/fletes/invoices-manager';

export async function addFlete(data: FleteFormValues) {
  const supabase = await createClient();
  try {
    console.log('[addFlete] input:', data);

    // 1) Crear el flete con status y destination
    const { data: newFlete, error: fleteError } = await supabase
      .from('fletes')
      .insert([
        {
          fo_number: data.fo_number,
          driver_id: data.driver_id,
          status: data.status,
          destination: data.destination
        }
      ])
      // selecciono también status y destination para verificar en el log
      .select('id, status, destination')
      .single();

    if (fleteError || !newFlete) {
      console.error('[addFlete] error creando flete:', fleteError);
      throw new Error(fleteError?.message);
    }
    console.log('[addFlete] flete creado:', newFlete);
    const fleteId = newFlete.id;

    // 2) Insertar facturas (si las hay)
    if (data.facturas?.length) {
      console.log('[addFlete] insertando facturas:', data.facturas);
      const invoices = data.facturas.map((inv) => ({
        invoice_number: inv.invoice_number,
        client_name: inv.client_name,
        load_date: inv.load_date,
        delivery_date: inv.delivery_date || null,
        state_dest: inv.state_dest || null,
        city_dest: inv.city_dest || null,
        weight_kg: inv.weight_kg ? Number(inv.weight_kg) : null,
        observation: inv.observation || null,
        flete_id: fleteId,
        driver_id: inv.driver_id || null
      }));
      const { error: invoiceError } = await supabase
        .from('facturas')
        .insert(invoices);
      if (invoiceError) {
        console.error('[addFlete] error insertando facturas:', invoiceError);
        throw new Error(invoiceError.message);
      }
      console.log('[addFlete] facturas insertadas correctamente');
    }

    revalidatePath('/dashboard/fletes');
    return newFlete;
  } catch (err) {
    console.error('[addFlete] excepción capturada:', err);
    throw err;
  }
}

export async function updateFlete(id: string, data: FleteFormValues) {
  const supabase = await createClient();
  try {
    console.log('[updateFlete] id:', id, 'payload:', data);

    // 1) Actualizar datos del flete y devolver la fila actualizada
    const { data: updatedFlete, error: updateError } = await supabase
      .from('fletes')
      .update({
        fo_number: data.fo_number,
        driver_id: data.driver_id,
        status: data.status,
        destination: data.destination
      })
      .eq('id', id)
      .select('id, status, destination, fo_number, driver_id')
      .single();

    if (updateError || !updatedFlete) {
      console.error('[updateFlete] error actualizando flete:', updateError);
      throw new Error(updateError?.message);
    }
    console.log('[updateFlete] flete actualizado:', updatedFlete);

    // 2) Reemplazar facturas si vienen en el payload
    if (data.facturas) {
      console.log('[updateFlete] eliminando facturas antiguas para flete:', id);
      const { error: delError } = await supabase
        .from('facturas')
        .delete()
        .eq('flete_id', id);
      if (delError) {
        console.error('[updateFlete] error eliminando facturas:', delError);
        throw new Error(delError.message);
      }

      console.log('[updateFlete] insertando nuevas facturas:', data.facturas);
      const invoices = data.facturas.map((inv) => ({
        invoice_number: inv.invoice_number,
        client_name: inv.client_name,
        load_date: inv.load_date,
        delivery_date: inv.delivery_date || null,
        state_dest: inv.state_dest || null,
        city_dest: inv.city_dest || null,
        weight_kg: inv.weight_kg ? Number(inv.weight_kg) : null,
        observation: inv.observation || null,
        flete_id: id,
        driver_id: inv.driver_id || null
      }));
      const { error: invoiceError } = await supabase
        .from('facturas')
        .insert(invoices);
      if (invoiceError) {
        console.error('[updateFlete] error insertando facturas:', invoiceError);
        throw new Error(invoiceError.message);
      }
      console.log('[updateFlete] facturas reemplazadas correctamente');
    }

    revalidatePath('/dashboard/fletes');
    return updatedFlete;
  } catch (err) {
    console.error('[updateFlete] excepción capturada:', err);
    throw err;
  }
}

export async function deleteFlete(id: string) {
  const supabase = await createClient();
  try {
    console.log('[deleteFlete] eliminando flete id:', id);
    const { error } = await supabase.from('fletes').delete().eq('id', id);
    if (error) {
      console.error('[deleteFlete] error supabase:', error);
      throw new Error(error.message);
    }
    console.log('[deleteFlete] flete eliminado');
    revalidatePath('/dashboard/fletes');
  } catch (err) {
    console.error('[deleteFlete] excepción capturada:', err);
    throw err;
  }
}

export async function addFactura(fleteId: string, factura: FacturaInput) {
  const supabase = await createClient();
  try {
    console.log('[addFactura] fleteId:', fleteId, 'factura:', factura);
    const { data, error } = await supabase
      .from('facturas')
      .insert([{ ...factura, flete_id: fleteId }])
      .select()
      .single();
    if (error) {
      console.error('[addFactura] error supabase:', error);
      throw new Error(error.message);
    }
    console.log('[addFactura] factura insertada:', data);
    return data;
  } catch (err) {
    console.error('[addFactura] excepción capturada:', err);
    throw err;
  }
}

export async function updateFactura(id: string, factura: FacturaInput) {
  const supabase = await createClient();
  try {
    console.log('[updateFactura] id:', id, 'payload:', factura);
    const { data, error } = await supabase
      .from('facturas')
      .update(factura)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[updateFactura] error supabase:', error);
      throw new Error(error.message);
    }
    console.log('[updateFactura] factura actualizada:', data);
    return data;
  } catch (err) {
    console.error('[updateFactura] excepción capturada:', err);
    throw err;
  }
}

export async function deleteFactura(id: string) {
  const supabase = await createClient();
  try {
    console.log('[deleteFactura] id:', id);
    const { error } = await supabase.from('facturas').delete().eq('id', id);
    if (error) {
      console.error('[deleteFactura] error supabase:', error);
      throw new Error(error.message);
    }
    console.log('[deleteFactura] factura eliminada');
  } catch (err) {
    console.error('[deleteFactura] excepción capturada:', err);
    throw err;
  }
}
