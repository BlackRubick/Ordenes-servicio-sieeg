import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { useAuthStore } from '../store/authStore';
import SignaturePadCanvas from '../components/SignaturePadCanvas';

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'revision', label: 'En revisión' },
  { value: 'reparacion', label: 'En reparación' },
  { value: 'lista', label: 'Lista' },
  { value: 'cancelada', label: 'Cancelada' },
];

const normalizeStatus = (status) => {
  const raw = String(status || '').trim().toLowerCase();
  const map = {
    pendiente: 'pendiente',
    'en proceso': 'revision',
    'en revisión': 'revision',
    revision: 'revision',
    reparacion: 'reparacion',
    'en reparación': 'reparacion',
    lista: 'lista',
    entregada: 'entregada',
    cancelada: 'cancelada',
  };
  return map[raw] || 'pendiente';
};

const getAddressFromObservaciones = (observaciones) => {
  if (!observaciones) return '-';
  if (typeof observaciones === 'object') return observaciones.direccion || '-';
  try {
    const parsed = JSON.parse(observaciones);
    return parsed?.direccion || '-';
  } catch (_) {
    return '-';
  }
};

export default function ForeignServices() {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isTechnician = normalizedRole === 'tecnico';
  const isAdmin = normalizedRole === 'administrador' || normalizedRole === 'admin';
  const currentUserName = user?.nombre || user?.name || '';
  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [pendingReceive, setPendingReceive] = useState(null);
  const [nombreRecibe, setNombreRecibe] = useState('');
  const signaturePadRef = useRef();

  useEffect(() => {
    fetch('/api/orders?foraneo=true')
      .then(res => res.json())
      .then(data => {
        let mapped = (Array.isArray(data) ? data : [])
          .filter(order => String(order.tipo || '').toLowerCase() === 'foraneo')
          .map(order => ({
            ...order,
            status: normalizeStatus(order.status || order.estado),
            direccion: getAddressFromObservaciones(order.observaciones),
          }));
        // Si es técnico, solo mostrar sus servicios asignados
        if (normalizedRole === 'tecnico' && currentUserName) {
          mapped = mapped.filter(order => order.tecnico === currentUserName);
        }
        setServices(mapped);
      })
      .catch(() => {
        Swal.fire('Error', 'No se pudieron cargar los servicios foráneos', 'error');
        setServices([]);
      });

    fetch('/api/technicians')
      .then(res => res.json())
      .then(data => setTechnicians(Array.isArray(data) ? data : []))
      .catch(() => setTechnicians([]));
  }, [normalizedRole, currentUserName]);

  const handleTecnicoChange = async (idx, technicianName) => {
    const selected = technicians.find(t => (t.nombre || t.name) === technicianName);
    if (!selected) return;

    const service = services[idx];
    setServices(prev => prev.map((s, i) => (i === idx ? { ...s, tecnico: technicianName } : s)));

    try {
      await fetch(`/api/orders/${service.folio}/tecnico`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: selected.id }),
      });
    } catch (_) {
      Swal.fire('Error', 'No se pudo actualizar el técnico', 'error');
    }
  };

  const updateStatusWithReceipt = async (idx, newEstado, receiptData = {}) => {
    const service = services[idx];
    const previous = service.status;

    setServices(prev => prev.map((s, i) => (i === idx ? { ...s, status: newEstado, ...receiptData } : s)));

    try {
      const res = await fetch(`/api/orders/${service.folio}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado, ...receiptData }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar el estado');
    } catch (_) {
      setServices(prev => prev.map((s, i) => (i === idx ? { ...s, status: previous } : s)));
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  const handleEstadoChange = async (idx, newEstado) => {
    const service = services[idx];

    const hasTechnicianAssigned = Boolean(
      String(service.tecnico || '').trim() || service.technicianId
    );

    if (!hasTechnicianAssigned && newEstado !== 'pendiente') {
      await Swal.fire({
        icon: 'warning',
        title: 'Asigna un técnico primero',
        text: 'Debes asignar un técnico para poder cambiar el estado de la orden.',
        confirmButtonText: 'Entendido',
      });

      setServices(prev => prev.map((s, i) => (
        i === idx ? { ...s, status: 'pendiente' } : s
      )));
      return;
    }

    if (newEstado === 'lista') {
      const decision = await Swal.fire({
        title: '¿Van a firmar de recibido?',
        text: 'Si firmas de recibido, se agregará nombre y firma en el PDF.',
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Sí, firmar',
        denyButtonText: 'No, sin firma',
        cancelButtonText: 'Cancelar',
      });

      if (decision.isConfirmed) {
        setPendingReceive({ idx, newEstado });
        setNombreRecibe(service.nombreRecibe || '');
        setShowReceiveModal(true);
        setTimeout(() => signaturePadRef.current?.clear?.(), 0);
        return;
      }

      if (decision.isDenied) {
        await updateStatusWithReceipt(idx, newEstado, { firma: null, nombreRecibe: null });
      }
      return;
    }

    await updateStatusWithReceipt(idx, newEstado);
  };

  const handleDeleteOrder = async (idx) => {
    const service = services[idx];
    const result = await Swal.fire({
      title: '¿Eliminar orden?',
      text: `La orden ${service.folio} será eliminada permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/orders/${service.folio}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('No se pudo eliminar');
      setServices(prev => prev.filter((_, i) => i !== idx));
      Swal.fire('Eliminada', 'La orden ha sido eliminada correctamente.', 'success');
    } catch (_) {
      Swal.fire('Error', 'No se pudo eliminar la orden', 'error');
    }
  };

  const generatePDFFromOrder = async (service) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // ── Palette ──────────────────────────────────────────────────────────────
    const C = {
      navy:       '#1a3a5e',
      blue:       '#35def4',
      blueLight:  '#35def4',
      accent:     '#000000',
      bg:         '#F4F6F9',
      white:      '#FFFFFF',
      divider:    '#DDE3EC',
      labelText:  '#6B7A99',
      bodyText:   '#1A1A2E',
      footerText: '#9099B2',
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const rgb = (hex) => {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return [r,g,b];
    };
    const setFill  = (hex) => doc.setFillColor(...rgb(hex));
    const setStroke= (hex) => doc.setDrawColor(...rgb(hex));
    const setTxt   = (hex) => doc.setTextColor(...rgb(hex));

    const filledRoundRect = (x,y,w,h,r,color) => {
      setFill(color);
      doc.roundedRect(x,y,w,h,r,r,'F');
    };

    // Logo loader
    const getLogoBase64 = (src) => new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = '';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img,0,0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    const logoBase64 = await getLogoBase64('/images/logo.ico');

    // ── Section header helper ─────────────────────────────────────────────────
    const sectionHeader = (label, x, y, w) => {
      filledRoundRect(x, y, w, 22, 4, C.navy);
      doc.setFont('helvetica','bold');
      doc.setFontSize(8.5);
      setTxt(C.white);
      doc.text(label.toUpperCase(), x + 10, y + 14.5);
      return y + 22;
    };

    // ── Field cell helper ─────────────────────────────────────────────────────
    const fieldCell = (label, value, x, y, w, h = 30) => {
      filledRoundRect(x, y, w, h, 3, C.bg);
      setStroke(C.divider);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 3, 3, 'S');
      doc.setFont('helvetica','bold');
      doc.setFontSize(6.5);
      setTxt(C.labelText);
      doc.text(label.toUpperCase(), x + 6, y + 9);
      doc.setFont('helvetica','normal');
      doc.setFontSize(8.5);
      setTxt(C.bodyText);
      const maxW = w - 12;
      const txt  = doc.splitTextToSize(String(value || '—'), maxW);
      doc.text(txt[0], x + 6, y + 21);
    };

    // ── Draw page background ──────────────────────────────────────────────────
    const drawPageBg = () => {
      setFill(C.bg);
      doc.rect(0, 0, W, H, 'F');
      filledRoundRect(20, 20, W - 40, H - 40, 8, C.white);
    };

    // ── HEADER ────────────────────────────────────────────────────────────────
    const drawHeader = () => {
      setFill(C.bg);
      doc.rect(0, 0, W, 90, 'F');
      // Logo
      const logoY = 22, logoH = 40, logoW = 100;
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 40, logoY, logoW, logoH);
      }
      // Textos a la derecha del logo
      const textX = 40 + logoW + 22;
      const textY = logoY + 14;
      doc.setFont('helvetica','bold');
      doc.setFontSize(13);
      setTxt('#000000');
      doc.text('Ingeniería y Telecomunicaciones', textX, textY);
      doc.setFont('helvetica','normal');
      doc.setFontSize(9);
      setTxt('#000000');
      doc.text('SIEEG', textX, textY + 16);
      // Recuadro a la derecha en azul oscuro con fondo
      const boxW = 120, boxH = 28;
      const boxX = W - boxW - 50, boxY = logoY + 6;
      filledRoundRect(boxX, boxY, boxW, boxH, 7, C.navy);
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      setTxt(C.white);
      doc.text('SERVICIO FORÁNEO', boxX + boxW / 2, boxY + boxH / 2 + 3, { align: 'center' });
    };

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const drawFooter = (pageNum) => {
      setStroke(C.divider);
      doc.setLineWidth(0.5);
      doc.line(34, H - 38, W - 34, H - 38);
      doc.setFont('helvetica','normal');
      doc.setFontSize(6.5);
      setTxt(C.footerText);
      doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', 34, H - 26);
      doc.text('Tel: 961 118 0157  ·  WhatsApp: 961 333 6529', 34, H - 16);
      doc.text(`Página ${pageNum} de 1`, W - 34, H - 16, { align: 'right' });
    };

    // ── PAGE 1 ────────────────────────────────────────────────────────────────
    drawPageBg();
    drawHeader();

    const mx = 40;
    const cw = W - 80;
    let y = 110;

    // Información del cliente
    y = sectionHeader('Información del Cliente', mx, y, cw);
    y += 8;
    const col3 = (cw - 16) / 3;
    fieldCell('Cliente', service.clientName, mx, y, col3);
    fieldCell('Dirección', service.direccion, mx + col3 + 8, y, col3);
    fieldCell('Teléfono', service.telefono, mx + col3*2 + 16, y, col3);
    y += 44;

    // Folio y Fecha
    fieldCell('Folio', service.folio, mx, y, col3);
    fieldCell('Fecha', service.fecha, mx + col3 + 8, y, col3);
    y += 44;

    // Tabla de mantenimiento
    y = sectionHeader('Checklist de Mantenimiento', mx, y, cw);
    y += 8;

    // Parsear observaciones para obtener los datos de la tabla
    let rows = [];
    if (service.observaciones) {
      try {
        const parsed = JSON.parse(service.observaciones);
        if (parsed.rows && Array.isArray(parsed.rows)) {
          rows = parsed.rows;
        }
      } catch (_) {
        rows = [];
      }
    }

    const headers = ['Área', 'Filtros', 'Condensadora', 'PSI', 'Evaporadora', 'Eléctrica', 'Observaciones'];
    const colWidths = [
      cw * 0.20,  // Área
      cw * 0.11,  // Filtros
      cw * 0.13,  // Condensadora
      cw * 0.08,  // PSI
      cw * 0.13,  // Evaporadora
      cw * 0.11,  // Eléctrica
      cw * 0.24   // Observaciones
    ];
    const headerH = 16;

    // Encabezados
    doc.setFont('helvetica','bold');
    doc.setFontSize(7.5);
    let xPos = mx;
    headers.forEach((header, idx) => {
      // Fondo azul oscuro
      setFill(C.navy);
      doc.rect(xPos, y, colWidths[idx], headerH, 'F');
      // Borde
      setStroke(C.divider);
      doc.setLineWidth(0.5);
      doc.rect(xPos, y, colWidths[idx], headerH, 'S');
      // Texto blanco
      setTxt(C.white);
      const headerText = doc.splitTextToSize(header, colWidths[idx] - 4);
      doc.text(headerText, xPos + 3, y + 11);
      xPos += colWidths[idx];
    });
    y += headerH;

    // Filas de datos
    rows.forEach((row, idx) => {
      if (y > H - 90) {
        drawFooter(1);
        doc.addPage();
        drawPageBg();
        drawHeader();
        y = 110;
      }

      const rowH = 14;
      xPos = mx;
      const bgColor = idx % 2 === 0 ? C.white : '#F9FAFB';

      // Dibujar celdas
      for (let i = 0; i < headers.length; i++) {
        // Fondo alternado
        setFill(bgColor);
        doc.rect(xPos, y, colWidths[i], rowH, 'F');
        // Borde
        setStroke(C.divider);
        doc.setLineWidth(0.4);
        doc.rect(xPos, y, colWidths[i], rowH, 'S');

        // Valor de la celda
        let cellValue = '';
        if (i === 0) cellValue = row.area || '—';
        else if (i === 1) cellValue = row.filtros || '—';
        else if (i === 2) cellValue = row.condensadora || '—';
        else if (i === 3) cellValue = row.psi || '—';
        else if (i === 4) cellValue = row.evaporadora || '—';
        else if (i === 5) cellValue = row.electrica || '—';
        else if (i === 6) cellValue = row.observaciones || '—';

        // Texto en color oscuro
        doc.setFont('helvetica','normal');
        doc.setFontSize(6.5);
        setTxt(C.bodyText);
        const cellText = doc.splitTextToSize(String(cellValue), colWidths[i] - 4);
        doc.text(cellText, xPos + 3, y + 9);

        xPos += colWidths[i];
      }

      y += rowH;
    });

    // ════════════════════════════════════════════════════════════════
    //  FIRMAS Y ACEPTACIÓN - Solo mostrar si hay nombre o firma
    // ════════════════════════════════════════════════════════════════
    
    if (service.firma || service.nombreRecibe) {
      // Añadir nueva página si es necesario
      if (y > H - 220) {
        drawFooter(1);
        doc.addPage();
        drawPageBg();
        drawHeader();
        y = 110;
      }

      y += 20;
      
      // Título sección en azul oscuro navy
      const sigSectionH = 32;
      filledRoundRect(mx, y, cw, sigSectionH, 6, C.navy);
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      setTxt(C.white);
      doc.text('FIRMAS Y ACEPTACIÓN', mx + cw / 2, y + sigSectionH / 2 + 4, { align: 'center' });
      y += sigSectionH + 14;

      // Contenedor de firma del cliente
      const sigBoxW = 250;
      const sigBoxH = 100;
      const sigBoxX = mx + (cw - sigBoxW) / 2; // Centrado
      
      // Fondo blanco con borde redondeado en azul oscuro
      filledRoundRect(sigBoxX, y, sigBoxW, sigBoxH + 40, 8, C.white);
      setStroke(C.navy);
      doc.setLineWidth(1.5);
      doc.roundedRect(sigBoxX, y, sigBoxW, sigBoxH + 40, 8, 8, 'S');

      // Área de firma
      const sigAreaY = y + 8;
      filledRoundRect(sigBoxX + 10, sigAreaY, sigBoxW - 20, sigBoxH, 4, '#f0f4f8');
      setStroke(C.divider);
      doc.setLineWidth(0.5);
      doc.roundedRect(sigBoxX + 10, sigAreaY, sigBoxW - 20, sigBoxH, 4, 4, 'S');

      // Dibujar firma si existe
      if (service.firma) {
        try {
          let imageData = service.firma;
          if (!imageData.startsWith('data:')) {
            imageData = 'data:image/png;base64,' + imageData;
          }
          doc.addImage(imageData, 'PNG', sigBoxX + 15, sigAreaY + 5, sigBoxW - 30, sigBoxH - 10);
        } catch (e) {
          // Línea para firmar si hay error
          setStroke(C.divider);
          doc.setLineWidth(1);
          doc.line(sigBoxX + 30, sigAreaY + sigBoxH / 2, sigBoxX + sigBoxW - 30, sigAreaY + sigBoxH / 2);
        }
      } else {
        // Línea para firmar si no hay firma
        setStroke(C.divider);
        doc.setLineWidth(1);
        doc.line(sigBoxX + 30, sigAreaY + sigBoxH / 2, sigBoxX + sigBoxW - 30, sigAreaY + sigBoxH / 2);
      }

      // Label "FIRMA DEL CLIENTE" en azul oscuro
      const labelY = sigAreaY + sigBoxH + 8;
      doc.setFont('helvetica','bold');
      doc.setFontSize(8);
      setTxt(C.navy);
      doc.text('FIRMA DEL CLIENTE', sigBoxX + sigBoxW / 2, labelY, { align: 'center' });

      // Nombre de quien recibe debajo
      const nameY = labelY + 12;
      doc.setFont('helvetica','normal');
      doc.setFontSize(8);
      setTxt(C.bodyText);
      doc.text(service.nombreRecibe || '___________________________', sigBoxX + sigBoxW / 2, nameY, { align: 'center' });
    }

    drawFooter(1);

    // Convertir a Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  };

  const handleViewDetail = async (service) => {
    try {
      const blob = await generatePDFFromOrder(service);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Servicios Foráneos</h2>
        {isAdmin && (
          <button
            className="bg-primary text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-primary-dark transition"
            onClick={() => navigate('/servicios-foraneos/crear')}
          >
            Crear orden foránea
          </button>
        )}
      </div>
      <div className="rounded-2xl bg-gradient-to-tr from-primary-100 to-blue-50 shadow-lg p-1 overflow-x-auto animate-fade-in">
        <table className="min-w-full text-base border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-white font-bold bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl">
              <th className="py-3 px-4 rounded-tl-2xl">Folio</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Dirección</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Técnico</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-8 bg-white rounded-b-2xl">
                  No hay servicios foráneos registrados.
                </td>
              </tr>
            )}
            {services.map((service, idx) => (
              <tr
                key={service.folio || service.id}
                className="bg-white border-b border-border last:border-0 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:bg-primary-50"
              >
                <td className="py-4 px-4 font-bold text-dark">{service.folio || '-'}</td>
                <td className="py-4 px-4">{service.clientName || '-'}</td>
                <td className="py-4 px-4">{service.direccion}</td>
                <td className="py-4 px-4">{service.fecha || '-'}</td>
                <td className="py-4 px-4">
                  {isTechnician ? (
                    <span className="font-semibold text-primary-600">{service.tecnico || 'Sin asignar'}</span>
                  ) : (
                    <select
                      value={service.tecnico}
                      onChange={e => handleTecnicoChange(idx, e.target.value)}
                      className={
                        `rounded-xl border border-border px-2 py-1 font-bold bg-primary-100 text-primary-700` +
                        (service.tecnico === '' ? ' bg-gray-100 text-gray-500' : '')
                      }
                    >
                      <option value="">Sin asignar</option>
                      {technicians.map(t => {
                        const name = t.nombre || t.name;
                        return <option key={t.id} value={name}>{name}</option>;
                      })}
                    </select>
                  )}
                </td>
                <td className="py-4 px-4">
                  <select
                    value={service.status}
                    onChange={e => handleEstadoChange(idx, e.target.value)}
                    className="rounded-xl border border-border px-2 py-1 font-bold"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded-lg bg-primary-500 text-white font-semibold shadow-md hover:bg-primary-600 transition-all"
                      onClick={() => handleViewDetail(service)}
                    >
                      Ver detalle
                    </button>

                    {isAdmin && (
                      <button
                        className="px-3 py-1 rounded-lg bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 transition-all"
                        onClick={() => navigate('/servicios-foraneos/crear', { state: { order: service } })}
                      >
                        Editar
                      </button>
                    )}

                    {service.status === 'cancelada' && !isTechnician && (
                      <button
                        className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold shadow-md hover:bg-red-600 transition-all"
                        onClick={() => handleDeleteOrder(idx)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-extrabold text-primary-500 mb-2">Firma de recibido</h3>
            <p className="text-sm text-gray-600 mb-4">Captura el nombre de quien recibe y su firma para incluirlo en el PDF.</p>

            <input
              className="w-full px-4 py-3 rounded-xl border border-border bg-white shadow-sm mb-4"
              placeholder="Nombre de quien recibe"
              value={nombreRecibe}
              onChange={e => setNombreRecibe(e.target.value)}
            />

            <div className="mb-4 border-2 border-border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <SignaturePadCanvas ref={signaturePadRef} width={420} height={170} />
            </div>

            <button
              type="button"
              onClick={() => signaturePadRef.current?.clear?.()}
              className="w-full mb-3 px-3 py-2 bg-gray-200 text-dark font-semibold rounded-lg hover:bg-gray-300 transition-all"
            >
              Limpiar firma
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReceiveModal(false);
                  setPendingReceive(null);
                  setNombreRecibe('');
                  signaturePadRef.current?.clear?.();
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!nombreRecibe.trim()) {
                    Swal.fire('Campo obligatorio', 'Captura el nombre de quien recibe.', 'warning');
                    return;
                  }
                  if (signaturePadRef.current?.isEmpty?.()) {
                    Swal.fire('Firma requerida', 'Captura la firma para continuar.', 'warning');
                    return;
                  }

                  try {
                    const canvas = signaturePadRef.current?.getTrimmedCanvas?.() || signaturePadRef.current?.toDataURL?.();
                    const signatureImage = typeof canvas === 'string' ? canvas : canvas?.toDataURL?.();
                    if (!signatureImage) throw new Error('Firma inválida');

                    const current = pendingReceive;
                    setShowReceiveModal(false);
                    setPendingReceive(null);
                    signaturePadRef.current?.clear?.();

                    if (current) {
                      await updateStatusWithReceipt(current.idx, current.newEstado, {
                        nombreRecibe: nombreRecibe.trim(),
                        firma: signatureImage,
                      });
                    }
                    setNombreRecibe('');
                  } catch (_) {
                    Swal.fire('Error', 'No se pudo capturar la firma.', 'error');
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-all"
              >
                Guardar recibido
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
