import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { generateQuotePdfDoc } from '../utils/quotesPdf';
import Swal from 'sweetalert2';

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
  descripcionGeneral: `OBSERVACIONES : 
FORMA DE PAGO: TRANSFERENCIA ELECTRONICA DE FONDOS(03)
USO DE MCÍA.:G03 -GASTOS EN GENERAL
MÉTODO DE PAGO: PAGO EN UNA SOLA EXHIBICIÓN
UNA VEZ REALIZADO EL PAGO SE PROCEDE A AGENDAR EL SERVICIO`,
  status: 'Borrador',
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

const statusOptions = [
  'Borrador',
  'Pendiente',
  'Aprobado',
  'Cancelada',
];

const normalizePartidas = (partidas) => partidas.map((partida) => ({
  cantidad: partida.cantidad !== '' && partida.cantidad !== null && partida.cantidad !== undefined
    ? Number(partida.cantidad)
    : '',
  descripcion: partida.descripcion || '',
  unidad: partida.unidad || '',
  precioUnitario: partida.precioUnitario !== '' && partida.precioUnitario !== null && partida.precioUnitario !== undefined
    ? Number(partida.precioUnitario)
    : '',
  importe: partida.importe !== '' && partida.importe !== null && partida.importe !== undefined
    ? Number(partida.importe)
    : '',
}));

const formFromQuote = (quote) => ({
  direccion: quote?.direccion || '',
  razonSocial: quote?.razonSocial || '',
  rfc: quote?.rfc || '',
  repse: quote?.repse || '',
  numeroCotizacion: quote?.numeroCotizacion || '',
  fecha: quote?.fecha || '',
  vigencia: quote?.vigencia ?? '',
  telefono: quote?.telefono || '',
  direccionCliente: quote?.direccionCliente || '',
  empresa: quote?.empresa || '',
  cliente: quote?.cliente || '',
  correo: quote?.correo || '',
  descripcionGeneral: `OBSERVACIONES
FORMA DE PAGO: TRANSFERENCIA ELECTRONICA DE FONDOS(03)
USO DE MCÍA.:G03 -GASTOSEN GENERAL
MÉTODO DE PAGO:PAGO EN UNA SOLA EXHIBICIÓN
UNA VEZ REALIZADO EL PAGO SE PROCEDE A AGENDAR EL SERVICIO`,
  status: quote?.status || 'Borrador',
  partidas: Array.isArray(quote?.partidas) && quote.partidas.length > 0
    ? quote.partidas.map((partida) => ({
        cantidad: partida?.cantidad !== undefined && partida?.cantidad !== null && String(partida?.cantidad) !== '' ? String(partida.cantidad) : '',
        descripcion: partida?.descripcion || '',
        unidad: partida?.unidad || '',
        precioUnitario: partida?.precioUnitario !== undefined && partida?.precioUnitario !== null && String(partida?.precioUnitario) !== '' ? String(partida.precioUnitario) : '',
        importe: partida?.importe !== undefined && partida?.importe !== null && String(partida?.importe) !== '' ? String(partida.importe) : '',
      }))
    : [{ cantidad: '', descripcion: '', unidad: '', precioUnitario: '', importe: '' }],
});

