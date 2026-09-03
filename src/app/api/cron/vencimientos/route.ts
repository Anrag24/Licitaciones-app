import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, buildReminderEmailHtml } from '@/lib/resend';

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    let expired = 0;
    let reminders = 0;

    // 1. Expire overdue active bids
    const vencidas = await prisma.licitacion.findMany({
      where: { estado: 'activa', fechaLimite: { lt: now } },
    });

    for (const lic of vencidas) {
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
            usuarioId: lic.creadoPorId,
          },
        }),
      ]);
      expired++;
    }

    // 2. Send 48h reminders
    const proximasVencer = await prisma.licitacion.findMany({
      where: {
        estado: 'activa',
        fechaLimite: { gt: now, lt: in48h },
        recordatorioEnviado: false,
      },
      include: { cliente: true },
    });

    for (const lic of proximasVencer) {
      try {
        const html = buildReminderEmailHtml(lic);
        await sendEmail({
          to: lic.cliente.email,
          subject: `Recordatorio: "${lic.titulo}" vence pronto`,
          html,
        });

        await prisma.licitacion.update({
          where: { id: lic.id },
          data: { recordatorioEnviado: true },
        });
        reminders++;
      } catch { /* continue with next */ }
    }

    return NextResponse.json({
      message: 'Cron ejecutado',
      expired,
      reminders,
      timestamp: now.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Error en cron' }, { status: 500 });
  }
}
