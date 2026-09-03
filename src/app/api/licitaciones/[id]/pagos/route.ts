import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { validarPago } from '@/lib/validaciones';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await params;
    const { monto, referencia } = await req.json();

    if (!monto) {
      return NextResponse.json({ error: 'Monto requerido' }, { status: 400 });
    }

    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
      include: {
        productos: true,
        pagos: true,
      },
    });

    if (!licitacion) {
      return NextResponse.json({ error: 'Licitacion no encontrada' }, { status: 404 });
    }

    if (licitacion.estado !== 'por_cobrar') {
      return NextResponse.json(
        { error: 'Solo se pueden registrar pagos en estado por_cobrar' },
        { status: 400 }
      );
    }

    const totalFacturado = licitacion.productos.reduce(
      (sum, p) => sum + p.cantidad * p.precioUnitario, 0
    );

    const check = validarPago(totalFacturado, licitacion.pagos, Number(monto));
    if (!check.valido) {
      return NextResponse.json({ error: check.mensaje }, { status: 400 });
    }

    // Register payment and auto-transition if fully paid
    const operations = [
      prisma.pago.create({
        data: {
          licitacionId: id,
          monto: Number(monto),
          referencia,
          registradoPorId: user.id,
        },
      }),
    ];

    if (check.saldoPendiente === 0) {
      operations.push(
        prisma.licitacion.update({
          where: { id },
          data: { estado: 'cobrada' },
        }) as never
      );
      operations.push(
        prisma.historialTransicion.create({
          data: {
            licitacionId: id,
            estadoAnterior: 'por_cobrar',
            estadoNuevo: 'cobrada',
            usuarioId: user.id,
          },
        }) as never
      );
    }

    await prisma.$transaction(operations);

    return NextResponse.json({
      message: check.saldoPendiente === 0
        ? 'Pago registrado. Licitacion cobrada completamente.'
        : 'Pago registrado',
      saldoPendiente: check.saldoPendiente,
      cobrada: check.saldoPendiente === 0,
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
