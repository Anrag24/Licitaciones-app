import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const productos = await prisma.producto.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(productos);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { nombre, descripcion, precioBase } = await req.json();

    if (!nombre || precioBase === undefined) {
      return NextResponse.json({ error: 'Nombre y precio base son requeridos' }, { status: 400 });
    }

    const producto = await prisma.producto.create({
      data: { nombre, descripcion, precioBase: Number(precioBase), createdBy: user.id },
    });

    return NextResponse.json(producto, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
