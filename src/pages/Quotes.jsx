import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { generateQuotePdfDoc } from '../utils/quotesPdf';

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

const SectionCard = ({ icon, title, subtitle, iconClass, children }) => (
  <div className="bg-white rounded-2xl shadow-card mb-4 overflow-hidden border border-gray-100">
    <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${iconClass}`}>
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-800">{title}</span>
      {subtitle && <span className="ml-auto text-xs text-gray-400">{subtitle}</span>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';

export default function Quotes() {
  const [form, setForm] = useState(initialData);
  const [emisorSelect, setEmisorSelect] = useState('');
  // Simular autoincremento simple (en real, vendría de backend)
  const [cotCounter, setCotCounter] = useState(1);

  const EMISORES = [
    {
      key: 'sieeg',
      label: 'SIEEG',
      direccion: 'Blvd. Belisario Dominguez #4213 L5',
      razonSocial: 'SIEEG INGENIERIA Y TELECOMUNICACIONES',
      rfc: 'SIT2409128S3',
      repse: 'AR9966/2022',
    },
    {
      key: 'sinar',
      label: 'Sinar Adrian',
      direccion: 'Blvd. Belisario Dominguez #4213 L5',
      razonSocial: 'Sinar Adrian Casanova García',
      rfc: 'CAGS890306QG4',
      repse: 'AR9966/2022',
    },
  ];

  // Generar número de cotización automático
  const generarNumeroCotizacion = (emisorKey) => {
    const prefix = emisorKey === 'sieeg' ? 'SIEEG' : emisorKey === 'sinar' ? 'SINAR' : 'COT';
    const num = String(cotCounter).padStart(4, '0');
    return `${prefix}-${new Date().getFullYear()}-${num}`;
  };

  const handleEmisorChange = (e) => {
    const val = e.target.value;
    setEmisorSelect(val);
    if (!val) {
      setForm(f => ({ ...f, direccion: '', razonSocial: '', rfc: '', repse: '', numeroCotizacion: '' }));
      return;
    }
    const emisor = EMISORES.find(e => e.key === val);
    setForm(f => ({
      ...f,
      direccion: emisor.direccion,
      razonSocial: emisor.razonSocial,
      rfc: emisor.rfc,
      repse: emisor.repse,
      numeroCotizacion: generarNumeroCotizacion(val),
    }));
    setCotCounter(c => c + 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      // Solo permitir números y máximo 15 caracteres
      const soloNumeros = value.replace(/[^0-9]/g, '').slice(0, 15);
      setForm({ ...form, [name]: soloNumeros });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handlePartidaChange = (idx, field, value) => {
    const partidas = form.partidas.map((p, i) => {
      if (i !== idx) return p;
      const updated = { ...p, [field]: value };
      if (field === 'cantidad' || field === 'precioUnitario') {
        const c = parseFloat(field === 'cantidad' ? value : updated.cantidad) || 0;
        const u = parseFloat(field === 'precioUnitario' ? value : updated.precioUnitario) || 0;
        updated.importe = (c * u).toFixed(2);
      }
      return updated;
    });
    setForm({ ...form, partidas });
  };

  const addPartida = () => {
    setForm({
      ...form,
      partidas: [...form.partidas, { cantidad: '', descripcion: '', unidad: '', precioUnitario: '', importe: '' }]
    });
  };

  const removePartida = (idx) => {
    setForm({ ...form, partidas: form.partidas.filter((_, i) => i !== idx) });
  };

  const total = form.partidas.reduce((sum, p) => sum + (parseFloat(p.importe) || 0), 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-end justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-extrabold text-primary-500">Nueva cotización</h2>
          <p className="text-sm text-gray-400 mt-0.5">Completa los campos para generar el documento</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-600">
          Borrador
        </span>
      </div>

      <form
        className="max-w-3xl mx-auto space-y-0"
        onSubmit={async e => {
          e.preventDefault();
          const doc = await generateQuotePdfDoc(form);
          doc.save(`Cotizacion_${form.numeroCotizacion || 'nueva'}.pdf`);
        }}
      >

        {/* Información general */}
        <SectionCard
          title="Información general"
          subtitle="Datos del emisor"
          iconClass="bg-blue-50 text-blue-600"
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          }
        >
          {/* Radios de emisor */}
          <div className="mb-4 flex flex-wrap gap-6 items-center">
            <span className="text-sm font-semibold text-gray-700 mr-2">Emisor:</span>
            {EMISORES.map(e => (
              <label key={e.key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="emisor"
                  value={e.key}
                  checked={emisorSelect === e.key}
                  onChange={handleEmisorChange}
                  className="form-radio h-5 w-5 text-primary-500 border-gray-300 focus:ring-primary-400"
                  style={{ accentColor: '#2563eb' }}
                />
                <span className="text-base font-medium text-gray-700">{e.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="emisor"
                value=""
                checked={emisorSelect === ''}
                onChange={handleEmisorChange}
                className="form-radio h-5 w-5 text-primary-500 border-gray-300 focus:ring-primary-400"
                style={{ accentColor: '#2563eb' }}
              />
              <span className="text-base font-medium text-gray-500">Manual</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Dirección">
              <input name="direccion" value={form.direccion} onChange={handleChange} className={inputCls} placeholder="Calle, número, colonia..." />
            </Field>
            <Field label="Razón social">
              <input name="razonSocial" value={form.razonSocial} onChange={handleChange} className={inputCls} placeholder="Nombre o empresa legal" />
            </Field>
            <Field label="RFC">
              <input name="rfc" value={form.rfc} onChange={handleChange} className={inputCls} placeholder="XAXX010101000" />
            </Field>
            {emisorSelect !== 'sieeg' && (
              <Field label="REPSE">
                <input name="repse" value={form.repse} onChange={handleChange} className={inputCls} placeholder="Número de registro" />
              </Field>
            )}
            <Field label="Número de cotización">
              <input name="numeroCotizacion" value={form.numeroCotizacion} onChange={handleChange} className={inputCls} placeholder="COT-2024-001" />
            </Field>
          </div>
        </SectionCard>

        {/* Datos de la cotización */}
        <SectionCard
          title="Datos de la cotización"
          subtitle="Fechas y contacto"
          iconClass="bg-teal-50 text-teal-700"
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Fecha">
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Vigencia (días)">
              <input name="vigencia" type="number" value={form.vigencia} onChange={handleChange} className={inputCls} placeholder="30" min="1" />
            </Field>
            <Field label="Teléfono">
              <input
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                className={inputCls}
                placeholder="Ej: 9611234567"
                pattern="[0-9]{7,15}"
                maxLength={15}
                inputMode="numeric"
                autoComplete="tel"
              />
            </Field>
            <div className="md:col-span-3">
              <Field label="Dirección del cliente">
                <input name="direccionCliente" value={form.direccionCliente} onChange={handleChange} className={inputCls} placeholder="Calle, número, colonia, ciudad..." />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Cliente / Empresa */}
        <SectionCard
          title="Cliente / Empresa"
          subtitle="Destinatario"
          iconClass="bg-orange-50 text-orange-600"
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Empresa">
              <input name="empresa" value={form.empresa} onChange={handleChange} className={inputCls} placeholder="Nombre de la empresa" />
            </Field>
            <Field label="Contacto">
              <input name="cliente" value={form.cliente} onChange={handleChange} className={inputCls} placeholder="Nombre completo" />
            </Field>
            <Field label="Correo electrónico">
              <input name="correo" type="email" value={form.correo} onChange={handleChange} className={inputCls} placeholder="correo@empresa.com" />
            </Field>
          </div>
        </SectionCard>

        {/* Descripción general */}
        <SectionCard
          title="Descripción general"
          subtitle="Introducción del documento"
          iconClass="bg-amber-50 text-amber-700"
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          }
        >
          <Field label="Texto de introducción">
            <textarea
              name="descripcionGeneral"
              value={form.descripcionGeneral}
              onChange={handleChange}
              className={`${inputCls} min-h-[80px] resize-y`}
              placeholder="Describe el alcance general del servicio o proyecto..."
            />
          </Field>
        </SectionCard>

        {/* Detalle del servicio */}
        <SectionCard
          title="Detalle del servicio"
          subtitle="Partidas y montos"
          iconClass="bg-purple-50 text-purple-600"
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 7h14M5 3v10" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {['#', 'Descripción', 'Cantidad', 'Unidad', 'P. Unitario', 'Importe', ''].map((h, i) => (
                    <th key={i} className="py-2 px-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.partidas.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 px-2 text-xs text-gray-400 font-medium w-6">{idx + 1}</td>
                    <td className="py-2 px-1">
                      <input
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                        value={p.descripcion}
                        placeholder="Descripción..."
                        onChange={e => handlePartidaChange(idx, 'descripcion', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-1 w-20">
                      <input
                        type="number" min="0"
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                        value={p.cantidad}
                        placeholder="0"
                        onChange={e => handlePartidaChange(idx, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-1 w-16">
                      <input
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                        value={p.unidad}
                        placeholder="pza"
                        onChange={e => handlePartidaChange(idx, 'unidad', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-1 w-24">
                      <input
                        type="number" min="0" step="0.01"
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                        value={p.precioUnitario}
                        placeholder="0.00"
                        onChange={e => handlePartidaChange(idx, 'precioUnitario', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-1 w-24">
                      <input
                        type="number" min="0" step="0.01"
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                        value={p.importe}
                        placeholder="0.00"
                        onChange={e => handlePartidaChange(idx, 'importe', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-1 w-8 text-center">
                      {form.partidas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePartida(idx)}
                          className="w-6 h-6 rounded-full border border-red-200 text-red-400 hover:bg-red-50 flex items-center justify-center transition-all text-base leading-none"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer tabla */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={addPartida}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Agregar
            </button>
            <div className="flex items-baseline gap-2 text-sm text-gray-400">
              <span>Total</span>
              <span className="text-lg font-semibold text-gray-900">
                ${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Acciones */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-[2] py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            Guardar cotización
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}