import React, { useState } from 'react';
import Swal from 'sweetalert2';
// import DashboardLayout from '../layouts/DashboardLayout';

function SolicitarOrdenCliente() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !correo || !telefono || !tipoEquipo || !direccion || !descripcion) {
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
        clientName: nombre,
        telefono: telefono,
        correo: correo,
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

      setNombre('');
      setCorreo('');
      setTelefono('');
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f6fbff] to-[#eaf3fa] px-2 py-8">
      <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow-lg p-8 animate-fade-in mt-8">
        <div className="flex flex-col items-center mb-4">
          <img src="/images/logo.ico" alt="Logo empresa" className="w-36 h-36 mb-4 object-contain" style={{aspectRatio: '1/1'}} />
        </div>
        <h2 className="text-2xl font-extrabold text-primary-500 mb-4 text-center">Solicitar Orden de Servicio</h2>
        <p className="mb-6 text-gray-700 text-center">Completa el formulario para generar tu solicitud.</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            className="px-4 py-3 rounded-xl border border-border bg-white shadow-card"
            placeholder="Nombre Completo"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-xl border border-border bg-white shadow-card"
            placeholder="Correo Electrónico"
            type="email"
            value={correo}
            onChange={e => setCorreo(e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-xl border border-border bg-white shadow-card"
            placeholder="Teléfono"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            maxLength={10}
          />
          <input
            className="px-4 py-3 rounded-xl border border-border bg-white shadow-card"
            placeholder="Tipo de Equipo/Servicio (Ej: Laptop, Impresora, Red, etc.)"
            value={tipoEquipo}
            onChange={e => setTipoEquipo(e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-xl border border-border bg-white shadow-card"
            placeholder="Dirección"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
          />
          <textarea
            className="px-4 py-3 rounded-xl border border-border bg-white shadow-card min-h-[100px]"
            placeholder="Descripción del Problema o Servicio Requerido"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold shadow-lg hover:bg-primary-600 transition-all mt-2"
          >
            Enviar Solicitud
          </button>
        </form>
      </div>
    </div>
  );
}

export default SolicitarOrdenCliente;
