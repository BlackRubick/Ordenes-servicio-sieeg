import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function SolicitarOrdenCliente() {
  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clienteData, setClienteData] = useState(null);

  // Estados para login
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  // Estados para el formulario de orden
  const [tipoEquipo, setTipoEquipo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const savedCliente = localStorage.getItem('clienteData');
    if (savedCliente) {
      const cliente = JSON.parse(savedCliente);
      setClienteData(cliente);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!usuario || !contrasena) {
      Swal.fire({
        icon: 'error',
        title: 'Campos obligatorios',
        text: 'Por favor ingresa usuario y contraseña.',
      });
      return;
    }

    try {
      const res = await fetch('http://74.208.164.167:3001/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena })
      });

      const data = await res.json();

      if (data.success) {
        // Guardar datos del cliente
        setClienteData(data.client);
        setIsAuthenticated(true);
        localStorage.setItem('clienteData', JSON.stringify(data.client));
        
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: `Hola ${data.client.nombre}`,
          timer: 1500,
          showConfirmButton: false
        });

        // Limpiar campos de login
        setUsuario('');
        setContrasena('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: data.message || 'Usuario o contraseña incorrectos',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo conectar con el servidor. Intenta de nuevo.',
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClienteData(null);
    localStorage.removeItem('clienteData');
    setTipoEquipo('');
    setDireccion('');
    setDescripcion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tipoEquipo || !direccion || !descripcion) {
      Swal.fire({
        icon: 'error',
        title: 'Campos obligatorios',
        text: 'Por favor completa todos los campos.',
      });
      return;
    }

    try {
      const payload = {
        folio: 'OC' + new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 14),
        fecha: new Date().toISOString().slice(0, 10),
        clientName: clienteData.nombre,
        telefono: clienteData.telefono,
        correo: clienteData.correo,
        tipo: 'cliente',
        marca: '',
        modelo: '',
        serie: '',
        accesorios: '',
        otrosAccesorios: '',
        seguridad: '',
        patron: '',
        description: descripcion,
        observaciones: JSON.stringify({
          tipoEquipo: tipoEquipo,
          direccion: direccion
        }),
        firma: '',
        status: 'Pendiente',
        technicianId: null,
        clienteId: clienteData.id,
      };

      const res = await fetch('http://74.208.164.167:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al guardar');

      Swal.fire({
        icon: 'success',
        title: 'Solicitud enviada',
        text: 'Tu orden de servicio ha sido registrada. Pronto nos pondremos en contacto.',
        timer: 2000,
        showConfirmButton: false
      });

      setTipoEquipo('');
      setDireccion('');
      setDescripcion('');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar la solicitud. Intenta de nuevo.',
      });
    }
  };

  // Vista de Login
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
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                autoComplete="username"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Contraseña</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
                placeholder="Ingresa tu contraseña"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-3 rounded-xl bg-[#1a3a5e] text-white font-bold shadow-lg hover:bg-[#2d5075] transition-all mt-2"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            Si no tienes usuario, contacta al administrador
          </p>
        </div>
      </div>
    );
  }

  // Vista de Formulario (Usuario autenticado)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f6fbff] to-[#eaf3fa] px-2 py-8">
      <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow-lg p-8 animate-fade-in mt-8">
        <div className="flex flex-col items-center mb-4">
          <img src="/images/logo.ico" alt="Logo empresa" className="w-36 h-36 mb-4 object-contain" style={{aspectRatio: '1/1'}} />
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1a3a5e]">Solicitar Orden de Servicio</h2>
            <p className="text-gray-600 text-sm">Bienvenido, <span className="font-semibold">{clienteData?.nombre}</span></p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800 font-semibold underline"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700"><strong>Correo:</strong> {clienteData?.correo}</p>
          <p className="text-sm text-gray-700"><strong>Teléfono:</strong> {clienteData?.telefono}</p>
        </div>

        <p className="mb-4 text-gray-700">Completa el formulario para generar tu solicitud.</p>
        
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            className="px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
            placeholder="Tipo de Equipo/Servicio (Ej: Laptop, Impresora, Red, etc.)"
            value={tipoEquipo}
            onChange={e => setTipoEquipo(e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
            placeholder="Dirección"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
          />
          <textarea
            className="px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm min-h-[100px] focus:ring-2 focus:ring-[#1a3a5e] focus:border-transparent"
            placeholder="Descripción del Problema o Servicio Requerido"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-[#1a3a5e] text-white font-bold shadow-lg hover:bg-[#2d5075] transition-all mt-2"
          >
            Enviar Solicitud
          </button>
        </form>
      </div>
    </div>
  );
}

export default SolicitarOrdenCliente;
