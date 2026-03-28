import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function SolicitarOrdenCliente() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clienteData, setClienteData] = useState(null);
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [mostrarPresupuesto, setMostrarPresupuesto] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [clienteOrdenes, setClienteOrdenes] = useState([]);
  const [tab, setTab] = useState('levantar'); // 'levantar' | 'ordenes'

  useEffect(() => {
    const savedCliente = localStorage.getItem('clienteData');
    if (savedCliente) {
      const cliente = JSON.parse(savedCliente);
      setClienteData(cliente);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && clienteData?.id) {
      fetch(`/api/orders?clienteId=${clienteData.id}`)
        .then(res => res.json())
        .then(data => setClienteOrdenes(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isAuthenticated, clienteData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usuario || !contrasena) {
      Swal.fire({ icon: 'error', title: 'Campos obligatorios', text: 'Por favor ingresa usuario y contraseña.' });
      return;
    }
    try {
      const res = await fetch('/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena })
      });
      const data = await res.json();
      if (data.success) {
        setClienteData(data.client);
        setIsAuthenticated(true);
        localStorage.setItem('clienteData', JSON.stringify(data.client));
        Swal.fire({ icon: 'success', title: '¡Bienvenido!', text: `Hola ${data.client.nombre}`, timer: 1500, showConfirmButton: false });
        setUsuario('');
        setContrasena('');
      } else {
        Swal.fire({ icon: 'error', title: 'Error de autenticación', text: data.message || 'Usuario o contraseña incorrectos' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClienteData(null);
    localStorage.removeItem('clienteData');
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipoEquipo || !direccion || !descripcion || !presupuesto) {
      Swal.fire({ icon: 'error', title: 'Campos obligatorios', text: 'Por favor completa todos los campos.' });
      return;
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoEquipo, direccion, descripcion, presupuesto })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: '¡Solicitud enviada!', text: 'Tu solicitud ha sido enviada correctamente.', timer: 1500, showConfirmButton: false });
        setTipoEquipo('');
        setDireccion('');
        setDescripcion('');
        setPresupuesto('');
        setMostrarPresupuesto(false);
        setSelectedImages([]);
        setImagePreviews([]);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo enviar la solicitud.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f6fbff] to-[#eaf3fa] px-2 py-8">
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
          <div className="flex flex-col items-center mb-6">
            <img src="/images/logo.ico" alt="Logo empresa" className="w-32 h-32 mb-4 object-contain" style={{aspectRatio: '1/1'}} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1a3a5e] mb-2 text-center">Iniciar Sesión</h2>
          <p className="mb-6 text-gray-600 text-center text-sm">Solicitar Orden de Servicio</p>
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Usuario</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
                placeholder="Ingresa tu usuario" value={usuario} onChange={e => setUsuario(e.target.value)} autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Contraseña</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
                placeholder="Ingresa tu contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} autoComplete="current-password"
              />
            </div>
            <button type="submit" className="px-4 py-3 rounded-xl bg-[#1a3a5e] text-white font-bold shadow-lg hover:bg-[#2d5075] transition-all mt-2">
              Iniciar Sesión
            </button>
          </form>
          <p className="text-center text-gray-500 text-xs mt-6">Si no tienes usuario, contacta al administrador</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f6fbff] to-[#eaf3fa] px-2 py-8">
      <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow-lg p-8 animate-fade-in mt-8">
        <div className="flex flex-col items-center mb-4">
          <img src="/images/logo.ico" alt="Logo empresa" className="w-36 h-36 mb-4 object-contain" style={{aspectRatio: '1/1'}} />
        </div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1a3a5e]">Panel de Cliente</h2>
            <p className="text-gray-600 text-sm">Bienvenido, <span className="font-semibold">{clienteData?.nombre}</span></p>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-semibold underline">Cerrar Sesión</button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700"><strong>Correo:</strong> {clienteData?.correo}</p>
          <p className="text-sm text-gray-700"><strong>Teléfono:</strong> {clienteData?.telefono}</p>
        </div>
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-xl font-bold shadow transition-all ${tab === 'levantar' ? 'bg-[#1a3a5e] text-white' : 'bg-gray-200 text-[#1a3a5e]'}`}
            onClick={() => setTab('levantar')}
          >Levantar orden</button>
          <button
            className={`px-4 py-2 rounded-xl font-bold shadow transition-all ${tab === 'ordenes' ? 'bg-[#1a3a5e] text-white' : 'bg-gray-200 text-[#1a3a5e]'}`}
            onClick={() => setTab('ordenes')}
          >Mis órdenes</button>
        </div>
        {tab === 'levantar' && (
          <>
            {clienteOrdenes.some(o => o.estadoPresupuesto === 'pendiente_aprobacion') && (
              <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                <span className="text-yellow-800 font-semibold text-sm">⚠️ Tienes un presupuesto pendiente de aprobación. Revísalo en "Mis Órdenes".</span>
              </div>
            )}
            <p className="mb-4 text-gray-700">Completa el formulario para generar tu solicitud.</p>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <input
                className="px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
                placeholder="Tipo de Equipo/Servicio (Ej: Laptop, Impresora, Red, etc.)"
                value={tipoEquipo} onChange={e => setTipoEquipo(e.target.value)}
              />
              <input
                className="px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
                placeholder="Dirección (Ej: Sucursal, Oficina, etc.)"
                value={direccion} onChange={e => setDireccion(e.target.value)}
              />
              <textarea
                className="px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm min-h-[100px] focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
                placeholder="Descripción del Problema o Servicio Requerido"
                value={descripcion} onChange={e => setDescripcion(e.target.value)}
              />

              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mostrarPresupuesto}
                    onChange={e => {
                      setMostrarPresupuesto(e.target.checked);
                      if (!e.target.checked) setPresupuesto('');
                    }}
                    className="form-checkbox h-5 w-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                  />
                  <span className="text-gray-700 font-semibold text-sm">¿Tienes presupuesto estimado?</span>
                </label>
                {mostrarPresupuesto && (
                  <div className="mt-2">
                    <label className="block text-gray-700 font-semibold mb-1 text-sm">Presupuesto estimado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input
                        type="number" min="0" step="0.01"
                        className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
                        placeholder="Ej: 500.00" value={presupuesto} onChange={e => setPresupuesto(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Indica cuánto tienes disponible. El administrador puede ajustarlo.</p>
                  </div>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Evidencia Fotográfica <span className="text-gray-400 font-normal">(máximo 2 archivos)</span>
                </label>
                <input
                  type="file" accept="image/*" multiple onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1a3a5e] file:text-white hover:file:bg-[#2d5075] transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, GIF, WEBP. Máximo 5MB por imagen.</p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                      <button
                        type="button" onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="px-4 py-3 rounded-xl bg-[#1a3a5e] text-white font-bold shadow-lg hover:bg-[#2d5075] transition-all mt-2">
                Enviar Solicitud
              </button>
            </form>
          </>
        )}
        {tab === 'ordenes' && (
          <>
            {clienteOrdenes.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-[#1a3a5e] mb-4">Mis Órdenes</h3>
                <div className="overflow-x-auto shadow-sm rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-[#1a3a5e] text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">Folio</th>
                        <th className="px-4 py-3 text-left">Fecha</th>
                        <th className="px-4 py-3 text-left">Equipo/Servicio</th>
                        <th className="px-4 py-3 text-left">Estado</th>
                        <th className="px-4 py-3 text-left">Presupuesto</th>
                        <th className="px-4 py-3 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {clienteOrdenes.map((orden) => {
                        const obs = (() => { try { return JSON.parse(orden.observaciones || '{}'); } catch { return {}; } })();
                        return (
                          <tr key={orden.id || orden.folio} className={`hover:bg-gray-50 ${orden.estadoPresupuesto === 'pendiente_aprobacion' ? 'bg-yellow-50' : ''}`}>
                            <td className="px-4 py-3 font-semibold text-[#1a3a5e]">{orden.folio || '-'}</td>
                            <td className="px-4 py-3">{orden.fecha ? new Date(orden.fecha).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3">{obs.tipoEquipo || orden.tipo || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                orden.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                (orden.status === 'entregada' || orden.status === 'Entregada') ? 'bg-green-100 text-green-700' :
                                (orden.status === 'cancelada' || orden.status === 'Cancelada') ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {orden.status || 'Pendiente'}
                              </span>
                            </td>
                            <td className="px-4 py-3 min-w-[180px]">
                              {(!orden.estadoPresupuesto || orden.estadoPresupuesto === 'sin_presupuesto') && (
                                <span className="text-gray-400 text-xs">
                                  {orden.presupuestoCliente ? `Tu estimado: $${parseFloat(orden.presupuestoCliente).toFixed(2)}` : 'Sin presupuesto aún'}
                                </span>
                              )}
                              {orden.estadoPresupuesto === 'pendiente_aprobacion' && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-yellow-700 font-bold text-sm">
                                    💰 Propuesta: ${orden.presupuestoAdmin ? parseFloat(orden.presupuestoAdmin).toFixed(2) : '—'}
                                  </span>
                                  {orden.notaPresupuesto && (
                                    <span className="text-gray-500 text-xs italic">"{orden.notaPresupuesto}"</span>
                                  )}
                                  <div className="flex gap-1 mt-1">
                                    <button
                                      onClick={() => handlePresupuestoClienteAcepta(orden.folio)}
                                      className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-all"
                                    >✓ Aceptar</button>
                                    <button
                                      onClick={() => handlePresupuestoClienteRechaza(orden.folio)}
                                      className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all"
                                    >✗ Rechazar</button>
                                  </div>
                                </div>
                              )}
                              {orden.estadoPresupuesto === 'aceptado' && (
                                <span className="text-green-700 font-bold text-sm">
                                  ✓ Aceptado: ${orden.presupuestoAdmin ? parseFloat(orden.presupuestoAdmin).toFixed(2) : (orden.presupuestoCliente ? parseFloat(orden.presupuestoCliente).toFixed(2) : '—')}
                                </span>
                              )}
                              {orden.estadoPresupuesto === 'rechazado' && (
                                <span className="text-red-600 font-bold text-sm">✗ Rechazado</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all"
                                onClick={() => navigate(`/ordenes-clientes/${orden.folio}`, { state: { orden } })}
                              >Ver detalles</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">No tienes órdenes registradas.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SolicitarOrdenCliente;
