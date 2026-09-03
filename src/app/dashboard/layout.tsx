'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
  { href: '/dashboard/licitaciones', label: 'Licitaciones', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
  { href: '/dashboard/clientes', label: 'Clientes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
  { href: '/dashboard/productos', label: 'Productos', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> },
  { href: '/dashboard/usuarios', label: 'Usuarios', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ToastProvider>
      <div className="app-layout">
        {sidebarOpen && (
          <div
            className="sidebar-overlay open"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <div className="sidebar-brand-icon">L</div>
              <div>
                <div className="sidebar-brand-text">Licitaciones</div>
                <div className="sidebar-brand-sub">Sistema de Gestion</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section">
              <div className="sidebar-section-title">Menu</div>
              {NAV_ITEMS.map((item) => {
                if (item.adminOnly && user.rol !== 'admin') return null;
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="link-icon">{item.icon}</span>
                    {item.label}
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{initials}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.nombre}</div>
                <div className="sidebar-user-role">{user.rol}</div>
              </div>
            </div>
            <button
              className="sidebar-link"
              onClick={handleLogout}
              style={{ marginTop: 8, color: 'var(--accent-red)' }}
            >
              <span className="link-icon">{'\u2190'}</span>
              Cerrar Sesion
            </button>
          </div>
        </aside>

        <div className="main-content">
          <div className="page-header">
            <div className="page-header-left">
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {'\u2630'}
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
