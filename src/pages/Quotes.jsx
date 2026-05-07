import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  observaciones: `
ACEPTO LAS CONDICIONES DE ESTA COTIZACIÓN Y CONFIRMO QUE CON LA FIRMA SE CONVIERTE EN UNA ORDEN DE COMPRA O PEDIDO PARA QUE SE ELABORE LA FACTURA Y ENTREGA DE LA
MERCANCÍA. CONFIRMO QUE ESTE DOCUMENTO ES COPIA FIEL DEL ORIGINAL.  
OBSERVACIONES : 
FORMA DE PAGO: TRANSFERENCIA ELECTRÓNICA DE FONDOS(03)
USO DE MCÍA :G03 - GASTOS EN GENERAL
MÉTODO DE PAGO: PAGO EN UNA SOLA EXHIBICIÓN
UNA VEZ REALIZADO EL PAGO SE PROCEDE A LIBERAR O AGENDAR EL SERVICIO`,
  pruebaRendimiento: false,
  observacionesExtra: '',
  status: 'Borrador',
  partidas: []
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

const unitOptions = [
  'PZA',
  'SERVICIO',
  'Lote',
  'Juego',
  'Kit',
  'Paquete',
  'Caja',
  'Bolsa',
  'Rollo',
  'Metro',
  'Metro lineal',
  'Metro cuadrado',
  'Metro cúbico',
  'Centímetro',
  'Centímetro cuadrado',
  'Centímetro cúbico',
  'Milímetro',
  'Kilogramo',
  'Gramo',
  'Litro',
  'Mililitro',
  'Hora',
  'Minuto',
  'Día',
  'Semana',
  'Mes',
  'Año',
  'Par',
  'Docena',
  'Tonelada',
  'Tarro',
  'Tambor',
  'Bulto',
  'Envase',
  'Botella',
  'Saco',
  'Caja chica',
  'Caja grande',
  'Unidad',
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
  observaciones: partida.observaciones || '',
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
  observaciones: quote?.observaciones && String(quote.observaciones).trim() !== ''
    ? quote.observaciones
    : `OBSERVACIONES
FORMA DE PAGO: TRANSFERENCIA ELECTRONICA DE FONDOS(03)
USO DE MCÍA.:G03 -GASTOSEN GENERAL
MÉTODO DE PAGO:PAGO EN UNA SOLA EXHIBICIÓN
UNA VEZ REALIZADO EL PAGO SE PROCEDE A AGENDAR EL SERVICIO`,
  pruebaRendimiento: Boolean(quote?.pruebaRendimiento),
  observacionesExtra: quote?.observacionesExtra || '',
  status: quote?.status || 'Borrador',
  partidas: Array.isArray(quote?.partidas) && quote.partidas.length > 0
    ? quote.partidas.map((partida) => ({
        cantidad: partida?.cantidad !== undefined && partida?.cantidad !== null && String(partida?.cantidad) !== '' ? String(partida.cantidad) : '',
        descripcion: partida?.descripcion || '',
        unidad: partida?.unidad || '',
        precioUnitario: partida?.precioUnitario !== undefined && partida?.precioUnitario !== null && String(partida?.precioUnitario) !== '' ? String(partida.precioUnitario) : '',
        importe: partida?.importe !== undefined && partida?.importe !== null && String(partida?.importe) !== '' ? String(partida.importe) : '',
               observaciones: partida?.observaciones || '',
      }))
    : [{ cantidad: '', descripcion: '', unidad: '', precioUnitario: '', importe: '' }],
});

