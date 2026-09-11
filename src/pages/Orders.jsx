
import DashboardLayout from '../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';



import React, { useState } from 'react';
import SignaturePadCanvas from '../components/SignaturePadCanvas';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { generateOrderPdfDoc as sharedGenerateOrderPdfDoc } from '../utils/orderPdf';


const ESTADOS = {
  pendiente: { label: 'Pendiente', bg: 'bg-state-pending/30', text: 'text-state-pending' },
  'Pendiente': { label: 'Pendiente', bg: 'bg-state-pending/30', text: 'text-state-pending' },
  revision: { label: 'En revisión', bg: 'bg-state-review/30', text: 'text-state-review' },
  'Revision': { label: 'En revisión', bg: 'bg-state-review/30', text: 'text-state-review' },
  diagnostico: { label: 'Diagnóstico generado', bg: 'bg-blue-200/20', text: 'text-blue-800' },
  'Diagnostico': { label: 'Diagnóstico generado', bg: 'bg-blue-200/20', text: 'text-blue-800' },
  espera_aprobacion: { label: 'En espera de aprobación', bg: 'bg-yellow-100/20', text: 'text-yellow-700' },
  'Espera_Aprobacion': { label: 'En espera de aprobación', bg: 'bg-yellow-100/20', text: 'text-yellow-700' },
  reparacion: { label: 'En reparación', bg: 'bg-state-repair/30', text: 'text-state-repair' },
  'Reparacion': { label: 'En reparación', bg: 'bg-state-repair/30', text: 'text-state-repair' },
  lista: { label: 'Lista', bg: 'bg-green-500/20', text: 'text-green-600' },
  'Lista': { label: 'Lista', bg: 'bg-green-500/20', text: 'text-green-600' },
  entregada: { label: 'Entregada', bg: 'bg-blue-400/20', text: 'text-blue-500' },
  'Entregada': { label: 'Entregada', bg: 'bg-blue-400/20', text: 'text-blue-500' },
  cancelada: { label: 'Cancelada', bg: 'bg-state-cancelled/30', text: 'text-state-cancelled' },
  'Cancelada': { label: 'Cancelada', bg: 'bg-state-cancelled/30', text: 'text-state-cancelled' },
  eliminada: { label: 'Eliminada', bg: 'bg-gray-300/30', text: 'text-gray-500' },
  'Eliminada': { label: 'Eliminada', bg: 'bg-gray-300/30', text: 'text-gray-500' },
};

const getEstado = (status) => {
  if (!status) return ESTADOS.pendiente;
  const lower = String(status).toLowerCase().trim();
  // Buscar en minúsculas en las claves
  for (const [key, value] of Object.entries(ESTADOS)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }
  return null;
};

