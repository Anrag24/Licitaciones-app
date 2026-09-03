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
    const historial = await prisma.historialTransicion.findMany({
      where: { licitacionId: id },
      orderBy: { fecha: 'desc' },
      include: { usuario: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json(historial);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
