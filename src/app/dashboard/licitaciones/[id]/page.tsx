'use client';

import { useEffect, useState, FormEvent, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface Producto {
  id: string;
  nombre: string;
  precioBase: number;
}

interface LicitacionProducto {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  producto: Producto;
}

interface Transicion {
  id: string;
  estadoAnterior: string;
  estadoNuevo: string;
  fecha: string;
  usuario: { nombre: string };
}

interface PagoItem {
  id: string;
  monto: number;
  referencia: string | null;
  fecha: string;
  registradoPor: { nombre: string };
}

interface LicitacionDetail {
  id: string;
  titulo: string;
  descripcion: string | null;
  presupuestoMaximo: number;
  fechaLimite: string;
  estado: string;
  documentoUrl: string | null;
  documentoNombre: string | null;
  createdAt: string;
  cliente: { id: string; nombre: string; empresa: string; email: string };
  creadoPor: { nombre: string };
  productos: LicitacionProducto[];
  historial: Transicion[];
  pagos: PagoItem[];
  totalProductos: number;
  totalPagos: number;
  saldoPendiente: number;
}

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  activa: 'Activa',
  finalizada: 'Finalizada',
  por_cobrar: 'Por Cobrar',
  cobrada: 'Cobrada',
  perdida: 'Perdida',
};

const ESTADO_DOT_COLOR: Record<string, string> = {
  borrador: 'violet',
  activa: 'blue',
  finalizada: 'green',
  por_cobrar: 'amber',
  cobrada: 'cyan',
  perdida: 'red',
};

