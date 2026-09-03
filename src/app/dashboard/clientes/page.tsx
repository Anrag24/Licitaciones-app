'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useToast } from '@/components/Toast';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string;
  createdAt: string;
  _count: { licitaciones: number };
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', empresa: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchClientes = () => {
    fetch('/api/clientes')
      .then((r) => r.json())
      .then(setClientes)
      .catch(() => showToast('Error cargando clientes', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClientes(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, 'error');
        setSaving(false);
        return;
      }
      showToast('Cliente creado correctamente', 'success');
      setShowModal(false);
      setForm({ nombre: '', email: '', telefono: '', empresa: '' });
      fetchClientes();
    } catch {
      showToast('Error de conexion', 'error');
    }
    setSaving(false);
  }

  return (
    <div className="page-body">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 className="page-title animate-fade-in-up">Clientes</h2>
          <p className="page-subtitle animate-fade-in-up stagger-1">
            Administra los clientes del sistema
          </p>
        </div>
        <button className="btn btn-primary animate-fade-in" onClick={() => setShowModal(true)}>
          + Nuevo Cliente
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
                  <th>Empresa</th>
                  <th>Email</th>
                  <th>Telefono</th>
                  <th>Licitaciones</th>
                  <th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={6} className="table-empty"><p>No hay clientes registrados</p></td></tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id}>
                      <td className="td-primary">{c.nombre}</td>
                      <td>{c.empresa}</td>
                      <td>{c.email}</td>
                      <td>{c.telefono || '-'}</td>
                      <td><span className="badge badge-activa">{c._count.licitaciones}</span></td>
                      <td>{new Date(c.createdAt).toLocaleDateString('es-MX')}</td>
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
              <h3 className="modal-title">Nuevo Cliente</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Empresa</label>
                  <input className="form-input" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefono (opcional)</label>
                  <input className="form-input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Guardando...</> : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
