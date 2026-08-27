import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';
  const isMostrador = normalizedRole === 'mostrador';
  const isCotizador = normalizedRole === 'cotizador';
  const isVendedor = normalizedRole === 'ejecutivo de ventas';

  const navLinks =
    normalizedRole === 'tecnico'
      ? [
          { name: 'Mis Órdenes', to: '/admin/orders' },
          { name: 'Cotizaciones', to: '/admin/quotes' },
          { name: 'Servicios Externos', to: '/servicios-externos' },
          { name: 'Órdenes de Clientes', to: '/ordenes-clientes' },
        ]
      : isMostrador
      ? [
          { name: 'Órdenes', to: '/admin/orders' },
          { name: 'Cotizaciones', to: '/admin/quotes' },
          { name: 'Crear Orden', to: '/admin/orders/create' },
          { name: 'Servicios Externos', to: '/servicios-externos' },
          { name: 'Crear Externo', to: '/servicios-externos/crear' },
          { name: 'Órdenes de Clientes', to: '/ordenes-clientes' },
        ]
      : [
          { name: 'Dashboard', to: '/admin' },
          { name: 'Órdenes', to: '/admin/orders' },
          { name: 'Cotizaciones', to: '/admin/quotes' },
          { name: 'Usuarios', to: '/admin/technicians' },
          ...(isAdmin ? [{ name: 'Clientes', to: '/admin/clientes' }] : []),
          ...(isAdmin ? [{ name: 'Reportes', to: '/admin/reportes/vendedores' }] : []),
          { name: 'Servicios Externos', to: '/servicios-externos' },
          { name: 'Órdenes de Clientes', to: '/ordenes-clientes' },
          { name: 'Consulta Pública', to: '/consulta-tu-orden' },
          { name: 'Solicitar Orden', to: '/solicitar-orden-cliente' },
        ];

  if (isCotizador || isVendedor) {
    navLinks.length = 0;
    navLinks.push({ name: 'Cotizaciones', to: '/admin/quotes' });
  }

  const roleLabel = role ? String(role) : '';

  const handleLogout = () => {
    logout();
    navigate('/login_magic');
    setIsMenuOpen(false);
  };

  return (
    <header className="w-full h-16 bg-white border-b border-gray-100 shadow-sm flex items-center px-5 justify-between fixed top-0 left-0 z-30">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-800 to-primary-500 flex items-center justify-center shadow-sm">
          <span className="text-white text-sm font-black leading-none">S</span>
        </div>
        <span className="text-sm font-bold text-gray-900 tracking-tight select-none hidden sm:block">SIEEG</span>
      </div>

      {/* ── Links desktop ── */}
      <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center px-4">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            {...(link.to === '/admin' ? { end: true } : {})}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-primary-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* ── Derecha: rol + salir + hamburguesa ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {roleLabel && (
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 select-none">
            {roleLabel}
          </span>
        )}

        <button
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-150"
          onClick={handleLogout}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Salir
        </button>

        {/* Hamburguesa */}
        <button
          className="lg:hidden w-9 h-9 flex flex-col gap-1.5 items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
          onClick={() => setIsMenuOpen(v => !v)}
          aria-label="Menú"
        >
          <span className={`w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* ── Menú móvil ── */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-lg">
          <nav className="flex flex-col gap-0.5 p-3">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                {...(link.to === '/admin' ? { end: true } : {})}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-primary-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 px-1">
              {roleLabel && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                  {roleLabel}
                </span>
              )}
              <button
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                onClick={handleLogout}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
