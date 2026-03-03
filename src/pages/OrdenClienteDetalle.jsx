import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function OrdenClienteDetalle() {
  const location = useLocation();
  const navigate = useNavigate();
  const orden = location.state?.orden;

  if (!orden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-red-500 font-bold mb-4">No se encontró la orden.</p>
        <button className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold shadow-lg hover:bg-primary-600 transition-all" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] to-[#eaf3fa] p-0 md:p-8 animate-fade-in" style={{marginTop: '80px'}}>
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-lg rounded-b-2xl px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-blue-100 animate-fade-in mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Folio</div>
            <div className="text-3xl font-extrabold text-[#1976F3] tracking-widest font-mono">{orden.id}</div>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`px-4 py-1 rounded-full font-bold text-sm shadow-sm border border-current transition-all bg-blue-100 text-blue-700`}>{orden.estado}</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <button
            className="px-6 py-2 rounded-xl bg-[#1976F3] text-white font-bold shadow-lg hover:bg-blue-700 transition-all"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8">
        {/* Cliente Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M5.5 21h13a2 2 0 002-2v-2a7 7 0 00-14 0v2a2 2 0 002 2z" /></svg>
            <span className="font-bold text-blue-700 text-lg">Cliente</span>
          </div>
          <div className="font-bold text-gray-800 text-base mb-1">{orden.cliente}</div>
          {orden.telefono && (
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V21a1 1 0 01-1.1 1A19.72 19.72 0 013 5.1 1 1 0 014 4h4.09a1 1 0 011 .75c.13.52.3 1.02.5 1.5a1 1 0 01-.23 1.09l-2.2 2.2a16.06 16.06 0 006.1 6.1l2.2-2.2a1 1 0 011.09-.23c.48.2.98.37 1.5.5a1 1 0 01.75 1V20a1 1 0 01-1 1z" /></svg>
              {orden.telefono}
            </div>
          )}
          {orden.correo && (
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4z" /><path d="M4 4l8 8 8-8" /></svg>
              {orden.correo}
            </div>
          )}
          <hr className="my-2" />
          <div className="text-xs text-gray-500 font-semibold mb-1">Dirección</div>
          <div className="font-bold text-gray-700 mb-2">{orden.direccion}</div>
        </div>
        {/* Equipo Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
            <span className="font-bold text-blue-700 text-lg">Equipo/Servicio</span>
          </div>
          {orden.tipoEquipo && (
            <div className="font-bold text-gray-800 text-base mb-1">{orden.tipoEquipo}</div>
          )}
          <hr className="my-2" />
          <div className="text-xs text-gray-500 font-semibold mb-1">Fecha de solicitud</div>
          <div className="font-bold text-gray-700 mb-2">{orden.fecha}</div>
        </div>
        {/* Estado Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="8" r="1" /></svg>
            <span className="font-bold text-blue-700 text-lg">Estado</span>
          </div>
          <div className="font-bold text-gray-800 text-base mb-1">{orden.estado}</div>
          <hr className="my-2" />
          <div className="text-xs text-gray-500 font-semibold mb-1">Técnico asignado</div>
          <div className="font-bold text-gray-700 mb-2">{orden.tecnico || 'Sin asignar'}</div>
        </div>
      </div>
      {/* Card Descripción del Problema o Servicio Requerido */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
            <span className="font-bold text-blue-700 text-lg">Descripción del Problema o Servicio Requerido</span>
          </div>
          <div className="text-gray-700 text-base font-semibold mt-2">
            {orden.descripcion || orden.description || 'No se ha proporcionado una descripción del problema o servicio requerido.'}
          </div>
        </div>
      </div>

      {/* Imágenes */}
      {orden.imagenes && orden.imagenes.length > 0 && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span className="font-bold text-blue-700 text-lg">Imágenes del Problema</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {orden.imagenes.map((img, index) => (
                <a
                  key={index}
                  href={img}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-lg border-2 border-blue-200 hover:border-blue-500 transition-all cursor-pointer"
                >
                  <img
                    src={img}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  </>

  );
}

export default OrdenClienteDetalle;
