'use client';

import { useEffect, useState } from 'react';

interface Stats {
  total: number;
  activas: number;
  finalizadas: number;
  porCobrar: number;
  cobradas: number;
  perdidas: number;
  borradores: number;
  proximasVencer: Licitacion[];
  montoTotal: number;
}

interface Licitacion {
  id: string;
  titulo: string;
  estado: string;
  fechaLimite: string;
  presupuestoMaximo: number;
  cliente: { nombre: string; empresa: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/licitaciones')
      .then((r) => r.json())
      .then((licitaciones: Licitacion[]) => {
        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const proximasVencer = licitaciones.filter(
          (l: Licitacion) =>
            l.estado === 'activa' &&
            new Date(l.fechaLimite) > now &&
            new Date(l.fechaLimite) < in48h
        );

        setStats({
          total: licitaciones.length,
          activas: licitaciones.filter((l: Licitacion) => l.estado === 'activa').length,
          finalizadas: licitaciones.filter((l: Licitacion) => l.estado === 'finalizada').length,
          porCobrar: licitaciones.filter((l: Licitacion) => l.estado === 'por_cobrar').length,
          cobradas: licitaciones.filter((l: Licitacion) => l.estado === 'cobrada').length,
          perdidas: licitaciones.filter((l: Licitacion) => l.estado === 'perdida').length,
          borradores: licitaciones.filter((l: Licitacion) => l.estado === 'borrador').length,
          proximasVencer,
          montoTotal: licitaciones.reduce((s: number, l: Licitacion) => s + l.presupuestoMaximo, 0),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-body">
        <div className="loading-screen">
          <div className="spinner spinner-lg" />
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Licitaciones', value: stats.total, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, color: 'blue' },
    { label: 'Activas', value: stats.activas, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, color: 'green' },
    { label: 'Borradores', value: stats.borradores, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>, color: 'violet' },
    { label: 'Por Cobrar', value: stats.porCobrar, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>, color: 'amber' },
    { label: 'Cobradas', value: stats.cobradas, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>, color: 'cyan' },
    { label: 'Perdidas', value: stats.perdidas, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>, color: 'red' },
  ];

  const hoursUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60)));
  };

  return (
    <div className="page-body">
      <div style={{ marginBottom: 24 }}>
        <h2 className="page-title animate-fade-in-up">Dashboard</h2>
        <p className="page-subtitle animate-fade-in-up stagger-1">
          Resumen general del sistema
        </p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="stat-card"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="stat-card" style={{ animationDelay: '360ms', marginBottom: 24 }}>
        <div className="stat-card-icon blue">{'\u0024'}</div>
        <div className="stat-card-value" style={{ color: 'var(--accent-green)' }}>
          ${stats.montoTotal.toLocaleString()}
        </div>
        <div className="stat-card-label">Presupuesto Total en Licitaciones</div>
      </div>

      {stats.proximasVencer.length > 0 && (
        <div className="table-container animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="table-header">
            <span className="table-title" style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Proximas a Vencer (menos de 48h)
            </span>
            <span className="badge badge-activa">
              <span className="badge-dot" />
              {stats.proximasVencer.length}
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Cliente</th>
                  <th>Presupuesto</th>
                  <th>Vence en</th>
                  <th>Fecha Limite</th>
                </tr>
              </thead>
              <tbody>
                {stats.proximasVencer.map((lic) => (
                  <tr key={lic.id}>
                    <td className="td-primary">{lic.titulo}</td>
                    <td>{lic.cliente.empresa}</td>
                    <td>${lic.presupuestoMaximo.toLocaleString()}</td>
                    <td>
                      <span className="badge badge-activa">
                        <span className="badge-dot" />
                        {hoursUntil(lic.fechaLimite)}h
                      </span>
                    </td>
                    <td>{new Date(lic.fechaLimite).toLocaleDateString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
