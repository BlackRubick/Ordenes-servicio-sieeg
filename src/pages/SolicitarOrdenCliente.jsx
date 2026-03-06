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
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [clienteOrdenes, setClienteOrdenes] = useState([]);

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
      const res = await fetch('/api/clients/login', {
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
        
        // Cargar órdenes del cliente
        try {
          const ordenesRes = await fetch(`/api/orders?clienteId=${data.client.id}`);
          const ordenesData = await ordenesRes.json();
          setClienteOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
        } catch (err) {
          console.error('Error cargando órdenes:', err);
        }
        
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
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + selectedImages.length > 2) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite de imágenes',
        text: 'Puedes subir máximo 2 imágenes',
      });
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    
    // Generar previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
      let imagenesUrls = [];
      
      // Subir imágenes primero si hay alguna
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach(image => {
          formData.append('images', image);
        });

        const uploadRes = await fetch('/api/orders/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Error al subir imágenes');
        }

        const uploadData = await uploadRes.json();
        imagenesUrls = uploadData.imagenes;
      }

      // Crear la orden
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
        imagenes: imagenesUrls,
      };

      const res = await fetch('/api/orders', {
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

      // Recargar órdenes del cliente
      try {
        const ordenesRes = await fetch(`/api/orders?clienteId=${clienteData.id}`);
        const ordenesData = await ordenesRes.json();
        setClienteOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
      } catch (err) {
        console.error('Error recargando órdenes:', err);
      }

      setTipoEquipo('');
      setDireccion('');
      setDescripcion('');
      setSelectedImages([]);
      setImagePreviews([]);
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

          {/* Upload de imágenes */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Evidencia Fotografica máximo 2 Archivos
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1a3a5e] file:text-white hover:file:bg-[#2d5075] transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos: JPG, PNG, GIF, WEBP. Máximo 5MB por imagen.
            </p>
          </div>

          {/* Preview de imágenes */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-[#1a3a5e] text-white font-bold shadow-lg hover:bg-[#2d5075] transition-all mt-2"
          >
            Enviar Solicitud
          </button>
        </form>

        {/* Tabla de Órdenes del Cliente */}
        {clienteOrdenes.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold text-[#1a3a5e] mb-4">Mis Órdenes</h3>
            <div className="overflow-x-auto shadow-sm rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[#1a3a5e] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Folio</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Equipo</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Dirección</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {clienteOrdenes.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-[#1a3a5e]">{orden.folio || '-'}</td>
                      <td className="px-4 py-3">{orden.fecha ? new Date(orden.fecha).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">{orden.tipo || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          orden.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                          orden.status === 'Entregada' ? 'bg-green-100 text-green-700' :
                          orden.status === 'Cancelada' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {orden.status || 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{orden.clientName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SolicitarOrdenCliente;
