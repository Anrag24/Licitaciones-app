'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useToast } from '@/components/Toast';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  createdAt: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'user' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchUsuarios = () => {
    fetch('/api/usuarios')
      .then((r) => r.json())
      .then(setUsuarios)
      .catch(() => showToast('Error cargando usuarios', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsuarios(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/usuarios', {
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
      showToast('Usuario creado correctamente', 'success');
      setShowModal(false);
      setForm({ nombre: '', email: '', password: '', rol: 'user' });
      fetchUsuarios();
    } catch {
      showToast('Error de conexion', 'error');
    }
    setSaving(false);
  }

  return (
    <div className="page-body">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 className="page-title animate-fade-in-up">Usuarios</h2>
          <p className="page-subtitle animate-fade-in-up stagger-1">
            Administracion de usuarios del sistema
          </p>
        </div>
        <button className="btn btn-primary animate-fade-in" onClick={() => setShowModal(true)}>
          + Nuevo Usuario
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
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="table-empty"><p>No hay usuarios registrados</p></td></tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id}>
                      <td className="td-primary">{u.nombre}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge badge-${u.rol}`}>{u.rol}</span></td>
                      <td>{new Date(u.createdAt).toLocaleDateString('es-MX')}</td>
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
              <h3 className="modal-title">Nuevo Usuario</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contrasena</label>
                  <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-select" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Guardando...</> : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
