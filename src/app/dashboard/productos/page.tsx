'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useToast } from '@/components/Toast';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioBase: number;
  createdAt: string;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precioBase: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchProductos = () => {
    fetch('/api/productos')
      .then((r) => r.json())
      .then(setProductos)
      .catch(() => showToast('Error cargando productos', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProductos(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, precioBase: Number(form.precioBase) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, 'error');
        setSaving(false);
        return;
      }
      showToast('Producto creado correctamente', 'success');
      setShowModal(false);
      setForm({ nombre: '', descripcion: '', precioBase: '' });
      fetchProductos();
    } catch {
      showToast('Error de conexion', 'error');
    }
    setSaving(false);
  }

  return (
    <div className="page-body">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 className="page-title animate-fade-in-up">Productos</h2>
          <p className="page-subtitle animate-fade-in-up stagger-1">
            Catalogo de productos disponibles
          </p>
        </div>
        <button className="btn btn-primary animate-fade-in" onClick={() => setShowModal(true)}>
          + Nuevo Producto
        </button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner spinner-lg" /><p>Cargando...</p></div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripcion</th>
                  <th>Precio Base</th>
                  <th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr><td colSpan={4} className="table-empty"><p>No hay productos registrados</p></td></tr>
                ) : (
                  productos.map((p) => (
                    <tr key={p.id}>
                      <td className="td-primary">{p.nombre}</td>
                      <td>{p.descripcion || '-'}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                        ${p.precioBase.toLocaleString()}
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString('es-MX')}</td>
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
              <h3 className="modal-title">Nuevo Producto</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripcion (opcional)</label>
                  <textarea className="form-input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio Base</label>
                  <input className="form-input" type="number" step="0.01" min="0" value={form.precioBase} onChange={(e) => setForm({ ...form, precioBase: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Guardando...</> : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