const parseImagenes = (imagenes) => {
  if (Array.isArray(imagenes)) return imagenes;
  if (typeof imagenes === 'string') {
    try {
      const parsed = JSON.parse(imagenes);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

const ORDERS_NAV_CONTEXT_KEY = 'orders_nav_context';
const PAGE_SIZE = 20;

const getDashboardScrollContainer = () => document.getElementById('dashboard-scroll-container');

const getScrollSnapshot = () => {
  const scrollContainer = getDashboardScrollContainer();
  const docY = document.documentElement?.scrollTop || document.body?.scrollTop || 0;
  return {
    windowY: window.scrollY || window.pageYOffset || 0,
    docY,
    containerScrollTop: scrollContainer ? scrollContainer.scrollTop : 0,
  };
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
  const isMostrador = normalizedRole === 'mostrador';
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
  const [imageOrder, setImageOrder] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [savingImages, setSavingImages] = useState(false);
  const [highlightedFolio, setHighlightedFolio] = useState(null);
  const [page, setPage] = useState(1);
  const signaturePadRef = React.useRef();
  const hasRestoredScrollRef = React.useRef(false);

  const handleOpenOrderDetail = (folio) => {
    const snapshot = getScrollSnapshot();

    try {
      sessionStorage.setItem(ORDERS_NAV_CONTEXT_KEY, JSON.stringify({
        ...snapshot,
        folio,
        timestamp: Date.now(),
      }));
    } catch (_) {
      // ignore storage issues
    }

    navigate(`/admin/orders/${folio}`);
  };

  const openImagesModal = (order) => {
    setImageOrder(order);
    setExistingImages(parseImagenes(order.imagenes));
    setNewImageFiles([]);
    setNewImagePreviews([]);
  };

  const closeImagesModal = () => {
    setImageOrder(null);
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setSavingImages(false);
  };

  const handleAddImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const usedSlots = existingImages.length + newImageFiles.length;
    const remaining = Math.max(0, 2 - usedSlots);

    if (remaining <= 0) {
      Swal.fire('Límite alcanzado', 'Solo puedes guardar máximo 2 imágenes por orden.', 'warning');
      event.target.value = '';
      return;
    }

    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      Swal.fire('Límite de imágenes', `Solo se agregaron ${remaining} imagen(es). Máximo 2 por orden.`, 'warning');
    }

    setNewImageFiles(prev => [...prev, ...accepted]);
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveImages = async () => {
    if (!imageOrder) return;
    setSavingImages(true);
    try {
      let uploadedPaths = [];

      if (newImageFiles.length > 0) {
        const formData = new FormData();
        newImageFiles.forEach((file) => formData.append('images', file));
        const uploadRes = await fetch('/api/orders/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('No se pudieron subir las imágenes');
        const uploadData = await uploadRes.json();
        uploadedPaths = Array.isArray(uploadData.imagenes) ? uploadData.imagenes : [];
      }

      const finalImages = [...existingImages, ...uploadedPaths].slice(0, 2);

      const saveRes = await fetch(`/api/orders/${imageOrder.folio}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenes: finalImages }),
      });
      if (!saveRes.ok) throw new Error('No se pudieron guardar las imágenes en la orden');

      setOrders(prev => prev.map(ord => (
        ord.folio === imageOrder.folio ? { ...ord, imagenes: finalImages } : ord
      )));

      Swal.fire('Guardado', 'Las imágenes se guardaron correctamente.', 'success');
      closeImagesModal();
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudieron guardar las imágenes.', 'error');
    } finally {
      setSavingImages(false);
    }
  };

const generateOrderPdfDoc = async (order) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const terminos = [
    '1) SIEEG no se responsabiliza en caso el equipo presente daños por mal uso de terceros o a nivel software y/o hardware antes de su ingreso a reparación.',
    '2) El cliente acepta pagar todas las piezas y mano de obra al finalizar la reparación.',
    '3) La fecha estimada de finalización está sujeta a cambios según la disponibilidad de piezas.',
    '4) El taller de reparación no es responsable de ninguna pérdida de datos en equipos electrónicos.',
    '5) Si la reparación requiere trabajos y/o piezas que no se hayan especificado anteriormente, SIEEG indicará un presupuesto actualizado.',
    '6) Una vez notificado, el equipo se almacena sin coste 10 días hábiles. Después, aplica cargo por almacenamiento.',
    '7) De considerarse abandonado, SIEEG podrá tomar propiedad del equipo en compensación de costos de almacenamiento.',
    '8) La garantía sobre reparaciones es válida solo en mano de obra a partir de la fecha de finalización.',
  ];

  const statusKey = order.status || order.estado || 'pendiente';
  const statusLabel = getEstado(statusKey)?.label || statusKey;
  const details = order.description || order.detalles || order.observaciones || 'No especificado';
  const total = typeof order.resumen?.total === 'number' ? `$${order.resumen.total.toFixed(2)}` : '$0.00';

  // ── Paleta ──────────────────────────────────────────────────────
  const C = {
    primary:     '#1a3a5e',
    primaryMid:  '#162f50',
    primaryDark: '#0f2440',
    primaryLight: '#2e5f9e',
    accent:      '#4a90d9',
    white:       '#FFFFFF',
    offWhite:    '#F7FAFC',
    border:      '#CBD5E0',
    labelGray:   '#6b7a99',
    bodyText:    '#1A202C',
    mutedText:   '#a8c4e0',
    mutedText2:  '#6a8faf',
    subtleBlue:  '#eef2f7',
  };

  const rgb = (hex) => [
    parseInt(hex.slice(1,3),16),
    parseInt(hex.slice(3,5),16),
    parseInt(hex.slice(5,7),16),
  ];
  const setFill   = (hex) => doc.setFillColor(...rgb(hex));
  const setStroke = (hex) => doc.setDrawColor(...rgb(hex));
  const setTxt    = (hex) => doc.setTextColor(...rgb(hex));
  const fillRect  = (x,y,w,h,c)          => { setFill(c);   doc.rect(x,y,w,h,'F'); };
  const fillRR    = (x,y,w,h,r,c)        => { setFill(c);   doc.roundedRect(x,y,w,h,r,r,'F'); };
  const strokeRR  = (x,y,w,h,r,c,lw=0.5)=> { setStroke(c); doc.setLineWidth(lw); doc.roundedRect(x,y,w,h,r,r,'S'); };

  // ── Logo ────────────────────────────────────────────────────────
  const getLogoBase64 = (src) => new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = '';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  const logoBase64 = await getLogoBase64('/images/logo.ico');

  // ════════════════════════════════════════════════════════════════
  //  FONDO GENERAL
  // ════════════════════════════════════════════════════════════════
  fillRect(0, 0, W, H, C.offWhite);

  // ════════════════════════════════════════════════════════════════
  //  HEADER ejecutivo — azul corporativo #1a3a5e
  // ════════════════════════════════════════════════════════════════
  const hdrH = 100;

  // Fondo principal del header
  fillRect(0, 0, W, hdrH, C.primary);

  // Franja superior decorativa muy sutil
  fillRect(0, 0, W, 3, C.primaryLight);

  // Panel izquierdo ligeramente más oscuro (donde va el logo)
  fillRect(0, 0, 88, hdrH, C.primaryMid);
  // Separador vertical sutil entre panel logo y texto
  fillRect(88, 0, 1.5, hdrH, C.primaryLight);

  // Línea de cierre inferior del header (doble)
  fillRect(0, hdrH - 4, W, 4, C.primaryDark);
  fillRect(0, hdrH - 2, W, 2, C.primaryLight);

  // Logo centrado en el panel izquierdo
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 20, 58, 58);
  }

  // Nombre de la empresa
  const txtX = 104;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setTxt(C.white);
  doc.text('Ingeniería y Telecomunicaciones', txtX, 42);

  // Línea de acento bajo el nombre
  fillRect(txtX, 46, 248, 1.5, C.accent);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTxt(C.mutedText);
  doc.text('SIEEG  ·  Soluciones Tecnológicas Integrales', txtX, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTxt(C.mutedText2);
  doc.text('Blvd. Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chis.', txtX, 74);
  doc.text('Tel: 961 118 0157   ·   WhatsApp: 961 333 6529', txtX, 85);

  // ── Badge "ORDEN DE SERVICIO" (esquina derecha) ──────────────────
  const tagW = 148, tagH = 64, tagX = W - tagW - 24, tagY = 17;

  // Badge completamente en azul oscuro (estilo unificado)
  fillRR(tagX, tagY, tagW, tagH, 5, C.primary);
  setStroke(C.primaryLight); doc.setLineWidth(1.1);
  doc.roundedRect(tagX, tagY, tagW, tagH, 5, 5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setTxt(C.white);
  doc.text('ORDEN DE SERVICIO', tagX + tagW / 2, tagY + 15, { align: 'center' });

  // Folio grande en blanco
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  setTxt(C.white);
  doc.text(String(order.folio || '—'), tagX + tagW / 2, tagY + 50, { align: 'center' });

  // Línea decorativa bajo el folio
  setStroke(C.primaryLight); doc.setLineWidth(0.5);
  doc.line(tagX + 16, tagY + 57, tagX + tagW - 16, tagY + 57);

  // ════════════════════════════════════════════════════════════════
  //  SUBHEADER — banda de info rápida
  // ════════════════════════════════════════════════════════════════
  const subY = hdrH + 8;
  const subH = 46;

  fillRR(18, subY, W - 36, subH, 5, C.white);
  strokeRR(18, subY, W - 36, subH, 5, C.border, 0.5);

  const fechaFmt = String(order.fecha || '').includes('-')
    ? String(order.fecha).split('-').reverse().join('/')
    : (order.fecha || '—');

  // Folio
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
  doc.text('FOLIO', 34, subY + 15);
  doc.setFont('helvetica','bold'); doc.setFontSize(14); setTxt(C.primary);
  doc.text(String(order.folio || '—'), 34, subY + 34);

  setStroke(C.border); doc.setLineWidth(0.5);
  doc.line(132, subY + 9, 132, subY + subH - 9);

  // Fecha de ingreso
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
  doc.text('FECHA DE INGRESO', 146, subY + 15);
  doc.setFont('helvetica','normal'); doc.setFontSize(10.5); setTxt(C.bodyText);
  doc.text(fechaFmt, 146, subY + 33);

  doc.line(W / 2 + 10, subY + 9, W / 2 + 10, subY + subH - 9);

  // Estado — pill corporativo
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
  doc.text('ESTADO DE LA ORDEN', W / 2 + 24, subY + 15);
  const pillX = W / 2 + 24, pillY = subY + 20, pillW = 120, pillH = 18;
  fillRR(pillX, pillY, pillW, pillH, 9, C.subtleBlue);
  strokeRR(pillX, pillY, pillW, pillH, 9, C.primary, 0.7);
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); setTxt(C.primary);
  doc.text(statusLabel.toUpperCase(), pillX + pillW / 2, pillY + 12, { align: 'center' });

  // ════════════════════════════════════════════════════════════════
  //  HELPERS — sección y campos
  // ════════════════════════════════════════════════════════════════
  const mx  = 18;
  const cw  = W - mx * 2;
  let y     = subY + subH + 14;
  const gap = 6;

  const sectionHeader = (label, sx, sy, sw) => {
    fillRR(sx, sy, sw, 21, 4, C.primary);
    fillRR(sx, sy, 5, 21, 2, C.accent);
    doc.setFont('helvetica','bold'); doc.setFontSize(8); setTxt(C.white);
    doc.text(label.toUpperCase(), sx + 15, sy + 14);
    return sy + 21;
  };

  const fieldCell = (label, value, fx, fy, fw, fh = 33) => {
    fillRR(fx, fy, fw, fh, 4, C.white);
    strokeRR(fx, fy, fw, fh, 4, C.border, 0.4);
    // Línea de acento superior muy sutil
    fillRR(fx, fy, fw, 2.5, 1, C.accent + '55');

    doc.setFont('helvetica','bold'); doc.setFontSize(6); setTxt(C.labelGray);
    doc.text(label.toUpperCase(), fx + 8, fy + 12);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setTxt(C.bodyText);
    const lines = doc.splitTextToSize(String(value || '—'), fw - 16);
    doc.text(lines[0] || '—', fx + 8, fy + 25);
  };

  const drawFooter = (pageNum, totalPages) => {
    fillRect(0, H - 42, W, 42, C.primary);
    fillRect(0, H - 42, W, 2, C.primaryLight);

    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); setTxt(C.mutedText);
    doc.text(
      'Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas',
      W / 2, H - 22, { align: 'center' }
    );
    doc.text(
      'Tel: 961 118 0157  ·  WhatsApp: 961 333 6529  ·  SIEEG Ingeniería y Telecomunicaciones',
      W / 2, H - 10, { align: 'center' }
    );

    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.mutedText);
    doc.text(`Pág. ${pageNum} / ${totalPages}`, W - 28, H - 14, { align: 'right' });
  };

  const drawSignatures = (yStart) => {
    const bW = 220, bH = 78;
    const gapSig = 18;
    const leftX  = 34;
    const rightX = leftX + bW + gapSig;

    setStroke(C.border);
    doc.setLineWidth(0.6);

    // Cliente
    fillRR(leftX, yStart, bW, bH, 6, C.offWhite);
    doc.roundedRect(leftX, yStart, bW, bH, 6, 6, 'S');
    if (order.firma) {
      try {
        doc.addImage(order.firma, 'PNG', leftX + 10, yStart + 8, bW - 20, 36);
      } catch (_) {
        // noop
      }
    }
    setStroke(C.primary);
    doc.line(leftX + 12, yStart + 50, leftX + bW - 12, yStart + 50);
    doc.setFont('helvetica','bold');
    doc.setFontSize(7);
    setTxt(C.primary);
    doc.text('FIRMA DEL CLIENTE', leftX + bW / 2, yStart + 60, { align: 'center' });
    doc.setFont('helvetica','normal');
    doc.setFontSize(7);
    setTxt(C.bodyText);
    doc.text(order.clientName || '', leftX + bW / 2, yStart + 69, { align: 'center' });

    // Técnico
    fillRR(rightX, yStart, bW, bH, 6, C.offWhite);
    setStroke(C.border);
    doc.roundedRect(rightX, yStart, bW, bH, 6, 6, 'S');
    setStroke(C.primary);
    doc.line(rightX + 12, yStart + 50, rightX + bW - 12, yStart + 50);
    doc.setFont('helvetica','bold');
    doc.setFontSize(7);
    setTxt(C.primary);
    doc.text('FIRMA DEL TÉCNICO', rightX + bW / 2, yStart + 60, { align: 'center' });
    doc.setFont('helvetica','normal');
    doc.setFontSize(7);
    setTxt(C.bodyText);
    doc.text(order.tecnico || '', rightX + bW / 2, yStart + 69, { align: 'center' });
  };

  // ── Información del Cliente ───────────────────────────────────
  y = sectionHeader('Información del Cliente', mx, y, cw); y += 7;
  const col3 = (cw - gap * 2) / 3;
  fieldCell('Nombre Completo',    order.clientName || '—',  mx,                       y, col3);
  fieldCell('Teléfono',           order.telefono   || '—',  mx + col3 + gap,          y, col3);
  fieldCell('Correo Electrónico', order.correo     || '—',  mx + col3 * 2 + gap * 2, y, col3);
  y += 44;

  // ── Información del Equipo ────────────────────────────────────
  y = sectionHeader('Información del Equipo', mx, y, cw); y += 7;
  const col4 = (cw - gap * 3) / 4;
  fieldCell('Tipo de Equipo', order.tipo   || '—', mx,                       y, col4);
  fieldCell('Marca',          order.marca  || '—', mx + col4 + gap,          y, col4);
  fieldCell('Modelo',         order.modelo || '—', mx + col4 * 2 + gap * 2, y, col4);
  fieldCell('Núm. de Serie',  order.serie  || '—', mx + col4 * 3 + gap * 3, y, col4);
  y += 44;

  // ── Accesorios y Seguridad ────────────────────────────────────
  y = sectionHeader('Accesorios y Seguridad', mx, y, cw); y += 7;
  const half = (cw - gap) / 2;
  const accs = [order.accesorios, order.otrosAccesorios].filter(Boolean).join(', ') || 'Sin accesorios marcados';
  fieldCell('Accesorios Incluidos', accs,                  mx,           y, half);
  fieldCell('Contraseña / PIN',     order.seguridad || '—', mx + half + gap, y, half);
  y += 44;

  // ── Descripción del Problema ──────────────────────────────────
  y = sectionHeader('Descripción del Problema Reportado', mx, y, cw); y += 7;
  const probLines = doc.splitTextToSize(String(details), cw - 24);
  const probH = Math.max(50, probLines.length * 13 + 24);
  fillRR(mx, y, cw, probH, 4, C.white);
  strokeRR(mx, y, cw, probH, 4, C.border, 0.4);
  fillRR(mx, y, cw, 2.5, 1, C.accent + '55');
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setTxt(C.bodyText);
  doc.text(probLines, mx + 10, y + 17);
  y += probH + 14;

  // ── Asignación y Resumen ──────────────────────────────────────
  y = sectionHeader('Asignación y Resumen Económico', mx, y, cw); y += 7;
  const col3b = (cw - gap * 2) / 3;
  fieldCell('Técnico Responsable', order.tecnico || '—', mx,                y, col3b);
  fieldCell('Estado de la Orden',  statusLabel   || '—', mx + col3b + gap, y, col3b);

  // Celda TOTAL — diseño destacado
  const totX = mx + col3b * 2 + gap * 2;
  const totW = col3b;
  fillRR(totX, y, totW, 33, 4, C.primary);
  strokeRR(totX, y, totW, 33, 4, C.primaryLight, 0.8);
  doc.setFont('helvetica','bold'); doc.setFontSize(6); setTxt(C.mutedText);
  doc.text('TOTAL', totX + 8, y + 12);
  doc.setFont('helvetica','bold'); doc.setFontSize(14); setTxt(C.white);
  doc.text(total, totX + totW / 2, y + 27, { align: 'center' });

  drawFooter(1, 2);

  // ════════════════════════════════════════════════════════════════
  //  PAGE 2 — Términos y Firmas
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  fillRect(0, 0, W, H, C.offWhite);
  fillRR(20, 20, W - 40, H - 40, 8, C.white);

  let ty = 40;
  ty = sectionHeader('Términos y Condiciones del Servicio', 34, ty, W - 68);
  ty += 10;

  doc.setFont('helvetica','italic');
  doc.setFontSize(8);
  setTxt(C.labelGray);
  doc.text('Por favor lea cuidadosamente los siguientes términos antes de firmar la orden de servicio.', 38, ty);
  ty += 16;

  terminos.forEach((t, i) => {
    const lines = doc.splitTextToSize(t, W - 100);
    const rowH = lines.length * 11 + 10;
    fillRR(34, ty, W - 68, rowH, 3, i % 2 === 0 ? C.offWhite : C.white);
    setFill(C.primary);
    doc.rect(34, ty, 3, rowH, 'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    setTxt(C.bodyText);
    doc.text(lines, 46, ty + 9);
    ty += rowH + 4;
  });

  ty += 14;
  setStroke(C.border);
  doc.setLineWidth(0.6);
  doc.line(34, ty, W - 34, ty);
  ty += 16;

  ty = sectionHeader('Firmas y Aceptación', 34, ty, W - 68);
  ty += 12;
  drawSignatures(ty);

  drawFooter(2, 2);

  return doc;
};

  const handlePreviewPdf = async (order) => {
    const doc = await sharedGenerateOrderPdfDoc(order);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadPdf = async (order) => {
    const doc = await sharedGenerateOrderPdfDoc(order);
    doc.save(`Orden_${order.folio || 'servicio'}.pdf`);
  };

  React.useEffect(() => {
    let navContext = null;
    try {
      navContext = JSON.parse(sessionStorage.getItem(ORDERS_NAV_CONTEXT_KEY) || 'null');
    } catch (_) {
      navContext = null;
    }

    if (navContext?.folio) {
      setHighlightedFolio(navContext.folio);
    }

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
          return { ...o, resumen, imagenes: parseImagenes(o.imagenes) };
        });
        let filtered = parsed.filter(o => {
          const tipo = String(o.tipo || '').toLowerCase();
          return tipo !== 'foraneo' && tipo !== 'cliente';
        });
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

  React.useEffect(() => {
    if (hasRestoredScrollRef.current || orders.length === 0) return;

    let navContext = null;
    try {
      navContext = JSON.parse(sessionStorage.getItem(ORDERS_NAV_CONTEXT_KEY) || 'null');
    } catch (_) {
      navContext = null;
    }

    if (!navContext) return;

    hasRestoredScrollRef.current = true;

    const restoreScroll = () => {
      const scrollContainer = getDashboardScrollContainer();
      if (scrollContainer && typeof navContext.containerScrollTop === 'number') {
        scrollContainer.scrollTop = navContext.containerScrollTop;
      }

      if (typeof navContext.windowY === 'number') {
        window.scrollTo({ top: navContext.windowY, behavior: 'auto' });
      }

      if (typeof navContext.docY === 'number') {
        document.documentElement.scrollTop = navContext.docY;
        document.body.scrollTop = navContext.docY;
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restoreScroll();
      });
    });

    const retry1 = setTimeout(restoreScroll, 80);
    const retry2 = setTimeout(restoreScroll, 220);
    const retry3 = setTimeout(restoreScroll, 450);

    const clearContextTimer = setTimeout(() => {
      try {
        sessionStorage.removeItem(ORDERS_NAV_CONTEXT_KEY);
      } catch (_) {
        // ignore storage issues
      }
    }, 2200);

    return () => {
      clearTimeout(retry1);
      clearTimeout(retry2);
      clearTimeout(retry3);
      clearTimeout(clearContextTimer);
    };
  }, [orders]);

  React.useEffect(() => {
    if (!highlightedFolio) return;

    const timer = setTimeout(() => setHighlightedFolio(null), 4000);
    return () => clearTimeout(timer);
  }, [highlightedFolio]);

  // Reset página cuando cambian filtros
  React.useEffect(() => { setPage(1); }, [search, estado, tecnico]);

  // Obtener técnicos únicos (ya no se usa, pero lo dejamos para el filtro por técnico)
  const tecnicos = Array.from(new Set(orders.map(o => o.tecnico)));

  // Filtrado en tiempo real y orden descendente por fecha (más recientes primero)
  const filtered = orders
    .filter(o => {
      const equipoStr = [o.marca, o.modelo, o.serie].filter(Boolean).join(' ').toLowerCase();
      const matchSearch =
        !search ||
        o.folio?.toLowerCase().includes(search.toLowerCase()) ||
        o.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        equipoStr.includes(search.toLowerCase());
      // Filtro robusto: compara usando getEstado para obtener la clave normalizada
      // Filtro robusto: obtener la clave exacta del estado
      let estadoKey = '';
      for (const [key, value] of Object.entries(ESTADOS)) {
        if (key === key.toLowerCase() && value.label === (getEstado(o.status || o.estado)?.label)) {
          estadoKey = key;
          break;
        }
      }
      const matchEstado = !estado || estadoKey === estado;
      const matchTecnico = !tecnico || o.tecnico === tecnico;
      // Si es técnico, solo ve sus órdenes
      if (normalizedRole === 'tecnico') {
        return matchSearch && matchEstado && o.tecnico === currentUserName;
      }
      return matchSearch && matchEstado && matchTecnico;
    })
    .sort((a, b) => {
      const fechaA = a.fecha || '';
      const fechaB = b.fecha || '';
      if (fechaA !== fechaB) return fechaB > fechaA ? 1 : -1;
      const createdA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const createdB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      const diff = createdB - createdA;
      return diff !== 0 ? diff : (Number(b.id) - Number(a.id));
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  return (
    <DashboardLayout>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Órdenes de Servicio</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length === 0 ? 'Sin resultados' : `${pageStart}–${pageEnd} de ${filtered.length} orden${filtered.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
        {(isAdmin || isMostrador) && (
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-sm transition-all duration-150 text-sm active:scale-95"
            onClick={() => navigate('/admin/orders/create')}
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Orden
          </button>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-300 outline-none transition-all"
            placeholder="Buscar por folio, cliente, equipo o marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-primary-200 outline-none"
          value={estado}
          onChange={e => setEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS)
            .filter(([key]) => key === key.toLowerCase())
            .map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
        </select>
        {!isTechnician && (
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-primary-200 outline-none"
            value={tecnico}
            onChange={e => setTecnico(e.target.value)}
          >
            <option value="">Todos los técnicos</option>
            {allTechnicians.map(t => (
              <option key={t.id} value={t.nombre || t.name}>{t.nombre || t.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-left">
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Folio</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Equipo</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Técnico</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium">No hay órdenes que coincidan</span>
                    </div>
                  </td>
                </tr>
              )}
              {paginated.map((o) => {
                const estadoInfo = getEstado(o.status || o.estado);
                return (
                  <tr
                    key={o.folio}
                    className={`group hover:bg-gray-50 transition-colors duration-150 ${highlightedFolio === o.folio ? 'bg-amber-50 ring-1 ring-inset ring-amber-300' : ''}`}
                  >
                    {/* Folio */}
                    <td className="py-3.5 px-4 align-middle">
                      <span className="font-mono font-bold text-primary-600 text-sm">{o.folio}</span>
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 align-middle">
                      <span className="text-gray-600 text-sm">{o.fecha}</span>
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4 align-middle">
                      <span className="font-semibold text-gray-800 text-sm">{o.clientName}</span>
                    </td>

                    {/* Equipo */}
                    <td className="py-3.5 px-4 align-middle">
                      <span className="text-gray-600 text-sm lowercase">{[o.marca, o.modelo, o.serie].filter(Boolean).join(' ')}</span>
                    </td>

                    {/* Técnico */}
                    <td className="py-3.5 px-4 align-middle">
                      {!isAdmin || ['cancelada', 'eliminada'].includes(o.status || o.estado) ? (
                        <span className="text-gray-700 text-sm font-medium">{o.tecnico}</span>
                      ) : (
                        <select
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          value={o.tecnico}
                          onChange={async e => {
                            const newTecnico = e.target.value;
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

                    {/* Estado */}
                    <td className="py-3.5 px-4 align-middle">
                      {!isAdmin ? (
                        estadoInfo ? (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${estadoInfo.bg} ${estadoInfo.text}`}>
                            {estadoInfo.label}
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Desconocido</span>
                        )
                      ) : ['cancelada', 'eliminada'].includes(o.status || o.estado) ? (
                        estadoInfo ? (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${estadoInfo.bg} ${estadoInfo.text}`}>
                            {estadoInfo.label}
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Desconocido</span>
                        )
                      ) : (
                        <select
                          className={`px-2.5 py-1 rounded-full border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-200 ${(estadoInfo?.bg || 'bg-gray-100')} ${(estadoInfo?.text || 'text-gray-500')} border-current`}
                          value={o.status || o.estado}
                          onChange={async e => {
                            const newEstado = e.target.value;
                            if (newEstado === 'entregada') {
                              setEntregaOrderFolio(o.folio);
                            } else {
                              setOrders(prev => prev.map((ord) => ord.folio === o.folio ? { ...ord, status: newEstado, estado: newEstado } : ord));
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
                            .filter(([key]) => key === key.toLowerCase())
                            .filter(([key]) => key !== 'cancelada' && key !== 'eliminada')
                            .map(([key, val]) => (
                              <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 align-middle">
                      <span className="font-semibold text-gray-800 text-sm">{typeof o.resumen?.total === 'number' ? `$${o.resumen.total.toFixed(2)}` : '$0.00'}</span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                          title={isAdmin || isMostrador ? 'Ver detalle' : 'Ver PDF'}
                          onClick={() => (isAdmin || isMostrador ? handleOpenOrderDetail(o.folio) : handlePreviewPdf(o))}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all"
                          title="Descargar PDF"
                          onClick={() => handleDownloadPdf(o)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v12" />
                          </svg>
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-700 hover:bg-green-500 hover:text-white transition-all"
                          title="Subir/Tomar imágenes"
                          onClick={() => openImagesModal(o)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3l1.2-1.4A2 2 0 0110.7 3h2.6a2 2 0 011.5.6L16 5h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </button>
                        {isAdmin && (
                          <>
                            {(o.status || o.estado) === 'cancelada' ? (
                              <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-400 hover:text-white transition-all"
                                title="Eliminar"
                                onClick={() => {
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
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 4h4a1 1 0 011 1v2H9V5a1 1 0 011-1z" />
                                </svg>
                              </button>
                            ) : (o.status || o.estado) === 'eliminada' ? null : (
                              <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                title="Cancelar"
                                onClick={() => setCancelOrderFolio(o.folio)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...'
                ? <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                : <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold border transition-all ${safePage === item ? 'bg-primary-500 text-white border-primary-500 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >{item}</button>
            )
          }
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* ── Modal cancelación ── */}
      {cancelOrderFolio !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Cancelar orden</h3>
                <p className="text-xs text-gray-400">Indica el motivo de la cancelación</p>
              </div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <textarea
                className="w-full min-h-[90px] rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none resize-none"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Motivo de cancelación..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={() => { setCancelOrderFolio(null); setCancelReason(''); }}
                >
                  Volver
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
                  disabled={!cancelReason.trim()}
                  onClick={async () => {
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
                  }}
                >
                  Confirmar cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal entrega ── */}
      {entregaOrderFolio !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 touch-none px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col" style={{ maxWidth: '680px', maxHeight: '92vh' }}>
            {/* Header fijo */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Entregar orden</h3>
                <p className="text-xs text-gray-400">Registra quién recibe el equipo</p>
              </div>
            </div>
            {/* Contenido con scroll */}
            <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de quien recibe</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Nombre completo..."
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Firma del cliente
                  {signatureData && <span className="ml-2 text-xs text-green-600 font-normal">✓ Capturada</span>}
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center p-3">
                  <SignaturePadCanvas
                    ref={signaturePadRef}
                    width={580}
                    height={180}
                    style={{ touchAction: 'none', width: '100%', height: '180px', borderRadius: 8, background: 'white', boxShadow: '0 1px 4px #0001', display: 'block' }}
                    onEnd={() => {
                      const canvas = signaturePadRef.current.getTrimmedCanvas();
                      setSignatureData(canvas.toDataURL());
                    }}
                  />
                  <button
                    type="button"
                    className="mt-2 px-4 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-all"
                    onClick={() => { signaturePadRef.current.clear(); setSignatureData(null); }}
                  >
                    Limpiar firma
                  </button>
                  <p className="text-xs text-gray-400 mt-1 text-center">Dibuja la firma con el dedo o con el mouse</p>
                </div>
              </div>
            </div>
            {/* Botones fijos abajo */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end flex-shrink-0">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                onClick={() => {
                  setEntregaOrderFolio(null);
                  setRecipientName('');
                  setSignatureData(null);
                  if (signaturePadRef.current) signaturePadRef.current.clear();
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
                disabled={!recipientName.trim() || !signatureData}
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/orders/${entregaOrderFolio}/estado`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estado: 'entregada', firma: signatureData, nombreRecibe: recipientName })
                    });
                    if (!res.ok) throw new Error('No se pudo registrar la entrega en el servidor');
                    setOrders(prev => prev.map((ord) => ord.folio === entregaOrderFolio ? { ...ord, status: 'entregada', estado: 'entregada', firma: signatureData, nombreRecibe: recipientName } : ord));
                    setEntregaOrderFolio(null);
                    setRecipientName('');
                    setSignatureData(null);
                    if (signaturePadRef.current) signaturePadRef.current.clear();
                  } catch (err) {
                    Swal.fire('Error', 'No se pudo registrar la entrega en el servidor', 'error');
                  }
                }}
              >
                Confirmar entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal imágenes ── */}
      {imageOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3l1.2-1.4A2 2 0 0110.7 3h2.6a2 2 0 011.5.6L16 5h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Evidencia fotográfica</h3>
                  <p className="text-xs text-gray-400">Orden {imageOrder.folio} · máx. 2 imágenes</p>
                </div>
              </div>
              <button onClick={closeImagesModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Subir desde galería
                  <input type="file" accept="image/*" multiple onChange={handleAddImages} className="hidden" />
                </label>
                <label className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3l1.2-1.4A2 2 0 0110.7 3h2.6a2 2 0 011.5.6L16 5h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Tomar con cámara
                  <input type="file" accept="image/*" capture="environment" onChange={handleAddImages} className="hidden" />
                </label>
              </div>

              {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {existingImages.map((img, idx) => (
                    <div key={`old-${idx}`} className="relative group">
                      <img src={img} alt={`Evidencia ${idx + 1}`} className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >×</button>
                    </div>
                  ))}
                  {newImagePreviews.map((preview, idx) => (
                    <div key={`new-${idx}`} className="relative group">
                      <img src={preview} alt={`Nueva ${idx + 1}`} className="w-full h-24 object-cover rounded-xl border-2 border-green-300" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeImagesModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                  disabled={savingImages}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveImages}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                  disabled={savingImages}
                >
                  {savingImages ? 'Guardando...' : 'Guardar imágenes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Orders;
