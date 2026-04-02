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
    if (!form.correo) {
      errors.correo = 'El correo es obligatorio';
    } else if (!/^([a-zA-Z0-9_\-.+]+)@([a-zA-Z0-9\-.]+)\.([a-zA-Z]{2,})$/.test(form.correo)) {
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
      <form className="max-w-4xl mx-auto w-full" onSubmit={handleSubmit} autoComplete="off">
        <h2 className="text-2xl font-extrabold text-primary-500 mb-2 tracking-tight">Crear Orden</h2>
        <p className="text-text-secondary mb-6">Llena todos los campos obligatorios para generar una nueva orden de servicio.</p>

        {/* Card: Folio, Fecha, Estado */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Folio</label>
            <input className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 bg-primary-50/40 text-primary-600 font-mono font-bold text-lg" value={folio} disabled readOnly />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Fecha de ingreso</label>
            <input className="w-full px-4 py-3 rounded-xl border border-border bg-gray-50 text-dark font-semibold" value={fecha.split('-').reverse().join('/')} disabled readOnly />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Estado</label>
            <input className="w-full px-4 py-3 rounded-xl border border-border bg-gray-50 text-primary-500 font-bold" value="Pendiente" disabled readOnly />
          </div>
        </div>

        {/* Card: Información del Cliente */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary-100 text-primary-500 rounded-full p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </span>
            <h3 className="text-lg font-bold text-primary-500">Información del Cliente</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-dark">Nombre *</label>
              <input
                name="nombre"
                className={`w-full px-4 py-3 rounded-xl border ${touched.nombre && errors.nombre ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none`}
                placeholder="Nombre completo"
                value={form.nombre}
                onChange={e => {
                  const val = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, '');
                  setForm(f => ({ ...f, nombre: val }));
                }}
                onBlur={handleBlur}
                autoComplete="off"
              />
              {touched.nombre && errors.nombre && <span className="text-error text-xs mt-1 animate-fade-in">{errors.nombre}</span>}
            </div>
            <div>
              <label className="text-sm font-medium text-dark">Teléfono *</label>
              <input
                name="telefono"
                className={`w-full px-4 py-3 rounded-xl border ${touched.telefono && errors.telefono ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none`}
                placeholder="Teléfono (10 dígitos)"
                value={form.telefono}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setForm(f => ({ ...f, telefono: val }));
                }}
                onBlur={handleBlur}
                maxLength={10}
                autoComplete="off"
              />
              {touched.telefono && errors.telefono && <span className="text-error text-xs mt-1 animate-fade-in">{errors.telefono}</span>}
            </div>
            <div>
              <label className="text-sm font-medium text-dark">Correo *</label>
              <input
                name="correo"
                type="email"
                className={`w-full px-4 py-3 rounded-xl border ${touched.correo && errors.correo ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none`}
                placeholder="cliente@ejemplo.com"
                value={form.correo}
                onChange={e => {
                  setForm(f => ({ ...f, correo: e.target.value }));
                }}
                onBlur={handleBlur}
                autoComplete="off"
              />
              {touched.correo && errors.correo && <span className="text-error text-xs mt-1 animate-fade-in">{errors.correo}</span>}
            </div>
          </div>
        </div>

        {/* Card: Información del Equipo */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-orange-100 text-orange-500 rounded-full p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 21m5.25-4l.75 4M4 4h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm0 0V2a2 2 0 012-2h12a2 2 0 012 2v2" /></svg>
            </span>
            <h3 className="text-lg font-bold text-orange-500">Información del Equipo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-dark">Tipo *</label>
              <input
                name="tipo"
                className={`w-full px-4 py-3 rounded-xl border ${touched.tipo && errors.tipo ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none`}
                placeholder="Laptop, Celular, Tablet"
                value={form.tipo}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.tipo && errors.tipo && <span className="text-error text-xs mt-1 animate-fade-in">{errors.tipo}</span>}
            </div>
            <div>
              <label className="text-sm font-medium text-dark">Marca *</label>
              <input
                name="marca"
                className={`w-full px-4 py-3 rounded-xl border ${touched.marca && errors.marca ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none`}
                placeholder="HP, Samsung, Apple"
                value={form.marca}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.marca && errors.marca && <span className="text-error text-xs mt-1 animate-fade-in">{errors.marca}</span>}
            </div>
            <div>
              <label className="text-sm font-medium text-dark">Modelo *</label>
              <input
                name="modelo"
                className={`w-full px-4 py-3 rounded-xl border ${touched.modelo && errors.modelo ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none`}
                placeholder="Pavilion 15"
                value={form.modelo}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.modelo && errors.modelo && <span className="text-error text-xs mt-1 animate-fade-in">{errors.modelo}</span>}
            </div>
            <div>
              <label className="text-sm font-medium text-dark">Número de Serie *</label>
              <input
                name="serie"
                className={`w-full px-4 py-3 rounded-xl border ${touched.serie && errors.serie ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none`}
                placeholder="SN123456789"
                value={form.serie}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.serie && errors.serie && <span className="text-error text-xs mt-1 animate-fade-in">{errors.serie}</span>}
            </div>
          </div>
        </div>

        {/* Card: Accesorios y Seguridad */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-green-100 text-green-500 rounded-full p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
            </span>
            <h3 className="text-lg font-bold text-green-500">Accesorios y Seguridad</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {accesoriosList.map(acc => (
              <label key={acc} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white shadow-sm text-sm font-medium cursor-pointer hover:bg-primary-50 transition-all">
                <input
                  type="checkbox"
                  className="accent-primary-500"
                  name="accesorios"
                  value={acc}
                  checked={form.accesorios.includes(acc)}
                  onChange={handleChange}
                /> {acc}
              </label>
            ))}
            <input
              name="otrosAccesorios"
              className="flex-1 min-w-[180px] px-4 py-2 rounded-xl border border-border bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder="Otros accesorios..."
              value={form.otrosAccesorios}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-dark">Contraseña del Equipo</label>
              <input
                name="seguridad"
                className="w-full px-4 py-3 rounded-xl border border-border bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Contraseña o PIN"
                value={form.seguridad}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-dark">Patrón de Desbloqueo</label>
              <PatternLock
                value={form.patron}
                onChange={handlePatternChange}
                size={180}
                disabled={loading}
              />
              {touched.patron && errors.patron && (
                <div className="text-xs text-error mt-1 animate-fade-in">{errors.patron}</div>
              )}
              {form.patron && form.patron.length > 0 && !errors.patron && (
                <div className="text-xs text-primary-500 mt-1">Patrón registrado</div>
              )}
            </div>
          </div>
        </div>

        {/* Card: Técnico asignado */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-100 text-blue-500 rounded-full p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
            </span>
            <h3 className="text-lg font-bold text-blue-500">Técnico Asignado</h3>
          </div>
          <select
            name="tecnico"
            className={`w-full px-4 py-3 rounded-xl border ${touched.tecnico && errors.tecnico ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none`}
            value={form.tecnico}
            onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))}
            onBlur={handleBlur}
          >
            <option value="">-- Sin asignar --</option>
            {tecnicos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary-100 text-primary-500 rounded-full p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" /></svg>
            </span>
            <h3 className="text-lg font-bold text-primary-500">Descripción y Observaciones</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-dark">Problema *</label>
              <textarea
                name="problema"
                className={`w-full px-4 py-3 rounded-xl border ${touched.problema && errors.problema ? 'border-error' : 'border-border'} bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none min-h-[80px]`}
                placeholder="Describe el problema..."
                value={form.problema}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.problema && errors.problema && <span className="text-error text-xs mt-1 animate-fade-in">{errors.problema}</span>}
            </div>
            <div>
              <label className="text-sm font-medium text-dark">Observaciones</label>
              <textarea
                name="observaciones"
                className="w-full px-4 py-3 rounded-xl border border-border bg-white/80 focus:ring-2 focus:ring-primary-500 outline-none min-h-[60px]"
                placeholder="Observaciones adicionales..."
                value={form.observaciones}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Botón */}
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300 relative overflow-hidden group"
          >
            <span className="relative z-10">{loading ? 'Generando...' : 'Generar Orden'}</span>
            <span className="absolute inset-0 group-active:scale-110 group-hover:opacity-0 transition-all duration-300 bg-white/10 rounded-2xl" />
          </button>
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl bg-muted text-dark font-semibold shadow-soft transition-all hover:bg-border"
            onClick={() => setForm(initialState)}
          >
            Cancelar
          </button>
        </div>

        {/* Modal de Términos y Condiciones */}
        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in">
              <h2 className="text-xl font-bold text-primary-600 mb-2">Términos y Condiciones</h2>
              <p className="text-xs text-gray-700 mb-4">Por favor, lea cuidadosamente antes de firmar</p>
              <ol className="text-sm text-gray-800 mb-4 list-decimal pl-4 space-y-1">
                <li>SIEEG no se responsabiliza en caso el equipo presente daños por mal uso de terceros o a nivel software y/o hardware antes de su ingreso a reparación.</li>
                <li>El cliente acepta pagar todas las piezas y mano de obra al finalizar la reparación.</li>
                <li>La fecha estimada de finalización está sujeta a cambios según la disponibilidad de piezas.</li>
                <li>El taller de reparación no es responsable de ninguna pérdida de datos en equipos electrónicos.</li>
                <li>Si la reparación requiere trabajos y/o piezas que no se hayan especificado anteriormente, SIEEG indicará un presupuesto actualizado, en caso de no autorizarlo no se realizará ninguna reparación.</li>
                <li>SIEEG te notificará una vez que tu producto esté reparado y listo para su entrega, este mismo se almacenará sin coste durante los primeros 10 días hábiles. Después de 10 días, si no se ha retirado el dispositivo, se cobrará los gastos de almacenamiento. El gasto de almacenamiento equivale a $50.00 por día.</li>
                <li>Una vez el producto se considere abandonado, SIEEG tomará la propiedad del mismo en compensación de los costos de almacenamiento.</li>
                <li>La garantía sobre reparaciones es válida solo en la mano de obra a partir de la fecha de finalización.</li>
              </ol>
              <div className="mb-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del cliente</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-border bg-gray-50 text-dark font-medium mb-2"
                  value={form.nombre}
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Firma digital</label>
                <div className="bg-gray-100 rounded-lg border border-primary-200 p-2 flex flex-col items-center">
                  <SignaturePadCanvas
                    ref={sigPadRef}
                    width={320}
                    height={100}
                    onEnd={() => setSignature(sigPadRef.current.isEmpty() ? null : sigPadRef.current.getTrimmedCanvas().toDataURL('image/png'))}
                  />
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 rounded-lg border border-primary-200 text-primary-600 font-semibold flex items-center gap-1 hover:bg-primary-50 transition"
                    onClick={() => { sigPadRef.current.clear(); setSignature(null); }}
                  >
                    Limpiar firma
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="w-full py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300"
                onClick={handleAcceptTerms}
              >
                Acepto términos y condiciones
              </button>
              <button
                type="button"
                className="absolute top-2 right-2 text-gray-400 hover:text-primary-500 text-xl"
                onClick={() => setShowTerms(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {error && <div className="text-error text-center text-sm mt-2 animate-fade-in">{error}</div>}
        {success && <div className="text-success text-center text-sm mt-2 animate-fade-in">{success}</div>}

        {/* Modal de vista previa PDF */}
        {showPdfPreview && pdfUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative animate-fade-in flex flex-col items-center">
              <h2 className="text-xl font-bold text-primary-600 mb-2">Vista previa de la orden</h2>
              <iframe
                src={pdfUrl}
                title="Vista previa PDF"
                style={{ width: '700px', height: '900px', border: '1px solid #e3f0fd', borderRadius: '12px', background: '#f8fbfd' }}
              />
              <div className="flex gap-4 mt-4">
                <button
                  className="py-2 px-6 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95"
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
                  className="py-2 px-6 rounded-xl bg-gray-200 text-gray-700 font-bold shadow hover:bg-gray-300"
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
