import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

const parseImagenes = (imagenes) => {
  if (Array.isArray(imagenes)) return imagenes;
  if (typeof imagenes === 'string') {
    try {
      const parsed = JSON.parse(imagenes);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

function OrdenClienteDetalle() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [orden, setOrden] = useState(location.state?.orden ? { ...location.state.orden, imagenes: parseImagenes(location.state.orden.imagenes) } : null);
  const [presupuestoAdmin, setPresupuestoAdmin] = useState('');
  const [notaPresupuesto, setNotaPresupuesto] = useState('');

  const isAdmin = useMemo(() => {
    const normalizedRole = String(role || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return normalizedRole === 'admin' || normalizedRole === 'administrador';
  }, [role]);

  const handleEliminarImagen = async (imageUrl) => {
    if (!orden?.folio) return;

    const result = await Swal.fire({
      title: '¿Eliminar foto?',
      text: 'Esta imagen se eliminará de la orden.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/orders/${orden.folio}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || '',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo eliminar la imagen');
      }

      setOrden((prev) => ({
        ...prev,
        imagenes: Array.isArray(data?.imagenes) ? data.imagenes : [],
      }));

      Swal.fire('Eliminada', 'La foto se eliminó correctamente.', 'success');
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo eliminar la foto', 'error');
    }
  };

  const handleAceptarPresupuestoCliente = async () => {
    if (!orden?.folio) return;
    try {
      const response = await fetch(`/api/orders/${orden.folio}/presupuesto-aceptar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || '',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo aceptar el presupuesto');
      }
      setOrden((prev) => ({ ...prev, estadoPresupuesto: 'aceptado' }));
      Swal.fire('Aceptado', 'Presupuesto del cliente aceptado correctamente.', 'success');
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo aceptar el presupuesto', 'error');
    }
  };

  const handleProponerPresupuesto = async () => {
    if (!orden?.folio) return;
    if (!presupuestoAdmin || Number(presupuestoAdmin) <= 0) {
      Swal.fire('Campo requerido', 'Ingresa un presupuesto válido.', 'warning');
      return;
    }
    try {
      const response = await fetch(`/api/orders/${orden.folio}/presupuesto-admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || '',
        },
        body: JSON.stringify({
          presupuestoAdmin: Number(presupuestoAdmin),
          notaPresupuesto: notaPresupuesto?.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo enviar la propuesta');
      }
      setOrden((prev) => ({
        ...prev,
        presupuestoAdmin: Number(presupuestoAdmin),
        notaPresupuesto: notaPresupuesto?.trim() || null,
        estadoPresupuesto: 'pendiente_aprobacion',
      }));
      Swal.fire('Enviado', 'El nuevo presupuesto fue enviado al cliente.', 'success');
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo enviar la propuesta', 'error');
    }
  };

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
            <div className="text-3xl font-extrabold text-[#1976F3] tracking-widest font-mono">{orden.folio || orden.id}</div>
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

      {/* Card Presupuesto */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-2.5 0-4 1.2-4 2.7S9.5 13.4 12 13.4s4 1.2 4 2.7-1.5 2.7-4 2.7-4-1.2-4-2.7M12 5v14"/></svg>
            <span className="font-bold text-blue-700 text-lg">Presupuesto</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold mb-1">Presupuesto del cliente</div>
              <div className="font-bold text-blue-700 text-lg">
                {orden.presupuestoCliente ? `$${Number(orden.presupuestoCliente).toFixed(2)}` : 'No definido'}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold mb-1">Costo</div>
              <div className="font-bold text-indigo-700 text-lg">
                {orden.presupuestoAdmin ? `$${Number(orden.presupuestoAdmin).toFixed(2)}` : 'Sin propuesta'}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              orden.estadoPresupuesto === 'aceptado' ? 'bg-green-100 text-green-700' :
              orden.estadoPresupuesto === 'rechazado' ? 'bg-red-100 text-red-700' :
              orden.estadoPresupuesto === 'pendiente_aprobacion' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              Estado: {orden.estadoPresupuesto || 'sin_presupuesto'}
            </span>
          </div>

          {isAdmin && (
            <div className="border-t border-blue-100 pt-4 mt-2">
              {orden.presupuestoCliente && orden.estadoPresupuesto !== 'aceptado' && (
                <button
                  type="button"
                  onClick={handleAceptarPresupuestoCliente}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold shadow hover:bg-green-700 transition-all mr-2"
                >
                  Aceptar presupuesto del cliente
                </button>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={presupuestoAdmin}
                  onChange={(e) => setPresupuestoAdmin(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-blue-200 bg-white"
                  placeholder="Nuevo presupuesto admin"
                />
                <input
                  type="text"
                  value={notaPresupuesto}
                  onChange={(e) => setNotaPresupuesto(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-blue-200 bg-white"
                  placeholder="Nota para el cliente (opcional)"
                />
              </div>
              <button
                type="button"
                onClick={handleProponerPresupuesto}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-all"
              >
                Enviar Costo
              </button>
            </div>
          )}
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
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg border-2 border-blue-200 hover:border-blue-500 transition-all"
                >
                  <a
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block cursor-pointer"
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
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleEliminarImagen(img)}
                      className="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-lg bg-red-600 text-white shadow hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
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
