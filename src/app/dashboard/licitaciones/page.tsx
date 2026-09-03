'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface Licitacion {
  id: string;
  titulo: string;
  estado: string;
  presupuestoMaximo: number;
  fechaLimite: string;
  documentoUrl: string | null;
  createdAt: string;
  cliente: { id: string; nombre: string; empresa: string };
  productos: { cantidad: number; precioUnitario: number }[];
}

interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
}

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  activa: 'Activa',
  finalizada: 'Finalizada',
  por_cobrar: 'Por Cobrar',
  cobrada: 'Cobrada',
  perdida: 'Perdida',
};

export default function LicitacionesPage() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titulo: '', descripcion: '', presupuestoMaximo: '', fechaLimite: '', clienteId: '' });
  const [saving, setSaving] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const { showToast } = useToast();
  const router = useRouter();

  const fetchData = () => {
    Promise.all([
      fetch('/api/licitaciones').then((r) => r.json()),
      fetch('/api/clientes').then((r) => r.json()),
    ])
      .then(([lics, cls]) => {
        setLicitaciones(lics);
        setClientes(cls);
      })
      .catch(() => showToast('Error cargando datos', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/licitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          presupuestoMaximo: Number(form.presupuestoMaximo),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, 'error');
        setSaving(false);
        return;
      }
      showToast('Licitacion creada correctamente', 'success');
      setShowModal(false);
      setForm({ titulo: '', descripcion: '', presupuestoMaximo: '', fechaLimite: '', clienteId: '' });
      fetchData();
    } catch {
      showToast('Error de conexion', 'error');
    }
    setSaving(false);
  }

  const filtered = filterEstado
    ? licitaciones.filter((l) => l.estado === filterEstado)
    : licitaciones;

  const totalProductos = (prods: { cantidad: number; precioUnitario: number }[]) =>
    prods.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);

  return (
    <div className="page-body">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 className="page-title animate-fade-in-up">Licitaciones</h2>
          <p className="page-subtitle animate-fade-in-up stagger-1">
            Gestion de licitaciones comerciales
          </p>
        </div>
        <button className="btn btn-primary animate-fade-in" onClick={() => setShowModal(true)}>
          + Nueva Licitacion
        </button>
      </div>

      <div className="flex gap-sm mb-lg animate-fade-in" style={{ flexWrap: 'wrap' }}>
        <button className={`btn ${!filterEstado ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilterEstado('')}>
          Todas ({licitaciones.length})
        </button>
        {Object.entries(ESTADO_LABELS).map(([key, label]) => {
          const count = licitaciones.filter((l) => l.estado === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              className={`btn ${filterEstado === key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setFilterEstado(key)}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner spinner-lg" /><p>Cargando...</p></div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Presupuesto</th>
                  <th>Total Prod.</th>
                  <th>Fecha Limite</th>
                  <th>Documento</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty"><p>No hay licitaciones</p></td></tr>
                ) : (
                  filtered.map((l) => (
                    <tr
                      key={l.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/dashboard/licitaciones/${l.id}`)}
                    >
                      <td className="td-primary">{l.titulo}</td>
                      <td>{l.cliente.empresa}</td>
                      <td>
                        <span className={`badge badge-${l.estado}`}>
                          <span className="badge-dot" />
                          {ESTADO_LABELS[l.estado]}
                        </span>
                      </td>
                      <td>${l.presupuestoMaximo.toLocaleString()}</td>
                      <td>${totalProductos(l.productos).toLocaleString()}</td>
                      <td>{new Date(l.fechaLimite).toLocaleDateString('es-MX')}</td>
                      <td>{l.documentoUrl ? '\u2713' : '\u2014'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Licitacion</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Titulo</label>
                  <input className="form-input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripcion (opcional)</label>
                  <textarea className="form-input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Presupuesto Maximo</label>
                    <input className="form-input" type="number" step="0.01" min="0" value={form.presupuestoMaximo} onChange={(e) => setForm({ ...form, presupuestoMaximo: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha Limite</label>
                    <input className="form-input" type="datetime-local" value={form.fechaLimite} onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Cliente</label>
                  <select className="form-select" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} required>
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} - {c.empresa}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Creando...</> : 'Crear Licitacion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