export default function Quotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [form, setForm] = useState(initialData);
  const [loadingQuote, setLoadingQuote] = useState(isEditMode);
  const [emisorSelect, setEmisorSelect] = useState('');
  const [validationAttempted, setValidationAttempted] = useState(false);
  // Simular autoincremento simple (en real, vendría de backend)
  const [cotCounter, setCotCounter] = useState(1);

  const EMISORES = [
    {
      key: 'sieeg',
      label: 'SIEEG',
      direccion: 'Blvd. Belisario Dominguez #4213 L5',
      razonSocial: 'SIEEG INGENIERIA Y TELECOMUNICACIONES',
      rfc: 'SIT2409128S3',
      repse: '',
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

  const isEmpty = (value) => String(value ?? '').trim() === '';
  const requiredInputClass = (value, extraClass = '') => (
    `${inputCls} ${validationAttempted && isEmpty(value) ? 'border-red-400 ring-2 ring-red-100 focus:border-red-400' : ''} ${extraClass}`
  );

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
      repse: emisor.repse || '',
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

  useEffect(() => {
    if (!isEditMode) return;

    let active = true;

    const loadQuote = async () => {
      try {
        setLoadingQuote(true);
        const response = await fetch(`/api/quotes/${id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'No se pudo cargar la cotización');
        }

        if (active) {
          setForm(formFromQuote(data));
        }
      } catch (error) {
        if (active) {
          Swal.fire('Error', error.message || 'No se pudo cargar la cotización', 'error');
          navigate('/admin/quotes');
        }
      } finally {
        if (active) setLoadingQuote(false);
      }
    };

    loadQuote();

    return () => {
      active = false;
    };
  }, [id, isEditMode, navigate]);

  const handleDeleteQuote = async () => {
    const result = await Swal.fire({
      title: '¿Eliminar cotización?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    const response = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'No se pudo eliminar la cotización');
    }

    await Swal.fire('Eliminada', 'La cotización fue eliminada correctamente.', 'success');
    navigate('/admin/quotes');
  };

  if (loadingQuote && isEditMode) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-lg text-gray-500">Cargando cotización...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-end justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-extrabold text-primary-500">{isEditMode ? 'Editar cotización' : 'Nueva cotización'}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{isEditMode ? 'Actualiza los datos y guarda los cambios' : 'Completa los campos para generar el documento'}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-600">
          {isEditMode ? 'Edición' : 'Borrador'}
        </span>
      </div>

      <form
        className="max-w-3xl mx-auto space-y-0"
        onSubmit={async e => {
          e.preventDefault();
          setValidationAttempted(true);

          const partidasIncompletas = form.partidas.some((partida) => (
            isEmpty(partida.descripcion)
            || isEmpty(partida.cantidad)
            || isEmpty(partida.unidad)
            || isEmpty(partida.precioUnitario)
            || isEmpty(partida.importe)
          ));

          const camposBaseObligatorios = [
            form.direccion,
            form.razonSocial,
            form.rfc,
            form.numeroCotizacion,
            form.fecha,
            form.vigencia,
            form.telefono,
            form.direccionCliente,
            form.empresa,
            form.cliente,
            form.correo,
            form.descripcionGeneral,
            form.status,
          ].some(isEmpty);

          const requiereEmisor = !isEditMode && !emisorSelect;
          const requiereRepse = emisorSelect !== 'sieeg' && isEmpty(form.repse);

          if (requiereEmisor || camposBaseObligatorios || requiereRepse || partidasIncompletas) {
            await Swal.fire({
              title: 'Faltan datos obligatorios',
              text: 'Completa todos los campos marcados en rojo antes de guardar la cotización.',
              icon: 'warning',
            });
            return;
          }

          try {
            const partidas = normalizePartidas(form.partidas);
            const total = partidas.reduce((sum, partida) => sum + (Number(partida.importe) || 0), 0);
            const response = await fetch(isEditMode ? `/api/quotes/${id}` : '/api/quotes', {
              method: isEditMode ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...form,
                partidas,
                total,
                status: isEditMode ? (form.status || 'Borrador') : 'Borrador',
              }),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data?.error || 'No se pudo guardar la cotización');
            }

            const savedQuote = data?.quote || data;
            const doc = await generateQuotePdfDoc({ ...savedQuote, partidas: Array.isArray(savedQuote.partidas) ? savedQuote.partidas : partidas });
            doc.save(`Cotizacion_${savedQuote.numeroCotizacion || form.numeroCotizacion || 'nueva'}.pdf`);
            Swal.fire(isEditMode ? 'Cotización actualizada' : 'Cotización guardada', isEditMode ? 'Los cambios se guardaron en la base de datos y el PDF fue generado.' : 'La cotización se guardó en la base de datos y el PDF fue generado.', 'success');
            navigate(isEditMode ? `/admin/quotes/${savedQuote.id}` : '/admin/quotes');
          } catch (error) {
            Swal.fire('Error', error.message || 'No se pudo guardar la cotización', 'error');
          }
        }}
      >

        {validationAttempted && (
          <div className="max-w-3xl mx-auto mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium shadow-sm">
            Hay campos obligatorios vacíos. Revisa los resaltados en rojo.
          </div>
        )}

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
                  required
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
                required
                className="form-radio h-5 w-5 text-primary-500 border-gray-300 focus:ring-primary-400"
                style={{ accentColor: '#2563eb' }}
              />
              <span className="text-base font-medium text-gray-500">Manual</span>
            </label>
            {validationAttempted && !isEditMode && !emisorSelect && (
              <p className="w-full text-xs font-medium text-red-500">Selecciona un emisor antes de guardar.</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Dirección">
              <input name="direccion" value={form.direccion} onChange={handleChange} className={requiredInputClass(form.direccion)} placeholder="Calle, número, colonia..." required />
            </Field>
            <Field label="Razón social">
              <input name="razonSocial" value={form.razonSocial} onChange={handleChange} className={requiredInputClass(form.razonSocial)} placeholder="Nombre o empresa legal" required />
            </Field>
            <Field label="RFC">
              <input name="rfc" value={form.rfc} onChange={handleChange} className={requiredInputClass(form.rfc)} placeholder="XAXX010101000" required />
            </Field>
            {emisorSelect !== 'sieeg' && (
              <Field label="REPSE">
                <input name="repse" value={form.repse} onChange={handleChange} className={requiredInputClass(form.repse)} placeholder="Número de registro" required />
              </Field>
            )}
            <Field label="Número de cotización">
              <input name="numeroCotizacion" value={form.numeroCotizacion} onChange={handleChange} className={requiredInputClass(form.numeroCotizacion)} placeholder="COT-2024-001" required />
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
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className={requiredInputClass(form.fecha)} required />
            </Field>
            <Field label="Vigencia (días)">
              <input name="vigencia" type="number" value={form.vigencia} onChange={handleChange} className={requiredInputClass(form.vigencia)} placeholder="30" min="1" required />
            </Field>
            <Field label="Teléfono">
              <input
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej: 9611234567"
                pattern="[0-9]{7,15}"
                maxLength={15}
                inputMode="numeric"
                autoComplete="tel"
                className={requiredInputClass(form.telefono)}
                required
              />
            </Field>
            <div className="md:col-span-3">
              <Field label="Dirección del cliente">
                <input name="direccionCliente" value={form.direccionCliente} onChange={handleChange} className={requiredInputClass(form.direccionCliente)} placeholder="Calle, número, colonia, ciudad..." required />
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
              <input name="empresa" value={form.empresa} onChange={handleChange} className={requiredInputClass(form.empresa)} placeholder="Nombre de la empresa" required />
            </Field>
            <Field label="Contacto">
              <input name="cliente" value={form.cliente} onChange={handleChange} className={requiredInputClass(form.cliente)} placeholder="Nombre completo" required />
            </Field>
            <Field label="Correo electrónico">
              <input name="correo" type="email" value={form.correo} onChange={handleChange} className={requiredInputClass(form.correo)} placeholder="correo@empresa.com" required />
            </Field>
            <Field label="Estado">
              <select name="status" value={form.status} onChange={handleChange} className={requiredInputClass(form.status)} required>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Observaciones general */}
        <SectionCard
          title="Observaciones generales"
          subtitle="Observaciones o notas para el cliente"
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
              className={`${requiredInputClass(form.descripcionGeneral)} min-h-[80px] resize-y`}
              placeholder="Observaciones automáticas"
              required
            />
            <p className="text-xs text-gray-400">datos agregados automaticamente pero puedes modificarlos si es necesario</p>
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
                        className={`w-full px-2 py-1.5 text-sm rounded-lg border bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all ${validationAttempted && isEmpty(p.descripcion) ? 'border-red-400 ring-2 ring-red-100 focus:border-red-400' : 'border-gray-100'}`}
                        value={p.descripcion}
                        placeholder="Descripción..."
                        onChange={e => handlePartidaChange(idx, 'descripcion', e.target.value)}
                        required
                      />
                    </td>
                    <td className="py-2 px-1 w-20">
                      <input
                        type="number" min="0"
                        className={`w-full px-2 py-1.5 text-sm rounded-lg border bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all ${validationAttempted && isEmpty(p.cantidad) ? 'border-red-400 ring-2 ring-red-100 focus:border-red-400' : 'border-gray-100'}`}
                        value={p.cantidad}
                        placeholder="0"
                        onChange={e => handlePartidaChange(idx, 'cantidad', e.target.value)}
                        required
                      />
                    </td>
                    <td className="py-2 px-1 w-16">
                      <input
                        className={`w-full px-2 py-1.5 text-sm rounded-lg border bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all ${validationAttempted && isEmpty(p.unidad) ? 'border-red-400 ring-2 ring-red-100 focus:border-red-400' : 'border-gray-100'}`}
                        value={p.unidad}
                        placeholder="pza"
                        onChange={e => handlePartidaChange(idx, 'unidad', e.target.value)}
                        required
                      />
                    </td>
                    <td className="py-2 px-1 w-24">
                      <input
                        type="number" min="0" step="0.01"
                        className={`w-full px-2 py-1.5 text-sm rounded-lg border bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all ${validationAttempted && isEmpty(p.precioUnitario) ? 'border-red-400 ring-2 ring-red-100 focus:border-red-400' : 'border-gray-100'}`}
                        value={p.precioUnitario}
                        placeholder="0.00"
                        onChange={e => handlePartidaChange(idx, 'precioUnitario', e.target.value)}
                        required
                      />
                    </td>
                    <td className="py-2 px-1 w-24">
                      <input
                        type="number" min="0" step="0.01"
                        className={`w-full px-2 py-1.5 text-sm rounded-lg border bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all ${validationAttempted && isEmpty(p.importe) ? 'border-red-400 ring-2 ring-red-100 focus:border-red-400' : 'border-gray-100'}`}
                        value={p.importe}
                        placeholder="0.00"
                        onChange={e => handlePartidaChange(idx, 'importe', e.target.value)}
                        required
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
            onClick={() => navigate(isEditMode ? `/admin/quotes/${id}` : '/admin/quotes')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-[2] py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {isEditMode ? 'Actualizar cotización' : 'Guardar cotización'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}