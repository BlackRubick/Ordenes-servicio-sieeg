import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const initialData = {
  direccion: '',
  razonSocial: '',
  rfc: '',
  repse: '',
  numeroCotizacion: '',
  fecha: '',
  vigencia: '',
  telefono: '',
  direccionCliente: '',
  empresa: '',
  cliente: '',
  correo: '',
  descripcionGeneral: '',
  partidas: [
    { cantidad: '', descripcion: '', unidad: '', precioUnitario: '', importe: '' }
  ]
};

export default function Quotes() {
  const [form, setForm] = useState(initialData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePartidaChange = (idx, field, value) => {
    const partidas = form.partidas.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setForm({ ...form, partidas });
  };

  const addPartida = () => {
    setForm({ ...form, partidas: [...form.partidas, { cantidad: '', descripcion: '', unidad: '', precioUnitario: '', importe: '' }] });
  };

  const removePartida = (idx) => {
    setForm({ ...form, partidas: form.partidas.filter((_, i) => i !== idx) });
  };

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-extrabold text-primary-500 mb-4">Nueva Cotización</h2>
      <form className="space-y-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
          <h3 className="font-bold text-lg mb-2">Información general</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="direccion" value={form.direccion} onChange={handleChange} className="input" placeholder="Dirección" />
            <input name="razonSocial" value={form.razonSocial} onChange={handleChange} className="input" placeholder="Razón social" />
            <input name="rfc" value={form.rfc} onChange={handleChange} className="input" placeholder="RFC" />
            <input name="repse" value={form.repse} onChange={handleChange} className="input" placeholder="REPSE" />
            <input name="numeroCotizacion" value={form.numeroCotizacion} onChange={handleChange} className="input" placeholder="Número de cotización" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
          <h3 className="font-bold text-lg mb-2">Datos de la cotización</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="fecha" value={form.fecha} onChange={handleChange} className="input" placeholder="Fecha" type="date" />
            <input name="vigencia" value={form.vigencia} onChange={handleChange} className="input" placeholder="Vigencia (días)" />
            <input name="telefono" value={form.telefono} onChange={handleChange} className="input" placeholder="Teléfono" />
          </div>
          <input name="direccionCliente" value={form.direccionCliente} onChange={handleChange} className="input mt-4" placeholder="Dirección del cliente" />
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
          <h3 className="font-bold text-lg mb-2">Cliente / Empresa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="empresa" value={form.empresa} onChange={handleChange} className="input" placeholder="Empresa" />
            <input name="cliente" value={form.cliente} onChange={handleChange} className="input" placeholder="Cliente" />
            <input name="correo" value={form.correo} onChange={handleChange} className="input" placeholder="Correo electrónico" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
          <h3 className="font-bold text-lg mb-2">Descripción general</h3>
          <textarea name="descripcionGeneral" value={form.descripcionGeneral} onChange={handleChange} className="input min-h-[80px]" placeholder="Texto de introducción o descripción general..." />
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
          <h3 className="font-bold text-lg mb-2">Detalle del servicio</h3>
          <table className="min-w-full text-sm mb-2">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2 px-3">Partida</th>
                <th className="py-2 px-3">Cantidad</th>
                <th className="py-2 px-3">Descripción</th>
                <th className="py-2 px-3">Unidad</th>
                <th className="py-2 px-3">Precio Unitario</th>
                <th className="py-2 px-3">Importe</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.partidas.map((p, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3">{idx + 1}</td>
                  <td className="py-2 px-3"><input type="number" min="0" className="input w-20" value={p.cantidad} onChange={e => handlePartidaChange(idx, 'cantidad', e.target.value)} /></td>
                  <td className="py-2 px-3"><input className="input" value={p.descripcion} onChange={e => handlePartidaChange(idx, 'descripcion', e.target.value)} /></td>
                  <td className="py-2 px-3"><input className="input w-16" value={p.unidad} onChange={e => handlePartidaChange(idx, 'unidad', e.target.value)} /></td>
                  <td className="py-2 px-3"><input type="number" min="0" step="0.01" className="input w-24" value={p.precioUnitario} onChange={e => handlePartidaChange(idx, 'precioUnitario', e.target.value)} /></td>
                  <td className="py-2 px-3"><input type="number" min="0" step="0.01" className="input w-24" value={p.importe} onChange={e => handlePartidaChange(idx, 'importe', e.target.value)} /></td>
                  <td className="py-2 px-3">
                    {form.partidas.length > 1 && (
                      <button type="button" className="text-red-500 font-bold" onClick={() => removePartida(idx)}>-</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="px-4 py-1 rounded-xl bg-primary-100 text-primary-600 font-bold shadow-soft hover:bg-primary-200 transition-all" onClick={addPartida}>+ Agregar partida</button>
        </div>
        <div className="flex gap-4 mt-4">
          <button type="submit" className="flex-1 py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300">Guardar cotización</button>
        </div>
      </form>
    </DashboardLayout>
  );
}
