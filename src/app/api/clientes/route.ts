import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const clientes = await prisma.cliente.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { licitaciones: true } } },
    });
    return NextResponse.json(clientes);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { nombre, email, telefono, empresa } = await req.json();

    if (!nombre || !email || !empresa) {
      return NextResponse.json({ error: 'Nombre, email y empresa son requeridos' }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({
      data: { nombre, email, telefono, empresa, createdBy: user.id },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
