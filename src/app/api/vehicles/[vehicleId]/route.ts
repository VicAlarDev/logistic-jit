import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  // Resuelves por fin el objeto params
  const { vehicleId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const { vehicleId } = await params;
  const body = await request.json();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .update(body)
    .eq('id', vehicleId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const { vehicleId } = await params;

  const supabase = await createClient();
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