export default function Quotes() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const preloadedPartida = location.state?.preloadedPartida;
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(() => {
    if (preloadedPartida && !isEditMode) {
      const modalObservaciones = String(preloadedPartida.observaciones || '').trim();
      return {
        ...initialData,
        observaciones: modalObservaciones || initialData.observaciones,
        partidas: [{
          cantidad: preloadedPartida.cantidad !== undefined && preloadedPartida.cantidad !== null ? String(preloadedPartida.cantidad) : '',
          descripcion: preloadedPartida.descripcion || '',
          unidad: preloadedPartida.unidad || '',
          precioUnitario: preloadedPartida.precioUnitario !== undefined && preloadedPartida.precioUnitario !== null ? String(preloadedPartida.precioUnitario) : '',
          importe: preloadedPartida.importe !== undefined && preloadedPartida.importe !== null ? String(preloadedPartida.importe) : '',
          observaciones: preloadedPartida.observaciones || '',
        }],
      };
    }

    return initialData;
  });
  const [loadingQuote, setLoadingQuote] = useState(isEditMode);
  const [emisorSelect, setEmisorSelect] = useState('');
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [cotCounter, setCotCounter] = useState(1);
  const [currentPartida, setCurrentPartida] = useState({ 
    cantidad: '', 
    descripcion: '', 
    unidad: '', 
    precioUnitario: '', 
    importe: '', 
    observaciones: '',
    productSearch: '',
    showSuggestions: false,
    suggestionIndex: -1,
    obsShowSuggestions: false,
    obsSuggestionIndex: -1,
  });
  const [editingIndex, setEditingIndex] = useState(null);

  // Cargar productos al montar el componente
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (response.ok) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error cargando productos:', error);
      }
    };
    loadProducts();
  }, []);

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
      setForm(f => ({
        ...f,
        emisor: '',
        direccion: '',
        razonSocial: '',
        rfc: '',
        repse: '',
        numeroCotizacion: '',
      }));
      return;
    }
    const emisor = EMISORES.find(e => e.key === val);
    setForm(f => ({
      ...f,
      emisor: val,
      direccion: emisor.direccion,
      razonSocial: emisor.razonSocial,
      rfc: emisor.rfc,
      repse: emisor.repse || '',
      // No generar número aquí; el servidor lo hará automáticamente
    }));
    // No incrementar cotCounter; el servidor genera números únicos
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
        const rawC = field === 'cantidad' ? value : updated.cantidad;
        const rawU = field === 'precioUnitario' ? value : updated.precioUnitario;
        const c = parseFloat(rawC);
        const u = parseFloat(rawU);
        const qty = (!isNaN(c) && c > 0) ? c : 1; // si cantidad vacía o 0 usar 1
        const price = (!isNaN(u) ? u : 0);
        updated.importe = (qty * price).toFixed(2);
      }
      return updated;
    });
    setForm({ ...form, partidas });
  };

  // Funciones para manejar el formulario de entrada de partidas
  const handleCurrentPartidaChange = (field, value) => {
    const updated = { ...currentPartida, [field]: value };
    if (field === 'cantidad' || field === 'precioUnitario') {
      const c = parseFloat(field === 'cantidad' ? value : updated.cantidad) || 0;
      const u = parseFloat(field === 'precioUnitario' ? value : updated.precioUnitario) || 0;
      updated.importe = (c * u).toFixed(2);
    }
    setCurrentPartida(updated);
  };

  // Búsqueda de productos (autocomplete)
  const handleProductNameChange = (value) => {
    setCurrentPartida({
      ...currentPartida,
      productSearch: value,
      showSuggestions: true,
      suggestionIndex: 0,
      descripcion: value,
    });
  };

  // Seleccionar un producto del catálogo
  const handleProductSelect = (product) => {
    const u = parseFloat(product.precioBase) || 0;
    const qty = 1;
    setCurrentPartida({
      ...currentPartida,
      productSearch: product.nombre,
      descripcion: product.nombre,
      unidad: product.unidad,
      precioUnitario: String(product.precioBase),
      cantidad: '1',
      importe: (qty * u).toFixed(2),
      observaciones: product.descripcion || '',
      showSuggestions: false,
      suggestionIndex: -1,
    });
  };

  const observationCatalog = Array.from(new Set(
    products
      .map((product) => String(product.descripcion || '').trim())
      .filter(Boolean)
  ));

  const handleObservationChange = (value) => {
    setCurrentPartida({
      ...currentPartida,
      observaciones: value,
      obsShowSuggestions: true,
      obsSuggestionIndex: 0,
    });
  };

  const handleSelectObservationSuggestion = (text) => {
    setCurrentPartida({
      ...currentPartida,
      observaciones: text,
      obsShowSuggestions: false,
      obsSuggestionIndex: -1,
    });
  };

  const isCurrentPartidaValid = () => {
    return !isEmpty(currentPartida.descripcion) &&
           !isEmpty(currentPartida.cantidad) &&
           !isEmpty(currentPartida.unidad) &&
           !isEmpty(currentPartida.precioUnitario);
  };

  const addOrUpdatePartida = () => {
    if (!isCurrentPartidaValid()) {
      Swal.fire('Datos incompletos', 'Completa todos los campos para agregar una partida', 'warning');
      return;
    }

    const partida = {
      cantidad: currentPartida.cantidad,
      descripcion: currentPartida.descripcion,
      unidad: currentPartida.unidad,
      precioUnitario: currentPartida.precioUnitario,
      importe: currentPartida.importe,
      observaciones: currentPartida.observaciones,
    };

    if (editingIndex !== null) {
      // Actualizar partida existente
      const updated = form.partidas.map((p, i) => i === editingIndex ? partida : p);
      setForm({ ...form, partidas: updated });
      setEditingIndex(null);
    } else {
      // Agregar nueva partida
      setForm({
        ...form,
        partidas: [...form.partidas, partida]
      });
    }
    // Resetear formulario
    setCurrentPartida({ 
      cantidad: '', 
      descripcion: '', 
      unidad: '', 
      precioUnitario: '', 
      importe: '', 
      observaciones: '',
      productSearch: '',
      showSuggestions: false,
      suggestionIndex: -1,
      obsShowSuggestions: false,
      obsSuggestionIndex: -1,
    });
  };

  const editPartida = (idx) => {
    const p = form.partidas[idx];
    setCurrentPartida({
      cantidad: p.cantidad,
      descripcion: p.descripcion,
      unidad: p.unidad,
      precioUnitario: p.precioUnitario,
      importe: p.importe,
      observaciones: p.observaciones,
      productSearch: p.descripcion,
      showSuggestions: false,
      suggestionIndex: -1,
      obsShowSuggestions: false,
      obsSuggestionIndex: -1,
    });
    setEditingIndex(idx);
    // Scroll al formulario
    setTimeout(() => {
      document.querySelector('[data-partida-form]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setCurrentPartida({ 
      cantidad: '', 
      descripcion: '', 
      unidad: '', 
      precioUnitario: '', 
      importe: '', 
      observaciones: '',
      productSearch: '',
      showSuggestions: false,
      suggestionIndex: -1,
      obsShowSuggestions: false,
      obsSuggestionIndex: -1,
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
          setEmisorSelect(data?.emisor || '');
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

          const partidasIncompletas = form.partidas.length === 0 || form.partidas.some((partida) => (
            isEmpty(partida.descripcion)
            || isEmpty(partida.cantidad)
            || isEmpty(partida.unidad)
            || isEmpty(partida.precioUnitario)
          ));

          const camposBaseObligatorios = [
            form.direccion,
            form.razonSocial,
            form.rfc,
            // numeroCotizacion será generado automáticamente por el servidor en creación
            ...(isEditMode ? [form.numeroCotizacion] : []),
            form.fecha,
            form.vigencia,
            form.telefono,
            form.direccionCliente,
            form.empresa,
            form.cliente,
            form.correo,
            form.status,
          ].some(isEmpty);
          // observaciones es opcional

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
            const payload = {
              ...form,
              partidas,
              total,
              pruebaRendimiento: Boolean(form.pruebaRendimiento),
              status: isEditMode ? (form.status || 'Borrador') : 'Borrador',
            };
            console.log('DEBUG: Partidas a enviar al servidor:', JSON.stringify(partidas, null, 2));
            const response = await fetch(isEditMode ? `/api/quotes/${id}` : '/api/quotes', {
              method: isEditMode ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const data = await response.json();
            console.log('DEBUG: save response', data);
            if (!response.ok) {
              throw new Error(data?.error || 'No se pudo guardar la cotización');
            }

            const savedQuote = data?.quote || data;
            console.log('DEBUG: savedQuote before PDF', savedQuote);
            console.log('DEBUG: savedQuote.partidas[0]:', savedQuote.partidas?.[0]);
            const pdfQuote = {
              ...payload,
              ...savedQuote,
              partidas: Array.isArray(savedQuote.partidas) ? savedQuote.partidas : partidas,
              pruebaRendimiento: Boolean(payload.pruebaRendimiento),
            };
            const doc = await generateQuotePdfDoc(pdfQuote);
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
              <input
                name="numeroCotizacion"
                value={form.numeroCotizacion}
                onChange={handleChange}
                readOnly={!isEditMode}
                className={`${inputCls} ${!isEditMode ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : requiredInputClass(form.numeroCotizacion)}`}
                placeholder={isEditMode ? 'COT-2024-001' : 'Se generará automáticamente al guardar'}
                required={isEditMode}
              />
              {!isEditMode && <p className="text-xs text-gray-400 mt-1">El número se generará automáticamente cuando guardes la cotización</p>}
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
          {/* Se eliminó el campo 'Texto de introducción'. Solo se usa 'Observaciones' editable para el PDF. */}
          <div className="mt-4 pt-4">
            <Field label="Observaciones">
              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                className={`${inputCls} min-h-[60px] resize-y`}
                placeholder="Ej: Incluir garantía, condiciones especiales, etc."
              />
            </Field>
          </div>
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
          {/* Formulario de entrada de partida */}
          <div data-partida-form className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-transparent rounded-xl border border-purple-100">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                {editingIndex !== null ? 'Editar partida' : 'Producto / Servicio'}
              </h3>
            </div>

            <div className="space-y-3">
              {/* Búsqueda de Producto con Autocompletación */}
              <div className="relative">
                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                  value={currentPartida.productSearch || ''}
                  placeholder="Escribe para buscar o crear producto..."
                  onChange={e => handleProductNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    const q = (currentPartida.productSearch || '').trim();
                    const matches = products.filter(prod => prod.nombre && prod.nombre.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
                    
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const current = currentPartida.suggestionIndex ?? -1;
                      const next = Math.min(current + 1, Math.max(matches.length - 1, 0));
                      setCurrentPartida(prev => ({ ...prev, suggestionIndex: next, showSuggestions: true }));
                      setTimeout(() => {
                        const el = document.getElementById(`prod-sugg-${next}`);
                        if (el) el.scrollIntoView({ block: 'nearest' });
                      }, 0);
                      return;
                    }
                    
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const current = currentPartida.suggestionIndex ?? 0;
                      const prevIndex = Math.max(current - 1, 0);
                      setCurrentPartida(prev => ({ ...prev, suggestionIndex: prevIndex, showSuggestions: true }));
                      setTimeout(() => {
                        const el = document.getElementById(`prod-sugg-${prevIndex}`);
                        if (el) el.scrollIntoView({ block: 'nearest' });
                      }, 0);
                      return;
                    }
                    
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const si = currentPartida.suggestionIndex ?? -1;
                      if (si >= 0 && matches[si]) {
                        handleProductSelect(matches[si]);
                      } else if (matches.length) {
                        handleProductSelect(matches[0]);
                      }
                      return;
                    }
                    
                    if (e.key === 'Escape') {
                      setCurrentPartida(prev => ({ ...prev, showSuggestions: false, suggestionIndex: -1 }));
                    }
                  }}
                  onFocus={() => {
                    setCurrentPartida(prev => ({ ...prev, showSuggestions: true }));
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setCurrentPartida(prev => ({ ...prev, showSuggestions: false }));
                    }, 120);
                  }}
                />
                
                {/* Sugerencias de productos */}
                {(currentPartida.productSearch || '').length > 0 && currentPartida.showSuggestions !== false && products.filter(prod => prod.nombre && prod.nombre.toLowerCase().includes((currentPartida.productSearch || '').toLowerCase())).slice(0, 6).length > 0 && (
                  <ul className="absolute z-40 left-0 right-0 bg-white border border-gray-100 rounded-md mt-1 max-h-48 overflow-auto text-sm shadow-lg">
                    {products.filter(prod => prod.nombre && prod.nombre.toLowerCase().includes((currentPartida.productSearch || '').toLowerCase())).slice(0, 6).map((prod, sidx) => (
                      <li
                        id={`prod-sugg-${sidx}`}
                        key={`prod-sugg-${prod.id}`}
                        className={`px-3 py-2 cursor-pointer ${currentPartida.suggestionIndex === sidx ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        onMouseEnter={() => {
                          setCurrentPartida(prev => ({ ...prev, suggestionIndex: sidx }));
                          setTimeout(() => {
                            const el = document.getElementById(`prod-sugg-${sidx}`);
                            if (el) el.scrollIntoView({ block: 'nearest' });
                          }, 0);
                        }}
                        onMouseDown={(ev) => { ev.preventDefault(); handleProductSelect(prod); }}
                      >
                        <div className="font-medium text-gray-800">{prod.nombre}</div>
                        {prod.descripcion && <div className="text-xs text-gray-500">{prod.descripcion}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Cantidad, Unidad, Precio en una fila */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cantidad *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                    value={currentPartida.cantidad}
                    placeholder="0"
                    onChange={e => handleCurrentPartidaChange('cantidad', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad *</label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                    value={currentPartida.unidad}
                    onChange={e => handleCurrentPartidaChange('unidad', e.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {unitOptions.map((unidad) => (
                      <option key={unidad} value={unidad}>
                        {unidad}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">P. Unitario *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all"
                    value={currentPartida.precioUnitario}
                    placeholder="0.00"
                    onChange={e => handleCurrentPartidaChange('precioUnitario', e.target.value)}
                  />
                </div>
              </div>

              {/* Observaciones con Autocompletación */}
              <div className="relative">
                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Observaciones (opcional)</label>
                <textarea
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:bg-white focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-100 transition-all resize-none"
                  value={currentPartida.observaciones}
                  placeholder="Escribe o busca una observación..."
                  onChange={e => handleObservationChange(e.target.value)}
                  onKeyDown={(e) => {
                    const q = String(currentPartida.observaciones || '').trim().toLowerCase();
                    const matches = observationCatalog.filter(text => text.toLowerCase().includes(q)).slice(0, 6);

                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const current = currentPartida.obsSuggestionIndex ?? -1;
                      const next = Math.min(current + 1, Math.max(matches.length - 1, 0));
                      setCurrentPartida(prev => ({ ...prev, obsSuggestionIndex: next, obsShowSuggestions: true }));
                      setTimeout(() => {
                        const el = document.getElementById(`obs-sugg-${next}`);
                        if (el) el.scrollIntoView({ block: 'nearest' });
                      }, 0);
                      return;
                    }

                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const current = currentPartida.obsSuggestionIndex ?? 0;
                      const prevIndex = Math.max(current - 1, 0);
                      setCurrentPartida(prev => ({ ...prev, obsSuggestionIndex: prevIndex, obsShowSuggestions: true }));
                      setTimeout(() => {
                        const el = document.getElementById(`obs-sugg-${prevIndex}`);
                        if (el) el.scrollIntoView({ block: 'nearest' });
                      }, 0);
                      return;
                    }

                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const si = currentPartida.obsSuggestionIndex ?? -1;
                      if (si >= 0 && matches[si]) {
                        handleSelectObservationSuggestion(matches[si]);
                      } else if (matches.length) {
                        handleSelectObservationSuggestion(matches[0]);
                      }
                      return;
                    }

                    if (e.key === 'Escape') {
                      setCurrentPartida(prev => ({ ...prev, obsShowSuggestions: false, obsSuggestionIndex: -1 }));
                    }
                  }}
                  onFocus={() => {
                    setCurrentPartida(prev => ({ ...prev, obsShowSuggestions: true }));
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setCurrentPartida(prev => ({ ...prev, obsShowSuggestions: false, obsSuggestionIndex: -1 }));
                    }, 120);
                  }}
                  rows="2"
                />

                {/* Sugerencias de observaciones */}
                {(String(currentPartida.observaciones || '').trim().length > 0 && currentPartida.obsShowSuggestions !== false && observationCatalog.filter(text => text.toLowerCase().includes(String(currentPartida.observaciones || '').trim().toLowerCase())).slice(0, 6).length > 0) && (
                  <ul className="absolute z-40 left-0 right-0 bg-white border border-gray-100 rounded-md mt-1 max-h-40 overflow-auto text-sm shadow-lg">
                    {observationCatalog.filter(text => text.toLowerCase().includes(String(currentPartida.observaciones || '').trim().toLowerCase())).slice(0, 6).map((text, sidx) => (
                      <li
                        id={`obs-sugg-${sidx}`}
                        key={`obs-sugg-${sidx}`}
                        className={`px-3 py-2 cursor-pointer ${currentPartida.obsSuggestionIndex === sidx ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        onMouseEnter={() => {
                          setCurrentPartida(prev => ({ ...prev, obsSuggestionIndex: sidx }));
                          setTimeout(() => {
                            const el = document.getElementById(`obs-sugg-${sidx}`);
                            if (el) el.scrollIntoView({ block: 'nearest' });
                          }, 0);
                        }}
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          handleSelectObservationSuggestion(text);
                        }}
                      >
                        <div className="font-medium text-gray-800 whitespace-pre-wrap">{text}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={addOrUpdatePartida}
                  className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-tr from-primary-500 to-secondary-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                >
                  {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                </button>
                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de partidas agregadas */}
          {form.partidas.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide">Descripción</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Cant.</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Unidad</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 text-xs uppercase tracking-wide">P. Unit.</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 text-xs uppercase tracking-wide">Importe</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {form.partidas.map((p, idx) => (
                    <tr key={`partida-${idx}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium">{p.descripcion}</div>
                        {p.observaciones && <div className="text-xs text-gray-500 mt-1">{p.observaciones}</div>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">{p.cantidad}</td>
                      <td className="px-4 py-3 text-center text-gray-900">{p.unidad}</td>
                      <td className="px-4 py-3 text-right text-gray-900">${parseFloat(p.precioUnitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">${parseFloat(p.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => editPartida(idx)}
                            title="Editar"
                            className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M11.33 2L14 4.67M2 14H5L13.5 5.5L10.5 2.5L2 11V14Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removePartida(idx)}
                            title="Eliminar"
                            className="w-7 h-7 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M2 4h12M6.5 7v4M9.5 7v4M3 4l1 10.5a2 2 0 002 1.5h4a2 2 0 002-1.5L13 4M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total y footer */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-100">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-600">Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                ${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(form.pruebaRendimiento)}
                onChange={(e) => setForm({ ...form, pruebaRendimiento: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
              />
              <span className="text-sm font-semibold text-gray-700">Observaciones extra</span>
            </label>

            {Boolean(form.pruebaRendimiento) && (
              <Field label="Observaciones extra">
                <textarea
                  value={form.observacionesExtra}
                  onChange={(e) => setForm({ ...form, observacionesExtra: e.target.value })}
                  className={`${inputCls} min-h-[90px] resize-y`}
                  placeholder="Escribe aquí lo que debe aparecer en el PDF..."
                />
              </Field>
            )}
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