import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}

// GET /api/gastos?mes=YYYY-MM
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');

    if (!mes) {
        return NextResponse.json({ error: 'Parámetro "mes" requerido (formato YYYY-MM)' }, { status: 400 });
    }

    const { data, error } = await getSupabase()
        .from('gastos')
        .select('*')
        .eq('mes', mes)
        .order('fecha', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST /api/gastos
export async function POST(request) {
    const body = await request.json();
    const { fecha, descripcion, monto, categoria } = body;

    if (!fecha || !descripcion || monto === undefined) {
        return NextResponse.json(
            { error: 'Se requieren fecha, descripcion y monto' },
            { status: 400 }
        );
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
        return NextResponse.json({ error: 'Monto debe ser un número positivo' }, { status: 400 });
    }

    const mes = fecha.slice(0, 7);

    const { data, error } = await getSupabase()
        .from('gastos')
        .insert([{ fecha, descripcion, monto: montoNum, mes, categoria: categoria || 'Varios' }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}

// PUT /api/gastos — body: { id, fecha, descripcion, monto, categoria }
export async function PUT(request) {
    const body = await request.json();
    const { id, fecha, descripcion, monto, categoria } = body;

    if (!id || !fecha || !descripcion || monto === undefined) {
        return NextResponse.json(
            { error: 'Se requieren id, fecha, descripcion y monto' },
            { status: 400 }
        );
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
        return NextResponse.json({ error: 'Monto debe ser un número positivo' }, { status: 400 });
    }

    const mes = fecha.slice(0, 7);

    const { data, error } = await getSupabase()
        .from('gastos')
        .update({ fecha, descripcion: descripcion.trim(), monto: montoNum, mes, categoria: categoria || 'Varios' })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE /api/gastos?id=uuid
export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Parámetro "id" requerido' }, { status: 400 });
    }

    const { error } = await getSupabase().from('gastos').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
