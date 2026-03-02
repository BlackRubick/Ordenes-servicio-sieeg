
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const navLinks =
    normalizedRole === 'tecnico'
      ? [
          { name: 'Mis Órdenes', to: '/admin/orders' },
          { name: 'Servicios Foráneos', to: '/servicios-foraneos' },
          { name: 'Órdenes de Clientes', to: '/ordenes-clientes' },
        ]
      : [
          { name: 'Dashboard', to: '/admin' },
          { name: 'Órdenes', to: '/admin/orders' },
          { name: 'Usuarios', to: '/admin/technicians' },
          { name: 'Servicios Foráneos', to: '/servicios-foraneos' },
          { name: 'Órdenes de Clientes', to: '/ordenes-clientes' },
          { name: 'Consulta Pública', to: '/consulta-tu-orden' },
          { name: 'Solicitar Orden de Servicio', to: '/solicitar-orden-cliente' },
        ];
  return (
    <header className="w-full h-20 bg-navbar shadow-soft flex items-center px-8 justify-between transition-all duration-300 border-b border-border fixed top-0 left-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-primary-500 tracking-tight select-none">SIEEG</span>
      </div>
      
      {/* Links principales (Desktop) */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            {...(link.to === '/admin' ? { end: true } : {})}
            className={({ isActive }) =>
              `relative text-base font-medium px-2 py-1 transition-all duration-300 text-dark after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:rounded-full after:bg-primary-500 after:transition-all after:duration-300 ${
                isActive
                  ? 'after:scale-x-100 after:opacity-100 text-primary-600'
                  : 'after:scale-x-0 after:opacity-0 hover:text-primary-500'
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
      
      {/* Botones derecha */}
      <div className="flex items-center gap-4">
        {/* Botón cerrar sesión (Desktop) */}
        <button
          className="hidden md:block px-4 py-2 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all"
          onClick={() => {
            logout();
            navigate('/login_magic');
          }}
        >
          Cerrar sesión
        </button>
        
        {/* Botón hamburguesa (Mobile) */}
        <button
          className="md:hidden flex flex-col gap-1.5 w-8 h-8 items-center justify-center"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          <span className={`w-6 h-0.5 bg-dark transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-dark transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-dark transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>
      
      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-navbar shadow-lg border-b border-border">
          <nav className="flex flex-col py-4">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                {...(link.to === '/admin' ? { end: true } : {})}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `px-8 py-3 text-base font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-500'
                      : 'text-dark hover:bg-gray-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            <button
              className="mx-8 mt-4 px-4 py-2 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all"
              onClick={() => {
                logout();
                navigate('/login_magic');
                setIsMenuOpen(false);
              }}
            >
              Cerrar sesión
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
