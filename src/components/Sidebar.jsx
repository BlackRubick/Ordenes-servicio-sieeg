
import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => (
  <aside className="h-full w-20 md:w-64 bg-sidebar shadow-lg rounded-2xl p-4 flex flex-col items-center md:items-start transition-all duration-300">
    {/* Logo */}
    <div className="mb-8 w-full flex justify-center md:justify-start">
        <span className="font-bold text-white text-2xl tracking-tight drop-shadow">SIEEG</span>
    </div>
    {/* Navegación principal */}
    <nav className="flex flex-col gap-2 w-full">
      {(() => {
        const { role } = require('../store/authStore').useAuthStore.getState();
        const normalizedRole = String(role || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';
        const isMostrador = normalizedRole === 'mostrador';
        if (normalizedRole === 'tecnico') {
          return (
            <>
              <NavLink to="/admin/orders" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
                <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
                </span>
                <span className="hidden md:inline">Mis Órdenes</span>
              </NavLink>
              <NavLink to="/servicios-foraneos" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
                <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c2.5 2.5 2.5 7.5 0 10s-2.5 7.5 0 10"/></svg>
                </span>
                <span className="hidden md:inline">Servicios Foráneos</span>
              </NavLink>
              <NavLink to="/ordenes-clientes" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
                <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </span>
                <span className="hidden md:inline">Órdenes Clientes</span>
              </NavLink>
            </>
          );
        }
        if (isMostrador) {
          return (
            <>
              <NavLink to="/admin/orders" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
                <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
                </span>
                <span className="hidden md:inline">Órdenes</span>
              </NavLink>
              <NavLink to="/admin/orders/create" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
                <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                </span>
                <span className="hidden md:inline">Crear Orden</span>
              </NavLink>
              <NavLink to="/servicios-foraneos/crear" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
                <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </span>
                <span className="hidden md:inline">Crear Foráneo</span>
              </NavLink>
              <NavLink to="/ordenes-clientes" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
                <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </span>
                <span className="hidden md:inline">Órdenes Clientes</span>
              </NavLink>
            </>
          );
        }
        return (
          <>
            <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary/700 text-white font-semibold' : 'hover:bg-primary/600 hover:text-white text-gray-300'}`} end>
              <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0a2 2 0 002-2V7a2 2 0 00-.59-1.41l-7-7a2 2 0 00-2.82 0l-7 7A2 2 0 003 7v11a2 2 0 002 2h3" /></svg>
              </span>
              <span className="hidden md:inline">Dashboard</span>
            </NavLink>
            <NavLink to="/admin/orders" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
              <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
              </span>
              <span className="hidden md:inline">Órdenes</span>
            </NavLink>
            <NavLink to="/admin/orders/create" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
              <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
              </span>
              <span className="hidden md:inline">Crear Orden</span>
            </NavLink>
            <NavLink to="/admin/orders/deleted" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
              <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M9 6v12a2 2 0 002 2h2a2 2 0 002-2V6"/></svg>
              </span>
              <span className="hidden md:inline">Eliminadas</span>
            </NavLink>
            <NavLink to="/admin/technicians" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
              <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </span>
              <span className="hidden md:inline">Técnicos</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin/clientes" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
                <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
                </span>
                <span className="hidden md:inline">Clientes</span>
              </NavLink>
            )}
            <NavLink to="/servicios-foraneos" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
              <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c2.5 2.5 2.5 7.5 0 10s-2.5 7.5 0 10"/></svg>
              </span>
              <span className="hidden md:inline">Servicios Foráneos</span>
            </NavLink>
            <NavLink to="/servicios-foraneos/crear" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
              <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </span>
              <span className="hidden md:inline">Crear Foráneo</span>
            </NavLink>
            <NavLink to="/ordenes-clientes" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${isActive ? 'bg-primary-700 text-white font-semibold' : 'hover:bg-primary-600 hover:text-white text-gray-300'}`}> 
              <span className="w-6 h-6 bg-primary/600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </span>
              <span className="hidden md:inline">Órdenes Clientes</span>
            </NavLink>
          </>
        );
      })()}
    </nav>
    {/* Espaciador */}
    <div className="flex-1" />
    {/* Avatar usuario */}
    <div className="w-full flex justify-center md:justify-start">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center shadow-card border-2 border-primary-700">
        <span className="text-white font-bold">A</span>
      </div>
    </div>
  </aside>
);

export default Sidebar;
