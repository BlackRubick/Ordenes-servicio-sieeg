import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { generateOrderPdfDoc } from '../utils/orderPdf';


const ESTADOS_TECNICO = [
  { key: 'pendiente', label: 'Pendiente', color: 'bg-gray-200 text-gray-700' },
  { key: 'revision', label: 'En revisión', color: 'bg-blue-100 text-blue-700' },
  { key: 'diagnostico', label: 'Diagnóstico generado', color: 'bg-blue-200 text-blue-800' },
  { key: 'espera_aprobacion', label: 'En espera de aprobación', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'reparacion', label: 'En reparación', color: 'bg-blue-300 text-blue-900' },
  { key: 'lista', label: 'Lista', color: 'bg-green-100 text-green-700' },
  { key: 'entregada', label: 'Entregada', color: 'bg-primary-100 text-primary-700' },
  { key: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-700' },
];

const ESTADOS_FINANCIERO = [
  { key: 'sin_cotizacion', label: 'Sin cotización', color: 'bg-gray-100 text-gray-700' },
  { key: 'cotizacion_generada', label: 'Cotización generada', color: 'bg-blue-100 text-blue-700' },
  { key: 'cotizacion_enviada', label: 'Cotización enviada', color: 'bg-blue-200 text-blue-800' },
  { key: 'cotizacion_aprobada', label: 'Cotización aprobada', color: 'bg-green-100 text-green-700' },
  { key: 'cotizacion_rechazada', label: 'Cotización rechazada', color: 'bg-red-100 text-red-700' },
];

export default function OrderDetail() {
  // Hooks
  const navigate = useNavigate();
  const { folio } = useParams();
  const { role } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [estadoTecnico, setEstadoTecnico] = useState('');
  const [trabajos, setTrabajos] = useState([]);
  const [agregandoTrabajo, setAgregandoTrabajo] = useState(false);
  const [trabajoDescripcion, setTrabajoDescripcion] = useState('');
  const [trabajoCosto, setTrabajoCosto] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editCosto, setEditCosto] = useState('');
  // Diagnóstico técnico editable
  const [diagnostico, setDiagnostico] = useState('');
  const [diagnosticoGuardado, setDiagnosticoGuardado] = useState('');
  const [editandoDiagnostico, setEditandoDiagnostico] = useState(false);

  // Handler functions
  const handleAgregarTrabajo = () => {
    setAgregandoTrabajo(true);
    setTrabajoDescripcion('');
    setTrabajoCosto('');
  };

  const handleEliminarTrabajo = (idx) => {
    Swal.fire({
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then(result => {
      if (result.isConfirmed) {
        const nuevosTrabajos = trabajos.filter((_, i) => i !== idx);
        fetch(`/api/orders/${order.folio}/trabajos`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trabajos: nuevosTrabajos })
        })
          .then(res => res.json())
          .then(data => {
            setTrabajos(data.trabajos);
            setOrder(prev => ({ ...prev, trabajos: data.trabajos }));
            setEditIndex(editIndex === idx ? null : editIndex);
            Swal.fire({
              icon: 'success',
              title: 'Trabajo eliminado',
              text: 'El trabajo realizado ha sido eliminado.',
              timer: 1200,
              showConfirmButton: false
            });
          })
          .catch(() => {
            Swal.fire('Error', 'No se pudo eliminar el trabajo en el servidor', 'error');
          });
      }
    });
  };

  const handleEditarTrabajo = (idx) => {
    setEditIndex(idx);
    setEditDescripcion(trabajos[idx].descripcion);
    setEditCosto(trabajos[idx].costo.toString());
  };

  const handleGuardarEdicionTrabajo = () => {
    if (!editDescripcion.trim() || !editCosto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Completa todos los campos',
        text: 'Por favor ingresa la descripción y el costo.',
      });
      return;
    }
    const nuevosTrabajos = trabajos.map((t, idx) =>
      idx === editIndex ? { descripcion: editDescripcion, costo: parseFloat(editCosto) } : t
    );
    fetch(`/api/orders/${order.folio}/trabajos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trabajos: nuevosTrabajos })
    })
      .then(res => res.json())
      .then(data => {
        setTrabajos(data.trabajos);
        setOrder(prev => ({ ...prev, trabajos: data.trabajos }));
        setEditIndex(null);
        Swal.fire({
          icon: 'success',
          title: 'Trabajo editado',
          text: 'El trabajo realizado se ha actualizado correctamente.',
          timer: 1200,
          showConfirmButton: false
        });
      })
      .catch(() => {
        Swal.fire('Error', 'No se pudo guardar el trabajo en el servidor', 'error');
      });
  };

  const handleGuardarTrabajo = () => {
    if (!trabajoDescripcion.trim() || !trabajoCosto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Completa todos los campos',
        text: 'Por favor ingresa la descripción y el costo.',
      });
      return;
    }
    const nuevosTrabajos = [...trabajos, { descripcion: trabajoDescripcion, costo: parseFloat(trabajoCosto) }];
    fetch(`/api/orders/${order.folio}/trabajos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trabajos: nuevosTrabajos })
    })
      .then(res => res.json())
      .then(data => {
        setTrabajos(data.trabajos);
        setOrder(prev => ({ ...prev, trabajos: data.trabajos }));
        setAgregandoTrabajo(false);
        Swal.fire({
          icon: 'success',
          title: 'Trabajo agregado',
          text: 'El trabajo realizado se ha guardado correctamente.',
          timer: 1200,
          showConfirmButton: false
        });
      })
      .catch(() => {
        Swal.fire('Error', 'No se pudo guardar el trabajo en el servidor', 'error');
      });
  };

  const handleGuardarDiagnostico = async () => {
    try {
      await fetch(`/api/orders/${order.folio}/diagnostico`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnostico })
      });
      setDiagnosticoGuardado(diagnostico);
      setOrder(prev => ({ ...prev, diagnostico }));
      setEditandoDiagnostico(false);
      Swal.fire({
        icon: 'success',
        title: 'Diagnóstico guardado',
        text: 'El diagnóstico se ha guardado correctamente.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Error', 'No se pudo guardar el diagnóstico en el servidor', 'error');
    }
  };

  const handleEditarDiagnostico = () => {
    setEditandoDiagnostico(true);
  };

  const calcularTotal = () => {
    if (order && order.resumen && typeof order.resumen.total === 'number') {
      return order.resumen.total;
    }
    return trabajos.reduce((acc, t) => acc + (typeof t.costo === 'number' ? t.costo : 0), 0);
  };

  const handleGenerarPDF = () => {
    if (!order) return;
    (async () => {
      try {
        const pdfOrder = {
          ...order,
          status: order.status || estadoTecnico,
          diagnostico: diagnosticoGuardado || diagnostico || order.diagnostico,
          resumen: {
            ...(order.resumen || {}),
            total: calcularTotal(),
          },
          trabajos,
        };
        const doc = await generateOrderPdfDoc(pdfOrder);
        doc.save(`Orden_${order.folio || 'servicio'}.pdf`);
      } catch (error) {
        Swal.fire('Error', 'No se pudo generar el PDF', 'error');
      }
    })();
  };

  const handleImprimirTicket = () => {
    if (!order) return;

    const total = calcularTotal();
    const trabajosHtml = trabajos.length
      ? trabajos
          .map((t) => `<div class="line"><span>${t.descripcion || 'Trabajo'}</span><span>$${Number(t.costo || 0).toFixed(2)}</span></div>`)
          .join('')
      : '<div class="line"><span>Sin trabajos</span><span>$0.00</span></div>';

    const ticketHtml = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket ${order.folio || ''}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: Arial, sans-serif; width: 72mm; margin: 0 auto; color: #000; }
          .center { text-align: center; }
          .title { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
          .small { font-size: 11px; }
          .sep { border-top: 1px dashed #000; margin: 6px 0; }
          .line { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin: 2px 0; }
          .line span:first-child { flex: 1; }
          .total { font-weight: 700; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="center title">SIEEG - Ticket de Servicio</div>
        <div class="small">Folio: ${order.folio || '-'}</div>
        <div class="small">Fecha: ${order.fecha || '-'}</div>
        <div class="small">Cliente: ${order.clientName || '-'}</div>
        <div class="small">Equipo: ${[order.tipo, order.marca, order.modelo].filter(Boolean).join(' ') || '-'}</div>
        <div class="small">Estado: ${order.status || '-'}</div>
        <div class="sep"></div>
        <div class="small"><strong>Trabajos</strong></div>
        ${trabajosHtml}
        <div class="sep"></div>
        <div class="line total"><span>TOTAL</span><span>$${Number(total).toFixed(2)}</span></div>
        <div class="sep"></div>
        <div class="center small">Gracias por su preferencia</div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=420,height=800');
    if (!printWindow) {
      Swal.fire('Bloqueado', 'El navegador bloqueó la ventana de impresión. Permite popups para este sitio.', 'warning');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(ticketHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleEliminarImagen = async (imageUrl) => {
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
      const response = await fetch(`/api/orders/${order.folio}/images`, {
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

      setOrder(prev => ({
        ...prev,
        imagenes: Array.isArray(data?.imagenes) ? data.imagenes : [],
      }));

      Swal.fire('Eliminada', 'La foto se eliminó correctamente.', 'success');
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo eliminar la foto', 'error');
    }
  };

  React.useEffect(() => {
    fetch(`/api/orders?folio=${folio}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const orderData = { ...data[0] };
          let imagenesData = orderData.imagenes;
          if (typeof imagenesData === 'string') {
            try {
              imagenesData = JSON.parse(imagenesData);
            } catch (e) {
              imagenesData = [];
            }
          }
          orderData.imagenes = Array.isArray(imagenesData) ? imagenesData : [];

          setOrder(orderData);
          setEstadoTecnico(orderData.status || '');
          let trabajosData = orderData.trabajos;
          if (typeof trabajosData === 'string') {
            try {
              trabajosData = JSON.parse(trabajosData);
            } catch (e) {
              trabajosData = [];
            }
          }
          setTrabajos(Array.isArray(trabajosData) ? trabajosData : []);
          setDiagnostico(orderData.diagnostico || '');
          setDiagnosticoGuardado(orderData.diagnostico || '');
          setEditandoDiagnostico(false);
          // Calcular total de trabajos
          const totalTrabajos = Array.isArray(trabajosData) ? trabajosData.reduce((acc, t) => acc + (typeof t.costo === 'number' ? t.costo : 0), 0) : 0;
          setOrder(prev => ({ ...prev, resumen: { ...prev?.resumen, total: totalTrabajos } }));
        }
      })
      .catch(() => setOrder(null));
  }, [folio]);

  if (!order) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center text-2xl text-primary-500 font-bold">Cargando...</div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] to-[#eaf3fa] p-0 md:p-8 animate-fade-in">
        {/* Show recipient name if delivered */}
        {estadoTecnico === 'entregada' && order.entrega.recibe && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mb-8 animate-fade-in flex items-center gap-6">
            <div className="flex items-center gap-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" /></svg>
              <span className="font-bold text-blue-700 text-lg">Recibió:</span>
              <span className="text-blue-700 text-lg">{order.entrega.recibe}</span>
            </div>
            {order.entrega.firma && (
              <div className="flex flex-col items-center">
                <span className="font-bold text-blue-700 text-lg mb-2">Firma:</span>
                <img src={order.entrega.firma} alt="Firma de quien recibió" className="border rounded-xl bg-white shadow p-2 max-w-xs" style={{height: '80px'}} />
              </div>
            )}
          </div>
        )}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-lg rounded-b-2xl px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-blue-100 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Folio</div>
              <div className="text-3xl font-extrabold text-[#1976F3] tracking-widest font-mono">{order ? order.folio : ''}</div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Badge Estado Técnico */}
              <span className={`px-4 py-1 rounded-full font-bold text-sm shadow-sm border border-current transition-all ${order ? (ESTADOS_TECNICO.find(e => e.key === order.status)?.color || '') : ''}`}> 
                {order ? (ESTADOS_TECNICO.find(e => e.key === order.status)?.label) : ''}
              </span>
              {/* Badge Estado Financiero */}
              <span className={`px-4 py-1 rounded-full font-bold text-sm shadow-sm border border-current transition-all ${order ? (ESTADOS_FINANCIERO.find(e => e.key === order.estadoFinanciero)?.color || '') : ''}`}> 
                {order ? (ESTADOS_FINANCIERO.find(e => e.key === order.estadoFinanciero)?.label) : ''}
              </span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            {/* Mostrar total solo si estado financiero = cotizacion_aprobada */}
            {order && order.estadoFinanciero === 'cotizacion_aprobada' ? (
              <div className="text-2xl font-bold text-green-600 bg-green-100 px-6 py-2 rounded-2xl shadow-sm animate-fade-in flex items-center gap-2">
                <span>Total:</span>
                <span className="font-mono">
                  {order && order.resumen && typeof order.resumen.total === 'number' ? `$${order.resumen.total.toFixed(2)}` : '$0.00'}
                </span>
              </div>
            ) : (order && ['pendiente', 'revision'].includes(order.status) && (
              <div className="text-base text-gray-500 bg-gray-100 px-4 py-2 rounded-2xl shadow-sm animate-fade-in">
                Diagnóstico en proceso. El costo aún no está definido.
              </div>
            ))}
            <button
              className="px-6 py-2 rounded-xl bg-[#1976F3] text-white font-bold shadow-lg hover:bg-blue-700 transition-all"
              onClick={() => navigate(-1)}
            >
              Volver
            </button>
          </div>
        </div>

        {/* 3-column grid: Cliente, Equipo, Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8">
          {/* Cliente Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:-translate-y-1 transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M5.5 21h13a2 2 0 002-2v-2a7 7 0 00-14 0v2a2 2 0 002 2z" /></svg>
              <span className="font-bold text-blue-700 text-lg">Cliente</span>
            </div>
            <div className="font-bold text-gray-800 text-base mb-1">{order.clientName}</div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              {/* Proper phone icon */}
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V21a1 1 0 01-1.1 1A19.72 19.72 0 013 5.1 1 1 0 014 4h4.09a1 1 0 011 .75c.13.52.3 1.02.5 1.5a1 1 0 01-.23 1.09l-2.2 2.2a16.06 16.06 0 006.1 6.1l2.2-2.2a1 1 0 011.09-.23c.48.2.98.37 1.5.5a1 1 0 01.75 1V20a1 1 0 01-1 1z" /></svg>
              {order.telefono}
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
              {/* Email icon */}
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4z" /><path d="M4 4l8 8 8-8" /></svg>
              {order.correo}
            </div>
            <hr className="my-2" />
          </div>
          {/* Equipo Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:-translate-y-1 transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
              <span className="font-bold text-blue-700 text-lg">Equipo</span>
            </div>
            <div className="font-bold text-gray-800 text-base mb-1">{order.tipo} {order.marca}</div>
            <div className="text-gray-600 text-sm mb-1">Modelo: {order.modelo}</div>
            <div className="text-gray-600 text-sm mb-1">S/N: {order.serie}</div>
            {/* Equipo problem/diagnóstico (always show) */}
            <div className="mt-2 text-blue-700 text-sm font-semibold bg-blue-50 rounded-xl p-3">
              <span className="block mb-1">Problema del equipo:</span>
              <span>{order.description ? order.description : <span className="text-gray-400 italic">Sin problema registrado</span>}</span>
            </div>
            {/* Accesorios y contraseña */}
            <div className="mt-2 text-blue-700 text-sm font-semibold bg-blue-50 rounded-xl p-3">
              <span className="block mb-1">Accesorios dejados:</span>
              <span>{order.accesorios ? order.accesorios : <span className="text-gray-400 italic">No tenía accesorios</span>}</span>
            </div>
            <div className="mt-2 text-blue-700 text-sm font-semibold bg-blue-50 rounded-xl p-3">
              <span className="block mb-1">Contraseña del equipo:</span>
              <span>{order.seguridad ? order.seguridad : <span className="text-gray-400 italic">Sin contraseña</span>}</span>
            </div>
            <hr className="my-2" />
            <div className="text-xs text-gray-500 font-semibold mb-1">TÉCNICO ASIGNADO</div>
            <div className="font-bold text-gray-700 mb-2">{order.tecnico}</div>
          </div>
          {/* Estado Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:-translate-y-1 transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="8" r="1" /></svg>
              <span className="font-bold text-blue-700 text-lg">Estado</span>
            </div>
            <select
              className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold shadow-inner focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              value={estadoTecnico}
              disabled={estadoTecnico === 'cancelada' || estadoTecnico === 'entregada'}
              onChange={async e => {
                const newEstado = e.target.value;
                setEstadoTecnico(newEstado);
                try {
                  await fetch(`/api/orders/${order.folio}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: newEstado })
                  });
                  setOrder(prev => ({ ...prev, status: newEstado }));
                } catch (err) {
                  Swal.fire('Error', 'No se pudo guardar el estado en el servidor', 'error');
                }
              }}
            >
              {ESTADOS_TECNICO.map(e => (
                <option key={e.key} value={e.key}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        {Array.isArray(order?.imagenes) && order.imagenes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              <span className="font-bold text-blue-700 text-lg">Evidencia fotográfica</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {order.imagenes.map((img, idx) => (
                <div key={`img-${idx}`} className="relative group">
                  <a href={img} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={img}
                      alt={`Evidencia ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-xl border border-blue-100 shadow-sm group-hover:shadow-md transition-all"
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleEliminarImagen(img)}
                    className="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-lg bg-red-600 text-white shadow hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Render blocks based on estadoTecnico */}
        {(order?.status === 'diagnostico' || order?.status === 'lista') && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
              <span className="font-bold text-blue-700 text-lg">Diagnóstico</span>
            </div>
            {editandoDiagnostico ? (
              <>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-blue-200 p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mb-4"
                  placeholder="Describe el diagnóstico del equipo..."
                  value={diagnostico}
                  onChange={e => setDiagnostico(e.target.value)}
                />
                <button
                  className="px-6 py-2 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all"
                  onClick={handleGuardarDiagnostico}
                >
                  Guardar diagnóstico
                </button>
              </>
            ) : (
              <>
                <div className="w-full min-h-[80px] rounded-xl border border-blue-200 p-3 text-base bg-blue-50 text-blue-700 mb-4">
                  {diagnosticoGuardado || <span className="text-gray-400 italic">Sin diagnóstico guardado</span>}
                </div>
                {diagnosticoGuardado ? (
                  <button
                    className="px-6 py-2 rounded-xl bg-yellow-500 text-white font-bold shadow-lg hover:bg-yellow-600 transition-all"
                    onClick={handleEditarDiagnostico}
                  >
                    Editar diagnóstico
                  </button>
                ) : (
                  <button
                    className="px-6 py-2 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all"
                    onClick={handleEditarDiagnostico}
                  >
                    Agregar diagnóstico
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {order?.status === 'lista' && (
          <>
            {/* Trabajos realizados */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mb-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" /></svg>
                <span className="font-bold text-blue-700 text-lg">Trabajos realizados</span>
              </div>
              {agregandoTrabajo ? (
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
                  <input
                    type="text"
                    className="flex-1 rounded-xl border border-blue-200 p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Descripción del trabajo realizado"
                    value={trabajoDescripcion}
                    onChange={e => setTrabajoDescripcion(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-32 rounded-xl border border-blue-200 p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Costo"
                    value={trabajoCosto}
                    onChange={e => setTrabajoCosto(e.target.value)}
                  />
                  <button
                    className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold shadow-lg hover:bg-green-600 transition-all"
                    onClick={handleGuardarTrabajo}
                  >Guardar</button>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 flex items-center gap-2">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /></svg>
                    {trabajos.length === 0 ? 'No hay trabajos registrados' : ''}
                  </span>
                  <button className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all" onClick={handleAgregarTrabajo}>+ Agregar</button>
                </div>
              )}
              {trabajos.length > 0 && (
                <ul className="divide-y divide-blue-100 mt-2">
                  {trabajos.map((t, idx) => (
                    <li key={idx} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      {editIndex === idx ? (
                        <>
                          <div className="flex-1 flex flex-col md:flex-row gap-2 items-center">
                            <input
                              type="text"
                              className="flex-1 rounded-xl border border-blue-200 p-2 text-base focus:ring-2 focus:ring-blue-200 outline-none"
                              value={editDescripcion}
                              onChange={e => setEditDescripcion(e.target.value)}
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-32 rounded-xl border border-blue-200 p-2 text-base focus:ring-2 focus:ring-blue-200 outline-none"
                              value={editCosto}
                              onChange={e => setEditCosto(e.target.value)}
                            />
                            <button
                              className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold shadow-lg hover:bg-green-600 transition-all"
                              onClick={handleGuardarEdicionTrabajo}
                            >Guardar</button>
                            <button
                              className="px-4 py-2 rounded-xl bg-gray-400 text-white font-bold shadow-lg hover:bg-gray-500 transition-all"
                              onClick={() => setEditIndex(null)}
                            >Cancelar</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 flex md:items-center md:justify-between gap-2">
                            <span className="text-blue-700 font-semibold">{t.descripcion}</span>
                            <span className="font-mono text-blue-700">${t.costo.toFixed(2)}</span>
                          </div>
                          <button
                            className="px-3 py-1 rounded-xl bg-yellow-500 text-white font-bold shadow-lg hover:bg-yellow-600 transition-all"
                            onClick={() => handleEditarTrabajo(idx)}
                          >Editar</button>
                          <button
                            className="px-3 py-1 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all"
                            onClick={() => handleEliminarTrabajo(idx)}
                          >Eliminar</button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Piezas usadas */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mb-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="14" r="3" /></svg>
                <span className="font-bold text-blue-700 text-lg">Piezas usadas</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 flex items-center gap-2"><svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="14" r="3" /></svg>No hay piezas registradas</span>
                <button className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all">+ Agregar pieza</button>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center mt-4">
                <span className="font-bold text-blue-700">Costo Total:</span>
                <span className="font-mono text-2xl text-blue-700">
                  {order && order.resumen && typeof order.resumen.total === 'number' ? `$${order.resumen.total.toFixed(2)}` : `$${trabajos.reduce((acc, t) => acc + (typeof t.costo === 'number' ? t.costo : 0), 0).toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-start md:justify-between items-center mt-8 animate-fade-in">
              <button className="px-6 py-3 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                Guardar cambios
              </button>
              <button onClick={handleGenerarPDF} className="px-6 py-3 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V6" /><path d="M5 12l7 7 7-7" /></svg>
                Generar PDF
              </button>
              <button onClick={handleImprimirTicket} className="px-6 py-3 rounded-xl bg-slate-600 text-white font-bold shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2">
                {/* Material Icons printer */}
                <svg className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 9V4h12v5" stroke="currentColor" strokeWidth="2"/><rect x="6" y="16" width="12" height="4" fill="currentColor"/><rect x="4" y="9" width="16" height="7" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                Imprimir ticket
              </button>
              <button className="px-6 py-3 rounded-xl bg-green-500 text-white font-bold shadow-lg hover:bg-green-600 transition-all flex items-center gap-2">
                {/* Material Icons WhatsApp */}
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.56 13.87c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.72.9-.89 1.08-.17.18-.32.2-.59.07-.28-.14-1.18-.44-2.24-1.41-.83-.74-1.39-1.65-1.54-1.92-.16-.28-.03-.43.11-.57.12-.12.27-.31.4-.47.13-.16.18-.28.27-.46.09-.18.04-.34-.02-.47-.07-.13-.62-1.45-.85-1.99-.23-.54-.47-.47-.64-.48-.17-.01-.36-.01-.55-.01-.19 0-.5.07-.76.36-.26.29-.99.98-.99 2.39 0 1.41 1.03 2.77 1.17 2.97.14.19 2.03 3.1 4.92 4.36.69.3 1.23.47 1.65.6.69.22 1.32.19 1.81.11.55-.08 1.65-.69 1.89-1.36.23-.67.23-1.24.16-1.36-.07-.12-.25-.19-.52-.33zm-4.98 7.13C6.23 21 2 16.77 2 12c0-4.77 4.23-9 9.58-9 4.77 0 9 4.23 9 9 0 4.77-4.23 9-9 9zm0-16c-3.86 0-7 3.14-7 7 0 3.86 3.14 7 7 7 3.86 0 7-3.14 7-7 0-3.86-3.14-7-7-7z"/></svg>
                Enviar cotización (WhatsApp)
              </button>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}