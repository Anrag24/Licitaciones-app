import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { esTransicionValida } from '@/lib/validaciones';
import { sendEmail, buildLicitacionEmailHtml } from '@/lib/resend';

export async function POST(
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
        productos: { include: { producto: true } },
      },
    });

    if (!licitacion) {
      return NextResponse.json({ error: 'Licitacion no encontrada' }, { status: 404 });
    }

    if (!esTransicionValida(licitacion.estado, 'activa')) {
      return NextResponse.json({ error: 'Transicion de estado no valida' }, { status: 400 });
    }

    if (!licitacion.documentoUrl) {
      return NextResponse.json(
        { error: 'La licitacion debe tener un documento de propuesta adjunto' },
        { status: 400 }
      );
    }

    // Transition to active
    await prisma.$transaction([
      prisma.licitacion.update({
        where: { id },
        data: { estado: 'activa' },
      }),
      prisma.historialTransicion.create({
        data: {
          licitacionId: id,
          estadoAnterior: 'borrador',
          estadoNuevo: 'activa',
          usuarioId: user.id,
        },
      }),
    ]);

    // Send email with proposal
    try {
      let attachment: Buffer | undefined;
      try {
        const res = await fetch(licitacion.documentoUrl);
        if (res.ok) attachment = Buffer.from(await res.arrayBuffer());
      } catch { /* continue without attachment if fetch fails */ }

      const html = buildLicitacionEmailHtml(licitacion);
      await sendEmail({
        to: licitacion.cliente.email,
        subject: `Propuesta de Licitacion: ${licitacion.titulo}`,
        html,
        attachments: attachment && licitacion.documentoNombre
          ? [{ filename: licitacion.documentoNombre, content: attachment }]
          : undefined,
      });
    } catch { /* log email error but don't fail the transition */ }

    return NextResponse.json({ message: 'Licitacion enviada correctamente' });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
