import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SignaturePadCanvas from '../components/SignaturePadCanvas';
import PatternLock from '../components/PatternLock';
import DashboardLayout from '../layouts/DashboardLayout';
import { useEffect } from 'react';
import { generateOrderPdfDoc } from '../utils/orderPdf';

const accesoriosList = ['Cargador', 'SIM Card', 'Bandeja SIM', 'Memoria SD', 'Funda', 'Cable'];

const getToday = () => new Date().toISOString().slice(0, 10);
const generarFolio = () => 'S' + new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 11);

const initialState = {
  nombre: '',
  telefono: '',
  correo: '',
  tipo: '',
  marca: '',
  modelo: '',
  serie: '',
  accesorios: [],
  otrosAccesorios: '',
  seguridad: '',
  patron: [],
  tecnico: '',
  problema: '',
  observaciones: '',
};

const CreateOrder = () => {
  const [form, setForm] = useState(initialState);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [signature, setSignature] = useState(null);
  const sigPadRef = useRef();
  const folio = generarFolio();
  const fecha = getToday();
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  // Técnicos desde usuarios con rol 'Técnico'
  const [tecnicos, setTecnicos] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        // Filtra solo usuarios con rol 'Técnico' (case-insensitive)
        setTecnicos(data.filter(u => (u.rol || '').toLowerCase() === 'técnico'));
      })
      .catch(() => setTecnicos([]));
  }, []);

  const validate = () => {
    const errors = {};
    if (!form.nombre) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(form.nombre)) {
      errors.nombre = 'Solo letras y espacios';
    }
    if (form.correo && !/^([a-zA-Z0-9_\-.+]+)@([a-zA-Z0-9\-.]+)\.([a-zA-Z]{2,})$/.test(form.correo)) {
      errors.correo = 'Correo inválido';
    }
    if (!form.tipo) errors.tipo = 'El tipo de equipo es obligatorio';
    if (!form.marca) errors.marca = 'La marca es obligatoria';
    if (!form.modelo) errors.modelo = 'El modelo es obligatorio';
    if (!form.serie) errors.serie = 'El número de serie es obligatorio';
    if (!form.problema) errors.problema = 'Describe el problema';
    if (!form.tecnico) errors.tecnico = 'Selecciona un técnico';
    const tienePatron = form.patron && form.patron.length >= 3;
    const tienePin = form.seguridad && form.seguridad.trim().length > 0;
    if (tienePatron && !tienePin) {
      errors.seguridad = 'Si ingresas un patrón, la contraseña es obligatoria';
    }
    if (!tienePatron && !tienePin) {
      errors.seguridad = 'Debes ingresar un PIN o un patrón de desbloqueo';
    }
    return errors;
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm({
        ...form,
        accesorios: checked
          ? [...form.accesorios, value]
          : form.accesorios.filter(a => a !== value),
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handlePatternChange = (pattern) => {
    setTimeout(() => {
      setForm(f => ({ ...f, patron: pattern }));
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errorsObj = validate();
    setTouched(Object.keys(errorsObj).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    if (Object.keys(errorsObj).length > 0) {
      setError('Por favor, completa todos los campos obligatorios correctamente.');
      window.Swal && window.Swal.fire({ icon: 'error', title: 'Campos incompletos', text: 'Completa todos los campos obligatorios.' });
      return;
    }
    setError('');
    setShowTerms(true);
  };

  const handleAcceptTerms = async () => {
    if (!signature) {
      window.Swal && window.Swal.fire({ icon: 'error', title: 'Falta la firma', text: 'Por favor, firma para aceptar los términos.' });
      return;
    }
    setShowTerms(false);
    setLoading(true);
    // Guardar orden en la API
    const payload = {
      folio,
      fecha,
      clientName: form.nombre,
      telefono: form.telefono,
      correo: form.correo,
      tipo: form.tipo,
      marca: form.marca,
      modelo: form.modelo,
      serie: form.serie,
      accesorios: form.accesorios.join(','),
      otrosAccesorios: form.otrosAccesorios,
      seguridad: form.seguridad,
      patron: JSON.stringify(form.patron),
      description: form.problema,
      observaciones: form.observaciones,
      firma: signature,
      status: 'Pendiente',
      technicianId: form.tecnico ? parseInt(form.tecnico) : null,
    };
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error al guardar la orden');
      // Solo generar PDF si la orden se guardó correctamente
      const doc = await generateOrderPdfDoc({
        ...form,
        clientName: form.nombre,
        nombre: form.nombre,
        fecha,
        folio,
        firma: signature,
        description: form.problema,
        accesorios: form.accesorios,
      });
      const pdfBlobUrl = URL.createObjectURL(doc.output('blob'));
      window.open(pdfBlobUrl, '_blank');
      setPdfUrl(null);
      setShowPdfPreview(false);
      setLoading(false);
      setSuccess('Orden generada correctamente');
      setError('');
      setForm(initialState);
      setTouched({});
      setSignature(null);
    } catch (err) {
      setLoading(false);
      setError('No se pudo guardar la orden. Intenta de nuevo.');
      window.Swal && window.Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la orden. Intenta de nuevo.' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PDF GENERATION — diseño profesional rediseñado
  // ─────────────────────────────────────────────────────────────────────────────
  const generateOrderPdf = async () => {

    const terminos = [
      '1) SIEEG no se responsabiliza en caso el equipo presente daños por mal uso de terceros o a nivel software y/o hardware antes de su ingreso a reparación.',
      '2) El cliente acepta pagar todas las piezas y mano de obra al finalizar la reparación.',
      '3) La fecha estimada de finalización está sujeta a cambios según la disponibilidad de piezas.',
      '4) El taller de reparación no es responsable de ninguna pérdida de datos en equipos electrónicos.',
      '5) Si la reparación requiere trabajos y/o piezas que no se hayan especificado anteriormente, SIEEG indicará un presupuesto actualizado, en caso de no autorizarlo no se realizará ninguna reparación.',
      '6) SIEEG te notificará una vez que tu producto esté reparado y listo para su entrega, este mismo se almacenará sin coste durante los primeros 10 días hábiles. Después de 10 días, si no se ha retirado el dispositivo, se cobrará los gastos de almacenamiento. El gasto de almacenamiento equivale a $50.00 por día.',
      '7) Una vez el producto se considere abandonado, SIEEG tomará la propiedad del mismo en compensación de los costos de almacenamiento.',
      '8) La garantía sobre reparaciones es válida solo en la mano de obra a partir de la fecha de finalización.',
    ];

    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();   // 595.28
    const H = doc.internal.pageSize.getHeight();  // 841.89

    // ── Palette ──────────────────────────────────────────────────────────────
    const C = {
      navy:       '#1a3a5e',
      blue:       '#1a3a5e',
      blueLight:  '#1a3a5e',
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

    // Rounded filled rect helper
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
      // Recuadro a la derecha en azul oscuro
      const boxW = 120, boxH = 28;
      const boxX = W - boxW - 50, boxY = logoY + 6;
      filledRoundRect(boxX, boxY, boxW, boxH, 7, C.navy);
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      setTxt(C.white);
      doc.text('ORDEN DE SERVICIO', boxX + boxW / 2, boxY + boxH / 2 + 3, { align: 'center' });
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
      doc.text(`Página ${pageNum} de 2`, W - 34, H - 16, { align: 'right' });
    };

    // ── SIGNATURE BLOCKS ──────────────────────────────────────────────────────
    const drawSignatures = (yStart) => {
      const bW = 180, bH = 64;
      const leftX  = 40;
      const rightX = W - 40 - bW;
      setStroke(C.divider);
      doc.setLineWidth(0.6);
      filledRoundRect(leftX, yStart, bW, bH, 4, C.bg);
      doc.roundedRect(leftX, yStart, bW, bH, 4, 4, 'S');
      if (signature) {
        doc.addImage(signature, 'PNG', leftX + 10, yStart + 6, bW - 20, 34);
      }
      setStroke(C.navy);
      doc.setLineWidth(0.6);
      doc.line(leftX + 14, yStart + 46, leftX + bW - 14, yStart + 46);
      doc.setFont('helvetica','bold');
      doc.setFontSize(7);
      setTxt(C.navy);
      doc.text('FIRMA DEL CLIENTE', leftX + bW / 2, yStart + 56, { align: 'center' });
      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      setTxt(C.bodyText);
      doc.text(form.nombre || '', leftX + bW / 2, yStart + 64, { align: 'center' });
      filledRoundRect(rightX, yStart, bW, bH, 4, C.bg);
      doc.setLineWidth(0.6);
      setStroke(C.divider);
      doc.roundedRect(rightX, yStart, bW, bH, 4, 4, 'S');
      setStroke(C.navy);
      doc.line(rightX + 14, yStart + 46, rightX + bW - 14, yStart + 46);
      doc.setFont('helvetica','bold');
      doc.setFontSize(7);
      setTxt(C.navy);
      doc.text('FIRMA DEL TÉCNICO', rightX + bW / 2, yStart + 56, { align: 'center' });
      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      setTxt(C.bodyText);
      doc.text(form.tecnico || '', rightX + bW / 2, yStart + 64, { align: 'center' });
    };

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 1
    // ════════════════════════════════════════════════════════════════════════
    drawPageBg();
    drawHeader();

    const mx = 34;
    const cw = W - mx*2;
    let y = 100;

    y += 12;
    const strip2W = (cw - 8) / 2;
    filledRoundRect(mx, y, cw, 38, 5, C.bg);
    setStroke(C.divider);
    doc.setLineWidth(0.4);
    doc.roundedRect(mx, y, cw, 38, 5, 5, 'S');
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelText);
    doc.text('FOLIO', mx + 10, y + 11);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); setTxt(C.navy);
    doc.text(folio, mx + 10, y + 27);
    const fechaFmt = fecha.split('-').reverse().join('/');
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelText);
    doc.text('FECHA DE INGRESO', mx + strip2W + 10, y + 11);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); setTxt(C.bodyText);
    doc.text(fechaFmt, mx + strip2W + 10, y + 27);
    y += 52;
    y = sectionHeader('Información del Cliente', mx, y, cw);
    y += 8;
    const col3 = (cw - 12) / 3;
    fieldCell('Nombre Completo', form.nombre, mx,               y, col3);
    fieldCell('Teléfono',        form.telefono, mx + col3 + 6,  y, col3);
    fieldCell('Correo Electrónico', form.correo, mx + col3*2 + 12, y, col3);
    y += 44;
    y = sectionHeader('Información del Equipo', mx, y, cw);
    y += 8;
    const col4 = (cw - 18) / 4;
    fieldCell('Tipo de Equipo', form.tipo,   mx,                    y, col4);
    fieldCell('Marca',          form.marca,  mx + col4 + 6,         y, col4);
    fieldCell('Modelo',         form.modelo, mx + col4*2 + 12,      y, col4);
    fieldCell('Núm. de Serie',  form.serie,  mx + col4*3 + 18,      y, col4);
    y += 44;
    y = sectionHeader('Accesorios y Seguridad', mx, y, cw);
    y += 8;
    const halfW = (cw - 8) / 2;
    const accs = form.accesorios.length > 0 ? form.accesorios.join(', ') : 'Sin accesorios marcados';
    fieldCell('Accesorios Incluidos', accs,         mx,          y, halfW);
    fieldCell('Contraseña / PIN',     form.seguridad, mx + halfW + 8, y, halfW);
    y += 44;
    y = sectionHeader('Descripción de la Falla', mx, y, cw);
    y += 8;
    const probLines = doc.splitTextToSize(form.problema || '—', cw - 24);
    const probH = Math.max(44, probLines.length * 13 + 18);
    filledRoundRect(mx, y, cw, probH, 4, C.bg);
    setStroke(C.divider);
    doc.setLineWidth(0.4);
    doc.roundedRect(mx, y, cw, probH, 4, 4, 'S');
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelText);
    doc.text('PROBLEMA REPORTADO', mx + 8, y + 10);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setTxt(C.bodyText);
    doc.text(probLines, mx + 8, y + 22);
    y += probH + 16;
    y = sectionHeader('Técnico Asignado', mx, y, cw);
    y += 8;
    fieldCell('Técnico Responsable', form.tecnico, mx, y, cw / 2);
    y += 44;
    drawFooter(1);
    doc.addPage();
    drawPageBg();
    drawHeader();
    let ty = 110;
    ty = sectionHeader('Términos y Condiciones del Servicio', mx, ty, cw);
    ty += 12;
    doc.setFont('helvetica','italic');
    doc.setFontSize(8);
    setTxt(C.labelText);
    doc.text('Por favor lea cuidadosamente los siguientes términos antes de firmar la orden de servicio.', mx + 4, ty);
    ty += 16;
    terminos.forEach((t, i) => {
      const lines = doc.splitTextToSize(t, cw - 20);
      const rowH  = lines.length * 11 + 10;
      filledRoundRect(mx, ty, cw, rowH, 3, i % 2 === 0 ? C.bg : C.white);
      setFill(C.navy);
      doc.rect(mx, ty, 3, rowH, 'F');
      doc.setFont('helvetica','normal');
      doc.setFontSize(8);
      setTxt(C.bodyText);
      doc.text(lines, mx + 12, ty + 9);
      ty += rowH + 4;
    });
    ty += 16;
    setStroke(C.divider);
    doc.setLineWidth(0.6);
    doc.line(mx, ty, mx + cw, ty);
    ty += 18;
    ty = sectionHeader('Firmas y Aceptación', mx, ty, cw);
    ty += 14;
    drawSignatures(ty);
    drawFooter(2);
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  };

  const errors = validate();

  return (
    <DashboardLayout>
      <form className="max-w-4xl mx-auto w-full pb-6" onSubmit={handleSubmit} autoComplete="off">

        {/* ── Encabezado ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Nueva Orden de Servicio</h2>
            <p className="text-sm text-gray-400 mt-0.5">Completa los campos para registrar el equipo</p>
          </div>
          {/* Chips de meta info */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-mono font-bold text-gray-600">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
              {folio}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-500">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {fecha.split('-').reverse().join('/')}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-50 text-xs font-semibold text-yellow-700 border border-yellow-200">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
              Pendiente
            </span>
          </div>
        </div>

        {/* ── Card: Cliente ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Información del Cliente</h3>
              <p className="text-xs text-gray-400">Datos de contacto del cliente</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre <span className="text-red-400">*</span></label>
              <input
                name="nombre"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.nombre && errors.nombre ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="Nombre completo"
                value={form.nombre}
                onChange={e => {
                  const val = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, '');
                  setForm(f => ({ ...f, nombre: val }));
                }}
                onBlur={handleBlur}
                autoComplete="off"
              />
              {touched.nombre && errors.nombre && <span className="text-red-500 text-xs">{errors.nombre}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</label>
              <input
                name="telefono"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.telefono && errors.telefono ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="10 dígitos"
                value={form.telefono}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setForm(f => ({ ...f, telefono: val }));
                }}
                onBlur={handleBlur}
                maxLength={10}
                autoComplete="off"
              />
              {touched.telefono && errors.telefono && <span className="text-red-500 text-xs">{errors.telefono}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo</label>
              <input
                name="correo"
                type="email"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.correo && errors.correo ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="cliente@ejemplo.com"
                value={form.correo}
                onChange={e => { setForm(f => ({ ...f, correo: e.target.value })); }}
                onBlur={handleBlur}
                autoComplete="off"
              />
              {touched.correo && errors.correo && <span className="text-red-500 text-xs">{errors.correo}</span>}
            </div>
          </div>
        </div>

        {/* ── Card: Equipo ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 21m5.25-4l.75 4M4 4h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Información del Equipo</h3>
              <p className="text-xs text-gray-400">Tipo, marca, modelo y número de serie</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo <span className="text-red-400">*</span></label>
              <input
                name="tipo"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.tipo && errors.tipo ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="Laptop, Celular..."
                value={form.tipo}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.tipo && errors.tipo && <span className="text-red-500 text-xs">{errors.tipo}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marca <span className="text-red-400">*</span></label>
              <input
                name="marca"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.marca && errors.marca ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="HP, Samsung, Apple"
                value={form.marca}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.marca && errors.marca && <span className="text-red-500 text-xs">{errors.marca}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Modelo <span className="text-red-400">*</span></label>
              <input
                name="modelo"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.modelo && errors.modelo ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="Pavilion 15"
                value={form.modelo}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.modelo && errors.modelo && <span className="text-red-500 text-xs">{errors.modelo}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">N.º de Serie <span className="text-red-400">*</span></label>
              <input
                name="serie"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.serie && errors.serie ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="SN123456789"
                value={form.serie}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.serie && errors.serie && <span className="text-red-500 text-xs">{errors.serie}</span>}
            </div>
          </div>
        </div>

        {/* ── Card: Accesorios y Seguridad ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Accesorios y Seguridad</h3>
              <p className="text-xs text-gray-400">Qué trae el equipo y cómo está protegido</p>
            </div>
          </div>

          {/* Checkboxes de accesorios como pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {accesoriosList.map(acc => (
              <label
                key={acc}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium cursor-pointer transition-all select-none ${form.accesorios.includes(acc) ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  name="accesorios"
                  value={acc}
                  checked={form.accesorios.includes(acc)}
                  onChange={handleChange}
                />
                {form.accesorios.includes(acc) && (
                  <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {acc}
              </label>
            ))}
          </div>
          <input
            name="otrosAccesorios"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 mb-5 transition-all"
            placeholder="Otros accesorios (escribe aquí)..."
            value={form.otrosAccesorios}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraseña / PIN del equipo</label>
              <input
                name="seguridad"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.seguridad && errors.seguridad ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="Contraseña o PIN de desbloqueo"
                value={form.seguridad}
                onChange={handleChange}
              />
              {touched.seguridad && errors.seguridad && <span className="text-red-500 text-xs">{errors.seguridad}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patrón de Desbloqueo</label>
              <PatternLock
                value={form.patron}
                onChange={handlePatternChange}
                size={180}
                disabled={loading}
              />
              {touched.patron && errors.patron && (
                <span className="text-red-500 text-xs">{errors.patron}</span>
              )}
              {form.patron && form.patron.length > 0 && !errors.patron && (
                <span className="text-xs text-green-600 font-medium">Patrón registrado</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Card: Técnico ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Técnico Asignado</h3>
              <p className="text-xs text-gray-400">Responsable de atender la reparación</p>
            </div>
          </div>
          <select
            name="tecnico"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${touched.tecnico && errors.tecnico ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
            value={form.tecnico}
            onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))}
            onBlur={handleBlur}
          >
            <option value="">— Sin asignar —</option>
            {tecnicos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          {touched.tecnico && errors.tecnico && <span className="text-red-500 text-xs mt-1">{errors.tecnico}</span>}
        </div>

        {/* ── Card: Descripción y Observaciones ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Descripción y Observaciones</h3>
              <p className="text-xs text-gray-400">Describe el problema y agrega notas opcionales</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Problema reportado <span className="text-red-400">*</span></label>
              <textarea
                name="problema"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all min-h-[100px] ${touched.problema && errors.problema ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-300'}`}
                placeholder="Describe el problema del equipo..."
                value={form.problema}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.problema && errors.problema && <span className="text-red-500 text-xs">{errors.problema}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Observaciones <span className="text-gray-300">(opcional)</span></label>
              <textarea
                name="observaciones"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none resize-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 min-h-[100px] transition-all"
                placeholder="Notas adicionales, acuerdos, etc."
                value={form.observaciones}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ── Mensajes de estado ── */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {success}
          </div>
        )}

        {/* ── Botones ── */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Generar Orden
              </>
            )}
          </button>
          <button
            type="button"
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-150"
            onClick={() => setForm(initialState)}
          >
            Limpiar
          </button>
        </div>

        {/* ── Modal: Términos y Condiciones ── */}
        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 py-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '95vh' }}>

              {/* Header del modal */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Términos y Condiciones</h2>
                    <p className="text-xs text-gray-400">Lea cuidadosamente antes de firmar</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  onClick={() => setShowTerms(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Cuerpo scrolleable */}
              <div className="flex-1 overflow-y-auto px-6 py-5" style={{ minHeight: 0 }}>
                <ol className="space-y-2.5 mb-5">
                  {[
                    'SIEEG no se responsabiliza en caso el equipo presente daños por mal uso de terceros o a nivel software y/o hardware antes de su ingreso a reparación.',
                    'El cliente acepta pagar todas las piezas y mano de obra al finalizar la reparación.',
                    'La fecha estimada de finalización está sujeta a cambios según la disponibilidad de piezas.',
                    'El taller de reparación no es responsable de ninguna pérdida de datos en equipos electrónicos.',
                    'Si la reparación requiere trabajos y/o piezas que no se hayan especificado anteriormente, SIEEG indicará un presupuesto actualizado, en caso de no autorizarlo no se realizará ninguna reparación.',
                    'SIEEG te notificará una vez que tu producto esté reparado y listo para su entrega, este mismo se almacenará sin coste durante los primeros 10 días hábiles. Después de 10 días, si no se ha retirado el dispositivo, se cobrará los gastos de almacenamiento. El gasto de almacenamiento equivale a $50.00 por día.',
                    'Una vez el producto se considere abandonado, SIEEG tomará la propiedad del mismo en compensación de los costos de almacenamiento.',
                    'La garantía sobre reparaciones es válida solo en la mano de obra a partir de la fecha de finalización.',
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      {t}
                    </li>
                  ))}
                </ol>

                {/* Nombre del cliente (readonly) */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre del cliente</label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium"
                    value={form.nombre}
                    disabled
                    readOnly
                  />
                </div>

                {/* Firma digital */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Firma digital del cliente</label>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 flex flex-col items-center">
                    <SignaturePadCanvas
                      ref={sigPadRef}
                      width={650}
                      height={220}
                      style={{ touchAction: 'none', maxWidth: '100%', height: '220px', borderRadius: 10, background: 'white', boxShadow: '0 1px 6px #0001' }}
                      onEnd={() => setSignature(sigPadRef.current.isEmpty() ? null : sigPadRef.current.getTrimmedCanvas().toDataURL('image/png'))}
                    />
                    <button
                      type="button"
                      className="mt-3 px-4 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-300 transition-all"
                      onClick={() => { sigPadRef.current.clear(); setSignature(null); }}
                    >
                      Limpiar firma
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-center">Usa tu dedo o stylus para firmar</p>
                  </div>
                </div>
              </div>

              {/* Footer del modal */}
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0">
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-sm transition-all active:scale-95"
                  onClick={handleAcceptTerms}
                >
                  Acepto los términos y condiciones
                </button>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
                  onClick={() => setShowTerms(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Vista previa PDF ── */}
        {showPdfPreview && pdfUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 flex flex-col items-center gap-4">
              <h2 className="text-base font-bold text-gray-900">Vista previa de la orden</h2>
              <iframe
                src={pdfUrl}
                title="Vista previa PDF"
                style={{ width: '700px', height: '900px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb' }}
              />
              <div className="flex gap-3">
                <button
                  className="py-2 px-6 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-sm transition-all active:scale-95"
                  onClick={() => {
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = pdfUrl;
                    document.body.appendChild(iframe);
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    setTimeout(() => document.body.removeChild(iframe), 1000);
                  }}
                >
                  Imprimir / Descargar
                </button>
                <button
                  className="py-2 px-6 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
                  onClick={() => setShowPdfPreview(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </DashboardLayout>
  );
};

export default CreateOrder;
