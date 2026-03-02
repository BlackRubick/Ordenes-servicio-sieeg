
import DashboardLayout from '../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';



import React, { useState } from 'react';
import SignaturePadCanvas from '../components/SignaturePadCanvas';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

// ...existing code...

const ESTADOS = {
  pendiente: { label: 'Pendiente', bg: 'bg-state-pending/30', text: 'text-state-pending' },
  revision: { label: 'En revisión', bg: 'bg-state-review/30', text: 'text-state-review' },
  diagnostico: { label: 'Diagnóstico generado', bg: 'bg-blue-200/20', text: 'text-blue-800' },
  espera_aprobacion: { label: 'En espera de aprobación', bg: 'bg-yellow-100/20', text: 'text-yellow-700' },
  reparacion: { label: 'En reparación', bg: 'bg-state-repair/30', text: 'text-state-repair' },
  lista: { label: 'Lista', bg: 'bg-green-500/20', text: 'text-green-600' },
  entregada: { label: 'Entregada', bg: 'bg-blue-400/20', text: 'text-blue-500' },
  cancelada: { label: 'Cancelada', bg: 'bg-state-cancelled/30', text: 'text-state-cancelled' },
  eliminada: { label: 'Eliminada', bg: 'bg-gray-300/30', text: 'text-gray-500' },
};


