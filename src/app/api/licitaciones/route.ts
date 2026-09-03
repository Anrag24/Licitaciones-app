import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (clienteId) where.clienteId = clienteId;

    const licitaciones = await prisma.licitacion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true, email: true } },
        creadoPor: { select: { id: true, nombre: true } },
        productos: {
          include: { producto: { select: { id: true, nombre: true } } },
        },
        _count: { select: { pagos: true } },
      },
    });

    const now = new Date();
    for (const lic of licitaciones) {
      if (lic.estado === 'activa' && new Date(lic.fechaLimite) < now) {
        await prisma.$transaction([
          prisma.licitacion.update({
            where: { id: lic.id },
            data: { estado: 'perdida' },
          }),
          prisma.historialTransicion.create({
            data: {
              licitacionId: lic.id,
              estadoAnterior: 'activa',
              estadoNuevo: 'perdida',
              usuarioId: user.id,
            },
          }),
        ]);
        lic.estado = 'perdida';
      }
    }

    return NextResponse.json(licitaciones);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { titulo, descripcion, presupuestoMaximo, fechaLimite, clienteId } = await req.json();

    if (!titulo || !presupuestoMaximo || !fechaLimite || !clienteId) {
      return NextResponse.json(
        { error: 'Titulo, presupuesto, fecha limite y cliente son requeridos' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const licitacion = await prisma.licitacion.create({
      data: {
        titulo,
        descripcion,
        presupuestoMaximo: Number(presupuestoMaximo),
        fechaLimite: new Date(fechaLimite),
        clienteId,
        creadoPorId: user.id,
      },
      include: {
        cliente: true,
        creadoPor: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(licitacion, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
