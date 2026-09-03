import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailParams) {
  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (error) throw new Error(`Error enviando email: ${error.message}`);
  return data;
}

export function buildLicitacionEmailHtml(licitacion: {
  titulo: string;
  descripcion?: string | null;
  presupuestoMaximo: number;
  fechaLimite: Date;
  productos: { producto: { nombre: string }; cantidad: number; precioUnitario: number }[];
}) {
  const totalProductos = licitacion.productos.reduce(
    (sum, p) => sum + p.cantidad * p.precioUnitario, 0
  );

  const productosHtml = licitacion.productos
    .map(
      (p) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${p.producto.nombre}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${p.cantidad}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">$${p.precioUnitario.toLocaleString()}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">$${(p.cantidad * p.precioUnitario).toLocaleString()}</td>
        </tr>`
    )
    .join('');

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
      <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">Propuesta de Licitacion</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px">${licitacion.titulo}</p>
      </div>
      <div style="padding:24px">
        ${licitacion.descripcion ? `<p style="color:#475569;line-height:1.6">${licitacion.descripcion}</p>` : ''}
        <div style="display:flex;gap:16px;margin:20px 0">
          <div style="flex:1;background:#f1f5f9;padding:16px;border-radius:8px;text-align:center">
            <p style="margin:0;color:#64748b;font-size:12px">PRESUPUESTO</p>
            <p style="margin:4px 0 0;color:#1e293b;font-size:20px;font-weight:700">$${licitacion.presupuestoMaximo.toLocaleString()}</p>
          </div>
          <div style="flex:1;background:#f1f5f9;padding:16px;border-radius:8px;text-align:center">
            <p style="margin:0;color:#64748b;font-size:12px">FECHA LIMITE</p>
            <p style="margin:4px 0 0;color:#1e293b;font-size:20px;font-weight:700">${new Date(licitacion.fechaLimite).toLocaleDateString('es-MX')}</p>
          </div>
        </div>
        <h3 style="color:#1e293b;margin:24px 0 12px">Productos</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:12px">Producto</th>
              <th style="padding:8px 12px;text-align:center;color:#64748b;font-size:12px">Cant.</th>
              <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:12px">P. Unit.</th>
              <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:12px">Subtotal</th>
            </tr>
          </thead>
          <tbody>${productosHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:12px;text-align:right;font-weight:700;color:#1e293b">Total:</td>
              <td style="padding:12px;text-align:right;font-weight:700;color:#3b82f6;font-size:18px">$${totalProductos.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center">Documento de propuesta adjunto a este correo.</p>
      </div>
    </div>
  `;
}

export function buildReminderEmailHtml(licitacion: {
  titulo: string;
  fechaLimite: Date;
}) {
  const horasRestantes = Math.round(
    (new Date(licitacion.fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60)
  );

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
      <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">Recordatorio de Vencimiento</h1>
      </div>
      <div style="padding:24px;text-align:center">
        <p style="color:#1e293b;font-size:18px;font-weight:600">${licitacion.titulo}</p>
        <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:0;color:#92400e;font-size:14px">Esta licitacion vence en aproximadamente</p>
          <p style="margin:8px 0 0;color:#92400e;font-size:32px;font-weight:700">${horasRestantes}h</p>
        </div>
        <p style="color:#64748b;font-size:14px">Fecha limite: ${new Date(licitacion.fechaLimite).toLocaleString('es-MX')}</p>
      </div>
    </div>
  `;
}