const Orders = () => {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isTechnician = normalizedRole === 'tecnico';
  const isAdmin = normalizedRole === 'administrador' || normalizedRole === 'admin';
  const currentUserName = user?.nombre || user?.name || '';
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [tecnico, setTecnico] = useState('');
  const [orders, setOrders] = useState([]);
  const [allTechnicians, setAllTechnicians] = useState([]);
  const [cancelOrderFolio, setCancelOrderFolio] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [entregaOrderFolio, setEntregaOrderFolio] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [signatureData, setSignatureData] = useState(null);
  const signaturePadRef = React.useRef();

  const generateOrderPdfDoc = async (order) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const statusKey = order.status || order.estado || 'pendiente';
    const statusLabel = ESTADOS[statusKey]?.label || statusKey;
    const details = order.description || order.detalles || order.observaciones || 'No especificado';
    const equipo = [order.tipo, order.marca, order.modelo, order.serie].filter(Boolean).join(' ');
    const total = typeof order.resumen?.total === 'number' ? `$${order.resumen.total.toFixed(2)}` : '$0.00';

    const C = {
      navy: '#08c7e1',
      blue: '#35def4',
      bg: '#F4F6F9',
      white: '#FFFFFF',
      divider: '#DDE3EC',
      labelText: '#6B7A99',
      bodyText: '#1A1A2E',
      footerText: '#9099B2',
    };

    const rgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    const setFill = (hex) => doc.setFillColor(...rgb(hex));
    const setStroke = (hex) => doc.setDrawColor(...rgb(hex));
    const setTxt = (hex) => doc.setTextColor(...rgb(hex));

    const filledRoundRect = (x, y, w, h, r, color) => {
      setFill(color);
      doc.roundedRect(x, y, w, h, r, r, 'F');
    };

    const getLogoBase64 = (src) => new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = '';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    const logoBase64 = await getLogoBase64('/images/logo.ico');

    const sectionHeader = (label, x, y, w) => {
      filledRoundRect(x, y, w, 22, 4, C.navy);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setTxt(C.white);
      doc.text(label.toUpperCase(), x + 10, y + 14.5);
      return y + 22;
    };

    const fieldCell = (label, value, x, y, w, h = 30) => {
      filledRoundRect(x, y, w, h, 3, C.bg);
      setStroke(C.divider);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 3, 3, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      setTxt(C.labelText);
      doc.text(label.toUpperCase(), x + 6, y + 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setTxt(C.bodyText);
      const txt = doc.splitTextToSize(String(value || '—'), w - 12);
      doc.text(txt[0] || '—', x + 6, y + 21);
    };

    // Background
    setFill(C.bg);
    doc.rect(0, 0, W, H, 'F');
    filledRoundRect(20, 20, W - 40, H - 40, 8, C.white);

    // Header
    setFill(C.bg);
    doc.rect(0, 0, W, 90, 'F');
    const logoY = 22, logoH = 40, logoW = 100;
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 40, logoY, logoW, logoH);
    }
    const textX = 40 + logoW + 22;
    const textY = logoY + 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    setTxt('#000000');
    doc.text('Ingeniería y Telecomunicaciones', textX, textY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SIEEG', textX, textY + 16);
    const boxW = 120, boxH = 28;
    const boxX = W - boxW - 50, boxY = logoY + 6;
    setStroke('#35def4');
    doc.setLineWidth(1.2);
    doc.roundedRect(boxX, boxY, boxW, boxH, 7, 7, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ORDEN DE SERVICIO', boxX + boxW / 2, boxY + boxH / 2 + 3, { align: 'center' });

    const mx = 34;
    const cw = W - mx * 2;
    let y = 112;

    // Franja superior: folio y fecha (igual estilo original)
    const strip2W = (cw - 8) / 2;
    filledRoundRect(mx, y, cw, 38, 5, C.bg);
    setStroke(C.divider);
    doc.setLineWidth(0.4);
    doc.roundedRect(mx, y, cw, 38, 5, 5, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setTxt(C.labelText);
    doc.text('FOLIO', mx + 10, y + 11);
    doc.setFontSize(10);
    setTxt(C.blue);
    doc.text(String(order.folio || '—'), mx + 10, y + 27);
    doc.setFontSize(6.5);
    setTxt(C.labelText);
    doc.text('FECHA DE INGRESO', mx + strip2W + 10, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setTxt(C.bodyText);
    const fechaFmt = String(order.fecha || '').includes('-') ? String(order.fecha).split('-').reverse().join('/') : (order.fecha || '—');
    doc.text(fechaFmt, mx + strip2W + 10, y + 27);
    y += 52;

    // Información del cliente
    y = sectionHeader('Información del Cliente', mx, y, cw);
    y += 8;
    const col3 = (cw - 12) / 3;
    fieldCell('Nombre Completo', order.clientName || '—', mx, y, col3);
    fieldCell('Teléfono', order.telefono || '—', mx + col3 + 6, y, col3);
    fieldCell('Correo Electrónico', order.correo || '—', mx + col3 * 2 + 12, y, col3);
    y += 44;

    // Información del equipo
    y = sectionHeader('Información del Equipo', mx, y, cw);
    y += 8;
    const col4 = (cw - 18) / 4;
    fieldCell('Tipo de Equipo', order.tipo || '—', mx, y, col4);
    fieldCell('Marca', order.marca || '—', mx + col4 + 6, y, col4);
    fieldCell('Modelo', order.modelo || '—', mx + col4 * 2 + 12, y, col4);
    fieldCell('Núm. de Serie', order.serie || '—', mx + col4 * 3 + 18, y, col4);
    y += 44;

    // Accesorios y seguridad
    y = sectionHeader('Accesorios y Seguridad', mx, y, cw);
    y += 8;
    const halfW = (cw - 8) / 2;
    const accs = [order.accesorios, order.otrosAccesorios].filter(Boolean).join(', ') || 'Sin accesorios marcados';
    fieldCell('Accesorios Incluidos', accs, mx, y, halfW);
    fieldCell('Contraseña / PIN', order.seguridad || '—', mx + halfW + 8, y, halfW);
    y += 44;

    // Descripción de la falla
    y = sectionHeader('Descripción de la Falla', mx, y, cw);
    y += 8;
    const probLines = doc.splitTextToSize(String(details || '—'), cw - 24);
    const probH = Math.max(44, probLines.length * 13 + 18);
    filledRoundRect(mx, y, cw, probH, 4, C.bg);
    setStroke(C.divider);
    doc.setLineWidth(0.4);
    doc.roundedRect(mx, y, cw, probH, 4, 4, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setTxt(C.labelText);
    doc.text('PROBLEMA REPORTADO', mx + 8, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setTxt(C.bodyText);
    doc.text(probLines, mx + 8, y + 22);
    y += probH + 16;

    // Técnico asignado + estado + total
    y = sectionHeader('Técnico Asignado', mx, y, cw);
    y += 8;
    const col3b = (cw - 12) / 3;
    fieldCell('Técnico Responsable', order.tecnico || '—', mx, y, col3b);
    fieldCell('Estado', statusLabel || '—', mx + col3b + 6, y, col3b);
    fieldCell('Total', total || '$0.00', mx + col3b * 2 + 12, y, col3b);

    // Footer
    setStroke(C.divider);
    doc.setLineWidth(0.5);
    doc.line(34, H - 38, W - 34, H - 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setTxt(C.footerText);
    doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', 34, H - 26);
    doc.text('Tel: 961 118 0157  ·  WhatsApp: 961 333 6529', 34, H - 16);
    doc.text('Página 1 de 1', W - 34, H - 16, { align: 'right' });

    return doc;
  };

  const handlePreviewPdf = async (order) => {
    const doc = await generateOrderPdfDoc(order);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadPdf = async (order) => {
    const doc = await generateOrderPdfDoc(order);
    doc.save(`Orden_${order.folio || 'servicio'}.pdf`);
  };

  React.useEffect(() => {
    fetch('/api/orders?excludeForeign=true')
      .then(res => res.json())
      .then(data => {
        // Parse resumen if it's a string
        const parsed = data.map(o => {
          let resumen = o.resumen;
          if (typeof resumen === 'string') {
            try {
              resumen = JSON.parse(resumen);
            } catch (e) {
              resumen = {};
            }
          }
          return { ...o, resumen };
        });
        let filtered = parsed.filter(o => String(o.tipo || '').toLowerCase() !== 'foraneo');
        // Si es técnico, solo mostrar sus órdenes asignadas
        if (normalizedRole === 'tecnico' && currentUserName) {
          filtered = filtered.filter(o => o.tecnico === currentUserName);
        }
        setOrders(filtered);
      })
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las órdenes', 'error'));
    fetch('/api/technicians')
      .then(res => res.json())
      .then(data => setAllTechnicians(data))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar los técnicos', 'error'));
  }, [normalizedRole, currentUserName]);

  // Obtener técnicos únicos (ya no se usa, pero lo dejamos para el filtro por técnico)
  const tecnicos = Array.from(new Set(orders.map(o => o.tecnico)));

  // Filtrado en tiempo real
  const filtered = orders.filter(o => {
    const equipoStr = [o.marca, o.modelo, o.serie].filter(Boolean).join(' ').toLowerCase();
    const matchSearch =
      !search ||
      o.folio?.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      equipoStr.includes(search.toLowerCase());
    const matchEstado = !estado || (o.status || o.estado) === estado;
    const matchTecnico = !tecnico || o.tecnico === tecnico;
    // Si es técnico, solo ve sus órdenes
    if (normalizedRole === 'tecnico') {
      return matchSearch && matchEstado && o.tecnico === currentUserName;
    }
    return matchSearch && matchEstado && matchTecnico;
  });

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold text-primary-500 tracking-tight">Órdenes de Servicio</h2>
          <p className="text-sm text-text-secondary">Gestiona todas las reparaciones</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
          <input
            className="flex-1 px-5 py-3 rounded-xl border border-border bg-white shadow-card focus:ring-2 focus:ring-primary/30 outline-none transition-all text-base"
            placeholder="Buscar por folio, cliente, equipo o marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-3 rounded-xl border border-border bg-white shadow-card text-base"
            value={estado}
            onChange={e => setEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          {!isTechnician && (
            <select
              className="px-4 py-3 rounded-xl border border-border bg-white shadow-card text-base"
              value={tecnico}
              onChange={e => setTecnico(e.target.value)}
            >
              <option value="">Todos los técnicos</option>
              {allTechnicians.map(t => (
                <option key={t.id} value={t.nombre || t.name}>{t.nombre || t.name}</option>
              ))}
            </select>
          )}
          {isAdmin && (
            <button
              className="px-6 py-3 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300"
              onClick={() => navigate('/admin/orders/create')}
              type="button"
            >
              + Nueva Orden
            </button>
          )}
        </div>
      </div>
      <div className="rounded-2xl bg-gradient-to-tr from-primary-100 to-blue-50 shadow-lg p-1 overflow-x-auto animate-fade-in">
        <table className="min-w-full text-base border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-white font-bold bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl">
              <th className="py-3 px-4 rounded-tl-2xl">Folio</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Equipo</th>
              <th className="py-3 px-4">Técnico</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-8 bg-white rounded-b-2xl">No hay órdenes que coincidan.</td>
              </tr>
            )}
            {filtered.map((o, idx) => {
              const isLast = idx === filtered.length - 1;
              return (
                <tr
                  key={o.folio}
                  className={`transition-all duration-300 group bg-white shadow-card border-b border-border last:border-0 hover:shadow-xl hover:-translate-y-1 ${isLast ? 'rounded-b-2xl' : ''}`}
                  style={{ borderRadius: isLast ? '0 0 1rem 1rem' : undefined }}
                >
                  <td className="py-4 px-4 font-mono text-primary-600 text-lg font-bold align-middle">{o.folio}</td>
                  <td className="py-4 px-4 align-middle"><span className="flex items-center gap-2"><svg className="w-5 h-5 text-primary-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{o.fecha}</span></td>
                  <td className="py-4 px-4 align-middle"><span className="font-bold text-dark">{o.clientName}</span></td>
                  <td className="py-4 px-4 align-middle"><span className="font-semibold text-dark lowercase">{[o.marca, o.modelo, o.serie].filter(Boolean).join(' ')}</span></td>
                  <td className="py-4 px-4 align-middle">
                    {isTechnician || ['cancelada', 'eliminada'].includes(o.status || o.estado) ? (
                      <span className="text-primary-500 font-semibold">{o.tecnico}</span>
                    ) : (
                      <select
                        className="px-3 py-1 rounded-full border font-semibold text-xs shadow-sm bg-white text-primary-500 border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        value={o.tecnico}
                        onChange={async e => {
                          const newTecnico = e.target.value;
                          // Buscar el id del técnico seleccionado
                          const selected = allTechnicians.find(t => (t.nombre || t.name) === newTecnico);
                          if (!selected) return;
                          setOrders(prev => prev.map((ord) => ord.folio === o.folio ? { ...ord, tecnico: newTecnico } : ord));
                          try {
                            await fetch(`/api/orders/${o.folio}/tecnico`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ technicianId: selected.id })
                            });
                          } catch (err) {
                            Swal.fire('Error', 'No se pudo actualizar el técnico en el servidor', 'error');
                          }
                        }}
                      >
                        {allTechnicians.map(t => (
                          <option key={t.id} value={t.nombre || t.name}>{t.nombre || t.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-4 px-4 align-middle">
                    {['cancelada', 'eliminada'].includes(o.status || o.estado) ?
                      (ESTADOS[o.status || o.estado] ? (
                        <span className={`px-4 py-1 rounded-full border font-semibold text-xs shadow-sm ${ESTADOS[o.status || o.estado].bg} ${ESTADOS[o.status || o.estado].text} border-current`}>
                          {ESTADOS[o.status || o.estado].label}
                        </span>
                      ) : (
                        <span className="px-4 py-1 rounded-full border font-semibold text-xs shadow-sm bg-gray-200 text-gray-500 border-current">Estado desconocido</span>
                      ))
                      : (
                      <select
                        className={`px-4 py-1 rounded-full border font-semibold text-xs shadow-sm ${(ESTADOS[o.status || o.estado]?.bg || 'bg-gray-200')} ${(ESTADOS[o.status || o.estado]?.text || 'text-gray-500')} border-current focus:outline-none focus:ring-2 focus:ring-primary-200`}
                        value={o.status || o.estado}
                        onChange={async e => {
                          const newEstado = e.target.value;
                          if (newEstado === 'entregada') {
                            setEntregaOrderFolio(o.folio);
                          } else {
                            // Actualiza en frontend
                            setOrders(prev => prev.map((ord) => ord.folio === o.folio ? { ...ord, status: newEstado, estado: newEstado } : ord));
                            // Actualiza en backend
                            try {
                              await fetch(`/api/orders/${o.folio}/estado`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ estado: newEstado })
                              });
                            } catch (err) {
                              Swal.fire('Error', 'No se pudo guardar el estado en el servidor', 'error');
                            }
                          }
                        }}
                      >
                        {Object.entries(ESTADOS)
                          .filter(([key]) => key !== 'cancelada' && key !== 'eliminada')
                          .map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                      </select>
                    )}
                  </td>
                  <td className="py-4 px-4 align-middle font-bold text-dark">{typeof o.resumen?.total === 'number' ? `$${o.resumen.total.toFixed(2)}` : '$0.00'}</td>
                  <td className="py-4 px-4 align-middle flex gap-2">
                    <button
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-500 hover:text-white transition-all shadow-sm"
                      title={isAdmin ? 'Ver detalle' : 'Ver PDF'}
                      onClick={() => (isAdmin ? navigate(`/admin/orders/${o.folio}`) : handlePreviewPdf(o))}
                    >
                      {/* Eye icon */}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                      title="Descargar PDF"
                      onClick={() => handleDownloadPdf(o)}
                    >
                      {/* Download icon */}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12" />
                      </svg>
                    </button>
                    {/* Solo admin puede eliminar/cancelar */}
                    {isAdmin && (
                      <>
                        {(o.status || o.estado) === 'cancelada' ? (
                          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-400 hover:text-white transition-all shadow-sm" title="Eliminar" onClick={() => {
                            Swal.fire({
                              title: '¿Estás seguro?',
                              text: 'Esta acción eliminará la orden de forma permanente.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#d33',
                              cancelButtonColor: '#3085d6',
                              confirmButtonText: 'Sí, eliminar',
                              cancelButtonText: 'Cancelar',
                            }).then(async (result) => {
                              if (result.isConfirmed) {
                                try {
                                  const res = await fetch(`/api/orders/${o.folio}`, { method: 'DELETE' });
                                  if (!res.ok) throw new Error('No se pudo eliminar');
                                  setOrders(prev => prev.filter(ord => ord.folio !== o.folio));
                                  Swal.fire('Eliminada', 'La orden ha sido eliminada.', 'success');
                                } catch (err) {
                                  Swal.fire('Error', 'No se pudo eliminar la orden en el servidor', 'error');
                                }
                              }
                            });
                          }}>
                            {/* Trash icon */}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 4h4a1 1 0 011 1v2H9V5a1 1 0 011-1z" />
                            </svg>
                          </button>
                        ) : (o.status || o.estado) === 'eliminada' ? null : (
                          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Cancelar" onClick={() => setCancelOrderFolio(o.folio)}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Modal para motivo de cancelación */}
      {cancelOrderFolio !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-xl font-bold text-red-600">Cancelar orden</h3>
            <p className="text-sm text-gray-700">Por favor, indica el motivo de la cancelación:</p>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-red-200 outline-none"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación..."
            />
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => { setCancelOrderFolio(null); setCancelReason(''); }}>Cancelar</button>
              <button className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700" disabled={!cancelReason.trim()} onClick={async () => {
                try {
                  await fetch(`/api/orders/${cancelOrderFolio}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'cancelada' })
                  });
                  setOrders(prev => prev.map((ord) => ord.folio === cancelOrderFolio ? { ...ord, status: 'cancelada', estado: 'cancelada', motivoCancelacion: cancelReason } : ord));
                  setCancelOrderFolio(null);
                  setCancelReason('');
                } catch (err) {
                  Swal.fire('Error', 'No se pudo cancelar la orden en el servidor', 'error');
                }
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para entrega (nombre y firma) */}
      {entregaOrderFolio !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-xl font-bold text-blue-600">Entregar orden</h3>
            <p className="text-sm text-gray-700">Por favor, escribe el nombre de la persona que recibe y firma abajo:</p>
            <input
              className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Nombre de quien recibe..."
            />
            <div>
              <label className="block text-sm font-semibold mb-2 text-blue-600">Firma:</label>
              <div className="border rounded-xl p-2 bg-gray-50 flex flex-col items-center">
                {/* SignaturePadCanvas */}
                <SignaturePadCanvas ref={signaturePadRef} width={320} height={100} onEnd={() => {
                  const canvas = signaturePadRef.current.getTrimmedCanvas();
                  setSignatureData(canvas.toDataURL());
                }} />
                <button className="mt-2 px-3 py-1 rounded bg-blue-200 text-blue-700 font-semibold" onClick={() => {
                  signaturePadRef.current.clear();
                  setSignatureData(null);
                }}>Limpiar firma</button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => {
                setEntregaOrderFolio(null);
                setRecipientName('');
                setSignatureData(null);
                if (signaturePadRef.current) signaturePadRef.current.clear();
              }}>Cancelar</button>
              <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700" disabled={!recipientName.trim() || !signatureData} onClick={async () => {
                try {
                  await fetch(`/api/orders/${entregaOrderFolio}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'entregada' })
                  });
                  setOrders(prev => prev.map((ord) => ord.folio === entregaOrderFolio ? { ...ord, status: 'entregada', estado: 'entregada', nombreEntrega: recipientName, firmaEntrega: signatureData } : ord));
                  setEntregaOrderFolio(null);
                  setRecipientName('');
                  setSignatureData(null);
                  if (signaturePadRef.current) signaturePadRef.current.clear();
                } catch (err) {
                  Swal.fire('Error', 'No se pudo registrar la entrega en el servidor', 'error');
                }
              }}>Confirmar entrega</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Orders;