export default function LicitacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [lic, setLic] = useState<LicitacionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productos');

  // Product modal
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [allProducts, setAllProducts] = useState<Producto[]>([]);
  const [prodForm, setProdForm] = useState({ productoId: '', cantidad: '1', precioUnitario: '' });
  const [savingProd, setSavingProd] = useState(false);

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ monto: '', referencia: '' });
  const [savingPay, setSavingPay] = useState(false);

  // Upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState('');

  const fetchDetail = useCallback(() => {
    fetch(`/api/licitaciones/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setLic)
      .catch(() => {
        showToast('Error cargando licitacion', 'error');
        router.push('/dashboard/licitaciones');
      })
      .finally(() => setLoading(false));
  }, [id, router, showToast]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // Add product
  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();
    setSavingProd(true);
    try {
      const res = await fetch(`/api/licitaciones/${id}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: prodForm.productoId,
          cantidad: Number(prodForm.cantidad),
          precioUnitario: Number(prodForm.precioUnitario),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); setSavingProd(false); return; }
      showToast('Producto agregado', 'success');
      setShowAddProduct(false);
      setProdForm({ productoId: '', cantidad: '1', precioUnitario: '' });
      fetchDetail();
    } catch { showToast('Error', 'error'); }
    setSavingProd(false);
  }

  // Remove product
  async function handleRemoveProduct(lpId: string) {
    if (!confirm('Eliminar este producto de la licitacion?')) return;
    try {
      const res = await fetch(`/api/licitaciones/${id}/productos?lpId=${lpId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); return; }
      showToast('Producto eliminado', 'success');
      fetchDetail();
    } catch { showToast('Error', 'error'); }
  }

  // Upload document
  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append('documento', file);
    try {
      const res = await fetch(`/api/licitaciones/${id}/documento`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); setUploading(false); return; }
      showToast('Documento subido correctamente', 'success');
      fetchDetail();
    } catch { showToast('Error subiendo documento', 'error'); }
    setUploading(false);
  }

  // State transitions
  async function handleAction(action: string, label: string) {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/licitaciones/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); setActionLoading(''); return; }
      showToast(data.message || `${label} exitoso`, 'success');
      fetchDetail();
    } catch { showToast('Error', 'error'); }
    setActionLoading('');
  }

  // Payment
  async function handlePayment(e: FormEvent) {
    e.preventDefault();
    setSavingPay(true);
    try {
      const res = await fetch(`/api/licitaciones/${id}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: Number(payForm.monto), referencia: payForm.referencia }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); setSavingPay(false); return; }
      showToast(data.message, 'success');
      setShowPayment(false);
      setPayForm({ monto: '', referencia: '' });
      fetchDetail();
    } catch { showToast('Error', 'error'); }
    setSavingPay(false);
  }

  function openProductModal() {
    fetch('/api/productos').then((r) => r.json()).then(setAllProducts);
    setShowAddProduct(true);
  }

  if (loading) {
    return (
      <div className="page-body">
        <div className="loading-screen"><div className="spinner spinner-lg" /><p>Cargando detalle...</p></div>
      </div>
    );
  }

  if (!lic) return null;

  const isEditable = lic.estado === 'borrador' || lic.estado === 'activa';
  const budgetUsed = lic.presupuestoMaximo > 0 ? (lic.totalProductos / lic.presupuestoMaximo) * 100 : 0;
  const paymentProgress = lic.totalProductos > 0 ? (lic.totalPagos / lic.totalProductos) * 100 : 0;

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg animate-fade-in-up" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/licitaciones')} style={{ marginBottom: 8 }}>
            {'\u2190'} Volver
          </button>
          <h2 className="page-title">{lic.titulo}</h2>
          <p className="page-subtitle">
            {lic.cliente.empresa} &middot; Creado por {lic.creadoPor.nombre}
          </p>
        </div>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          <span className={`badge badge-${lic.estado}`} style={{ fontSize: 14, padding: '6px 16px' }}>
            <span className="badge-dot" />
            {ESTADO_LABELS[lic.estado]}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="detail-info-grid mb-lg animate-fade-in-up stagger-1">
        <div className="detail-info-item">
          <div className="detail-info-label">Presupuesto Maximo</div>
          <div className="detail-info-value money">${lic.presupuestoMaximo.toLocaleString()}</div>
        </div>
        <div className="detail-info-item">
          <div className="detail-info-label">Total Productos</div>
          <div className="detail-info-value">${lic.totalProductos.toLocaleString()}</div>
          <div className="progress-bar mt-sm">
            <div
              className={`progress-fill ${budgetUsed > 90 ? 'danger' : ''}`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {budgetUsed.toFixed(1)}% del presupuesto
          </div>
        </div>
        <div className="detail-info-item">
          <div className="detail-info-label">Fecha Limite</div>
          <div className="detail-info-value">{new Date(lic.fechaLimite).toLocaleDateString('es-MX')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {new Date(lic.fechaLimite).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="detail-info-item">
          <div className="detail-info-label">Cliente</div>
          <div className="detail-info-value" style={{ fontSize: 16 }}>{lic.cliente.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{lic.cliente.email}</div>
        </div>
      </div>

      {/* Payment progress for por_cobrar/cobrada */}
      {(lic.estado === 'por_cobrar' || lic.estado === 'cobrada') && (
        <div className="card mb-lg animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-md">
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Progreso de Cobro</h3>
            <span style={{ fontSize: 14, color: 'var(--accent-green)', fontWeight: 700 }}>
              ${lic.totalPagos.toLocaleString()} / ${lic.totalProductos.toLocaleString()}
            </span>
          </div>
          <div className="progress-bar" style={{ height: 12 }}>
            <div className="progress-fill success" style={{ width: `${paymentProgress}%` }} />
          </div>
          <div className="flex items-center justify-between mt-sm" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            <span>{paymentProgress.toFixed(1)}% cobrado</span>
            <span>Pendiente: ${lic.saldoPendiente.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Document */}
      <div className="card mb-lg animate-fade-in-up stagger-2">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Documento de Propuesta</h3>
        {lic.documentoUrl ? (
          <div className="file-uploaded">
            <span className="file-uploaded-icon">{'\u2713'}</span>
            <span className="file-uploaded-name">{lic.documentoNombre}</span>
            <a
              href={lic.documentoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              Ver documento
            </a>
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileRef}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <div
              className={`file-upload ${uploading ? '' : ''}`}
              onClick={() => !uploading && fileRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-sm">
                  <div className="spinner spinner-lg" />
                  <p style={{ color: 'var(--text-secondary)' }}>Subiendo documento...</p>
                </div>
              ) : (
                <>
                  <div className="file-upload-icon">{'\u2191'}</div>
                  <div className="file-upload-text">
                    <span>Haz clic para subir</span> o arrastra un archivo
                  </div>
                  <div className="file-upload-hint">PDF, DOC, DOCX hasta 10MB</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-sm mb-lg animate-fade-in-up stagger-3" style={{ flexWrap: 'wrap' }}>
        {lic.estado === 'borrador' && lic.documentoUrl && (
          <button
            className="btn btn-primary"
            onClick={() => handleAction('enviar', 'Envio')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'enviar' ? <><span className="spinner" /> Enviando...</> : 'Enviar Licitacion'}
          </button>
        )}
        {lic.estado === 'activa' && (
          <>
            <button
              className="btn btn-success"
              onClick={() => handleAction('finalizar', 'Finalizacion')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'finalizar' ? <><span className="spinner" /> ...</> : 'Marcar Finalizada'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleAction('perder', 'Perdida')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'perder' ? <><span className="spinner" /> ...</> : 'Marcar Perdida'}
            </button>
          </>
        )}
        {lic.estado === 'finalizada' && (
          <button
            className="btn btn-warning"
            onClick={() => handleAction('facturar', 'Facturacion')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'facturar' ? <><span className="spinner" /> ...</> : 'Facturar (Por Cobrar)'}
          </button>
        )}
        {lic.estado === 'por_cobrar' && (
          <button className="btn btn-success" onClick={() => setShowPayment(true)}>
            Registrar Pago
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs animate-fade-in-up stagger-4">
        <button className={`tab ${activeTab === 'productos' ? 'active' : ''}`} onClick={() => setActiveTab('productos')}>
          Productos ({lic.productos.length})
        </button>
        <button className={`tab ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
          Historial ({lic.historial.length})
        </button>
        {lic.pagos.length > 0 && (
          <button className={`tab ${activeTab === 'pagos' ? 'active' : ''}`} onClick={() => setActiveTab('pagos')}>
            Pagos ({lic.pagos.length})
          </button>
        )}
      </div>

      {/* Tab: Products */}
      {activeTab === 'productos' && (
        <div className="animate-fade-in">
          {isEditable && (
            <div className="mb-md">
              <button className="btn btn-secondary btn-sm" onClick={openProductModal}>
                + Agregar Producto
              </button>
            </div>
          )}
          <div className="table-container">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                    {isEditable && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {lic.productos.length === 0 ? (
                    <tr><td colSpan={isEditable ? 5 : 4} className="table-empty"><p>Sin productos</p></td></tr>
                  ) : (
                    lic.productos.map((p) => (
                      <tr key={p.id}>
                        <td className="td-primary">{p.producto.nombre}</td>
                        <td>{p.cantidad}</td>
                        <td>${p.precioUnitario.toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                          ${(p.cantidad * p.precioUnitario).toLocaleString()}
                        </td>
                        {isEditable && (
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveProduct(p.id)}
                            >
                              Quitar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                  {lic.productos.length > 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>Total:</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: 16 }}>
                        ${lic.totalProductos.toLocaleString()}
                      </td>
                      {isEditable && <td />}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'historial' && (
        <div className="animate-fade-in">
          {lic.historial.length === 0 ? (
            <div className="card"><p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sin transiciones registradas</p></div>
          ) : (
            <div className="timeline" style={{ marginTop: 8 }}>
              {lic.historial.map((t, i) => (
                <div key={t.id} className="timeline-item" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={`timeline-dot ${ESTADO_DOT_COLOR[t.estadoNuevo] || 'blue'}`} />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-title">
                        <span className={`badge badge-${t.estadoAnterior}`} style={{ marginRight: 8 }}>{ESTADO_LABELS[t.estadoAnterior]}</span>
                        {'\u2192'}
                        <span className={`badge badge-${t.estadoNuevo}`} style={{ marginLeft: 8 }}>{ESTADO_LABELS[t.estadoNuevo]}</span>
                      </span>
                      <span className="timeline-date">
                        {new Date(t.fecha).toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div className="timeline-desc">Por: {t.usuario.nombre}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Payments */}
      {activeTab === 'pagos' && (
        <div className="animate-fade-in">
          <div className="table-container">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Referencia</th>
                    <th>Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                  {lic.pagos.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.fecha).toLocaleString('es-MX')}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${p.monto.toLocaleString()}</td>
                      <td>{p.referencia || '-'}</td>
                      <td>{p.registradoPor.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Producto</h3>
              <button className="modal-close" onClick={() => setShowAddProduct(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Producto</label>
                  <select
                    className="form-select"
                    value={prodForm.productoId}
                    onChange={(e) => {
                      const prod = allProducts.find((p) => p.id === e.target.value);
                      setProdForm({
                        ...prodForm,
                        productoId: e.target.value,
                        precioUnitario: prod ? String(prod.precioBase) : '',
                      });
                    }}
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} - ${p.precioBase.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cantidad</label>
                    <input className="form-input" type="number" min="1" value={prodForm.cantidad} onChange={(e) => setProdForm({ ...prodForm, cantidad: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio Unitario</label>
                    <input className="form-input" type="number" step="0.01" min="0" value={prodForm.precioUnitario} onChange={(e) => setProdForm({ ...prodForm, precioUnitario: e.target.value })} required />
                  </div>
                </div>
                {prodForm.cantidad && prodForm.precioUnitario && (
                  <div className="alert-card info">
                    Subtotal: ${(Number(prodForm.cantidad) * Number(prodForm.precioUnitario)).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProduct(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingProd}>
                  {savingProd ? <><span className="spinner" /> Agregando...</> : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Pago</h3>
              <button className="modal-close" onClick={() => setShowPayment(false)}>&times;</button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="modal-body">
                <div className="alert-card info" style={{ marginBottom: 20 }}>
                  Saldo pendiente: ${lic.saldoPendiente.toLocaleString()}
                </div>
                <div className="form-group">
                  <label className="form-label">Monto</label>
                  <input className="form-input" type="number" step="0.01" min="0.01" max={lic.saldoPendiente} value={payForm.monto} onChange={(e) => setPayForm({ ...payForm, monto: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Referencia (opcional)</label>
                  <input className="form-input" value={payForm.referencia} onChange={(e) => setPayForm({ ...payForm, referencia: e.target.value })} placeholder="No. de transferencia, cheque, etc." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayment(false)}>Cancelar</button>
                <button type="submit" className="btn btn-success" disabled={savingPay}>
                  {savingPay ? <><span className="spinner" /> Registrando...</> : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
