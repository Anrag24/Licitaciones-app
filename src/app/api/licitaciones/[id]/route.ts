import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await params;

    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
      include: {
        cliente: true,
        creadoPor: { select: { id: true, nombre: true } },
        productos: {
          include: { producto: true },
        },
        historial: {
          orderBy: { fecha: 'desc' },
          include: { usuario: { select: { id: true, nombre: true } } },
        },
        pagos: {
          orderBy: { fecha: 'desc' },
          include: { registradoPor: { select: { id: true, nombre: true } } },
        },
      },
    });

    if (!licitacion) {
      return NextResponse.json({ error: 'Licitacion no encontrada' }, { status: 404 });
    }

    const totalProductos = licitacion.productos.reduce(
      (sum, p) => sum + p.cantidad * p.precioUnitario, 0
    );
    const totalPagos = licitacion.pagos.reduce((sum, p) => sum + p.monto, 0);

    return NextResponse.json({
      ...licitacion,
      totalProductos,
      totalPagos,
      saldoPendiente: totalProductos - totalPagos,
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
