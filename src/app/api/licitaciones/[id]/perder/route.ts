import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { esTransicionValida } from '@/lib/validaciones';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await params;
    const licitacion = await prisma.licitacion.findUnique({ where: { id } });
    if (!licitacion) {
      return NextResponse.json({ error: 'Licitacion no encontrada' }, { status: 404 });
    }

    if (!esTransicionValida(licitacion.estado, 'perdida')) {
      return NextResponse.json({ error: 'Transicion de estado no valida' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.licitacion.update({ where: { id }, data: { estado: 'perdida' } }),
      prisma.historialTransicion.create({
        data: {
          licitacionId: id,
          estadoAnterior: licitacion.estado,
          estadoNuevo: 'perdida',
          usuarioId: user.id,
        },
      }),
    ]);

    return NextResponse.json({ message: 'Licitacion marcada como perdida' });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
