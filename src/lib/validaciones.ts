// Prisma types
import { EstadoLicitacion } from '@prisma/client';

// Valid state transitions
const TRANSICIONES_VALIDAS: Record<EstadoLicitacion, EstadoLicitacion[]> = {
  borrador: ['activa'],
  activa: ['finalizada', 'perdida'],
  finalizada: ['por_cobrar'],
  por_cobrar: ['cobrada'],
  cobrada: [],
  perdida: [],
};

export function esTransicionValida(
  estadoActual: EstadoLicitacion,
  estadoNuevo: EstadoLicitacion
): boolean {
  return TRANSICIONES_VALIDAS[estadoActual]?.includes(estadoNuevo) ?? false;
}

export function esEditable(estado: EstadoLicitacion): boolean {
  return estado === 'borrador';
}

export function validarPresupuesto(
  productosActuales: { cantidad: number; precioUnitario: number }[],
  presupuestoMaximo: number,
  nuevoProducto?: { cantidad: number; precioUnitario: number }
): { valido: boolean; totalActual: number; mensaje?: string } {
  let total = productosActuales.reduce(
    (sum, p) => sum + p.cantidad * p.precioUnitario, 0
  );

  if (nuevoProducto) {
    total += nuevoProducto.cantidad * nuevoProducto.precioUnitario;
  }

  if (total > presupuestoMaximo) {
    return {
      valido: false,
      totalActual: total,
      mensaje: `El total ($${total.toLocaleString()}) supera el presupuesto maximo ($${presupuestoMaximo.toLocaleString()})`,
    };
  }

  return { valido: true, totalActual: total };
}

export function validarPago(
  totalFacturado: number,
  pagosExistentes: { monto: number }[],
  nuevoPago: number
): { valido: boolean; saldoPendiente: number; mensaje?: string } {
  const totalPagado = pagosExistentes.reduce((sum, p) => sum + p.monto, 0);
  const saldoPendiente = totalFacturado - totalPagado;

  if (nuevoPago > saldoPendiente) {
    return {
      valido: false,
      saldoPendiente,
      mensaje: `El pago ($${nuevoPago.toLocaleString()}) supera el saldo pendiente ($${saldoPendiente.toLocaleString()})`,
    };
  }

  if (nuevoPago <= 0) {
    return {
      valido: false,
      saldoPendiente,
      mensaje: 'El monto del pago debe ser mayor a cero',
    };
  }

  return { valido: true, saldoPendiente: saldoPendiente - nuevoPago };
}
