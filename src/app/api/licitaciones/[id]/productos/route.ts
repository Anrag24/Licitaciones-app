import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { esEditable, validarPresupuesto } from '@/lib/validaciones';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await params;
    const { productoId, cantidad, precioUnitario } = await req.json();

    if (!productoId || !cantidad || precioUnitario === undefined) {
      return NextResponse.json({ error: 'Producto, cantidad y precio son requeridos' }, { status: 400 });
    }

    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
      include: { productos: true },
    });

    if (!licitacion) {
      return NextResponse.json({ error: 'Licitacion no encontrada' }, { status: 404 });
    }

    if (!esEditable(licitacion.estado)) {
      return NextResponse.json(
        { error: 'No se pueden modificar productos en este estado' },
        { status: 400 }
      );
    }

    // Budget validation
    const check = validarPresupuesto(
      licitacion.productos,
      licitacion.presupuestoMaximo,
      { cantidad: Number(cantidad), precioUnitario: Number(precioUnitario) }
    );

    if (!check.valido) {
      return NextResponse.json({ error: check.mensaje }, { status: 400 });
    }

    const lp = await prisma.licitacionProducto.create({
      data: {
        licitacionId: id,
        productoId,
        cantidad: Number(cantidad),
        precioUnitario: Number(precioUnitario),
      },
      include: { producto: true },
    });

    return NextResponse.json(lp, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Este producto ya esta en la licitacion' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const productoLicitacionId = searchParams.get('lpId');

    if (!productoLicitacionId) {
      return NextResponse.json({ error: 'ID del producto en licitacion requerido' }, { status: 400 });
    }

    const licitacion = await prisma.licitacion.findUnique({ where: { id } });
    if (!licitacion) {
      return NextResponse.json({ error: 'Licitacion no encontrada' }, { status: 404 });
    }

    if (!esEditable(licitacion.estado)) {
      return NextResponse.json(
        { error: 'No se pueden modificar productos en este estado' },
        { status: 400 }
      );
    }

    await prisma.licitacionProducto.delete({
      where: { id: productoLicitacionId },
    });

    return NextResponse.json({ message: 'Producto eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
