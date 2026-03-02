import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SignaturePadCanvas from '../components/SignaturePadCanvas';

const getToday = () => new Date().toISOString().slice(0, 10);
const generarFolioForaneo = () => `SF${new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 11)}`;

const AREAS = [
  'Comedor de logística',
  'Auxiliar administrativo',
  'Gerencia',
  'Seguridad patrimonial',
  'Dormitorio',
  'Site',
  'Crédito y cobranza',
  'Atención al cliente 1',
  'Atención al cliente 2',
  'Atención al cliente 3',
  'Comedor operaciones',
  'Sala de juntas',
  'Cortes y acuses',
  'Asesor logístico',
  'Caseta de vigilancia',
  'Capacitación',
  'Supervisores operaciones',
];

const defaultRow = {
  filtros: 'SI',
  condensadora: 'SI',
  psi: '',
  evaporadora: 'SI',
  electrica: '',
  observaciones: '',
};

function ForeignServicesCreate() {
  const [cliente, setCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [rows, setRows] = useState([
    { area: '', ...defaultRow }
  ]);
  const [showTable, setShowTable] = useState(false);
  const [nombreRecibe, setNombreRecibe] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const navigate = useNavigate();
  const pdfRef = useRef();
  const signaturePadRef = useRef();

  const cargarPlantilla = () => {
    setRows(AREAS.map(area => ({ area, ...defaultRow })));
  };

  const agregarLinea = () => {
    setRows([...rows, { area: '', ...defaultRow }]);
  };
  useEffect(() => {
    setFecha(getToday());
  }, []);

  const marcarTodos = (campo, valor) => {
    setRows(rows.map(r => ({ ...r, [campo]: valor })));
  };

  // Alterna SI/NO según el estado actual
  const getBotonEstado = campo => {
    const todosSI = rows.every(r => r[campo] === 'SI');
    return todosSI ? 'NO' : 'SI';
  };

  const handleChange = (idx, campo, valor) => {
    setRows(rows.map((r, i) => i === idx ? { ...r, [campo]: valor } : r));
  };

  const eliminarFila = idx => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  // Guardar y validar datos del cliente
  const handleGuardarCliente = () => {
    if (!cliente.trim() || !direccion.trim() || !telefono.trim() || !fecha.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Campos obligatorios',
        text: 'Por favor rellena todos los datos del cliente.',
      });
      return;
    }
    Swal.fire({
      icon: 'success',
      title: 'Cliente guardado',
      text: 'Datos del cliente guardados correctamente.',
      timer: 1200,
      showConfirmButton: false
    });
    setShowTable(true);
  };

  const generatePDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();   // 595.28
    const H = doc.internal.pageSize.getHeight();  // 841.89
    const folio = generarFolioForaneo();

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
      // Recuadro a la derecha
      const boxW = 120, boxH = 28;
      const boxX = W - boxW - 50, boxY = logoY + 6;
      setStroke('#35def4');
      doc.setLineWidth(1.2);
      doc.roundedRect(boxX, boxY, boxW, boxH, 7, 7, 'S');
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      setTxt('#000000');
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
    fieldCell('Cliente', cliente, mx, y, col3);
    fieldCell('Dirección', direccion, mx + col3 + 8, y, col3);
    fieldCell('Teléfono', telefono, mx + col3*2 + 16, y, col3);
    y += 44;

    // Folio y Fecha
    fieldCell('Folio', folio, mx, y, col3);
    fieldCell('Fecha', fecha, mx + col3 + 8, y, col3);
    y += 44;

    // Tabla de mantenimiento
    y = sectionHeader('Checklist de Mantenimiento', mx, y, cw);
    y += 8;

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
    //  FIRMAS Y ACEPTACIÓN - Design like Orders.jsx
    // ════════════════════════════════════════════════════════════════
    
    // Añadir nueva página si es necesario
    if (y > H - 220) {
      drawFooter(1);
      doc.addPage();
      drawPageBg();
      drawHeader();
      y = 110;
    }

    y += 20;
    
    // Título sección en azul claro
    const sigSectionH = 32;
    filledRoundRect(mx, y, cw, sigSectionH, 6, '#35def4');
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    setTxt('#FFFFFF');
    doc.text('FIRMAS Y ACEPTACIÓN', mx + cw / 2, y + sigSectionH / 2 + 4, { align: 'center' });
    y += sigSectionH + 14;

    // Contenedor de firma del cliente
    const sigBoxW = 250;
    const sigBoxH = 100;
    const sigBoxX = mx + (cw - sigBoxW) / 2; // Centrado
    
    // Fondo blanco con borde redondeado
    filledRoundRect(sigBoxX, y, sigBoxW, sigBoxH + 40, 8, C.white);
    setStroke('#35def4');
    doc.setLineWidth(1.5);
    doc.roundedRect(sigBoxX, y, sigBoxW, sigBoxH + 40, 8, 8, 'S');

    // Área de firma
    const sigAreaY = y + 8;
    filledRoundRect(sigBoxX + 10, sigAreaY, sigBoxW - 20, sigBoxH, 4, '#f0f4f8');
    setStroke(C.divider);
    doc.setLineWidth(0.5);
    doc.roundedRect(sigBoxX + 10, sigAreaY, sigBoxW - 20, sigBoxH, 4, 4, 'S');

    // Dibujar firma si existe
    if (signatureData) {
      try {
        let imageData = signatureData;
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

    // Label "FIRMA DEL CLIENTE" en azul claro
    const labelY = sigAreaY + sigBoxH + 8;
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    setTxt('#35def4');
    doc.text('FIRMA DEL CLIENTE', sigBoxX + sigBoxW / 2, labelY, { align: 'center' });

    // Nombre de quien recibe debajo
    const nameY = labelY + 12;
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    setTxt(C.bodyText);
    doc.text(nombreRecibe || '___________________________', sigBoxX + sigBoxW / 2, nameY, { align: 'center' });

    drawFooter(1);

    // Convertir a Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  };

  // Guardar y validar datos de la tabla
  const handleGuardarTabla = async () => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.area.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Área faltante',
          text: `La fila ${i + 1} no tiene nombre de área.`,
        });
        return;
      }
      if (row.psi && isNaN(Number(row.psi))) {
        Swal.fire({
          icon: 'error',
          title: 'PSI inválido',
          text: `La fila ${i + 1} tiene un valor PSI inválido.`,
        });
        return;
      }
      if (row.electrica && row.electrica.length < 3) {
        Swal.fire({
          icon: 'error',
          title: 'Instalación eléctrica inválida',
          text: `La fila ${i + 1} tiene datos eléctricos inválidos.`,
        });
        return;
      }
    }

    // Guardar en BD
    const folio = generarFolioForaneo();
    const payload = {
      folio,
      fecha,
      clientName: cliente.trim(),
      telefono: telefono.trim(),
      correo: '',
      tipo: 'foraneo',
      marca: '',
      modelo: '',
      serie: '',
      accesorios: '',
      otrosAccesorios: '',
      seguridad: '',
      patron: '',
      description: 'Servicio foráneo',
      diagnostico: '',
      observaciones: JSON.stringify({ direccion: direccion.trim(), rows }),
      firma: signatureData || null,
      nombreRecibe: nombreRecibe.trim() || null,
      status: 'pendiente',
      technicianId: null,
      trabajos: [],
      resumen: { total: 0 },
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('No se pudo crear la orden');

      // Generar PDF y abrir en nueva pestaña
      const blob = await generatePDF();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      Swal.fire({
        icon: 'success',
        title: 'Orden guardada',
        text: 'La orden se ha guardado en la BD y el PDF se abrió en una nueva pestaña.',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        navigate('/servicios-foraneos');
      });
    } catch (_) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la orden en la base de datos.',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold text-primary-500 tracking-tight">Servicio Foráneo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="px-4 py-3 rounded-xl border border-border bg-white shadow-card" placeholder="Nombre del cliente o Empresa " value={cliente} onChange={e => setCliente(e.target.value)} />
          <input className="px-4 py-3 rounded-xl border border-border bg-white shadow-card" placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} />
          <input className="px-4 py-3 rounded-xl border border-border bg-white shadow-card" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} maxLength={10} />
          <input className="px-4 py-3 rounded-xl border border-border bg-white shadow-card" placeholder="Fecha de mantenimiento" value={fecha} onChange={e => setFecha(e.target.value)} type="date" />
          <input className="px-4 py-3 rounded-xl border border-border bg-white shadow-card" placeholder="Nombre de quien recibe (opcional)" value={nombreRecibe} onChange={e => setNombreRecibe(e.target.value)} />
          <button
            className={`px-4 py-3 rounded-xl font-bold shadow-card transition-all ${signatureData ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-cyan-500 text-white hover:bg-cyan-600'}`}
            onClick={() => setShowSignatureModal(true)}
            title="Capturar firma (opcional)"
          >
            {signatureData ? '✓ Firma Capturada' : 'Capturar Firma'}
          </button>
        </div>
        <div className="flex gap-2 mb-4 justify-end">
          {showTable && (
            <>
              <button
                className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all"
                onClick={cargarPlantilla}
              >
                Cargar plantilla completa
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-gray-500 text-white font-bold shadow-lg hover:bg-gray-600 transition-all"
                onClick={agregarLinea}
              >
                Agregar línea en blanco
              </button>
              <button
                className={`px-4 py-2 rounded-xl font-bold shadow-lg transition-all ${getBotonEstado('filtros') === 'NO' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                onClick={() => marcarTodos('filtros', getBotonEstado('filtros'))}
              >
                {`Marcar filtros en ${getBotonEstado('filtros')}`}
              </button>
              <button
                className={`px-4 py-2 rounded-xl font-bold shadow-lg transition-all ${getBotonEstado('condensadora') === 'NO' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                onClick={() => marcarTodos('condensadora', getBotonEstado('condensadora'))}
              >
                {`Marcar condensadora en ${getBotonEstado('condensadora')}`}
              </button>
              <button
                className={`px-4 py-2 rounded-xl font-bold shadow-lg transition-all ${getBotonEstado('evaporadora') === 'NO' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                onClick={() => marcarTodos('evaporadora', getBotonEstado('evaporadora'))}
              >
                {`Marcar evaporadora en ${getBotonEstado('evaporadora')}`}
              </button>
            </>
          )}
        </div>
        {showTable && (
          <div className="mt-6 rounded-2xl bg-gradient-to-tr from-primary-100 to-blue-50 shadow-lg p-1 overflow-x-auto animate-fade-in">
            <table className="min-w-full text-base border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-white font-bold bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl">
                  <th className="py-3 px-4 rounded-tl-2xl">Área</th>
                  <th className="py-3 px-4">Limpieza de filtros</th>
                  <th className="py-3 px-4">Limpieza de condensadora</th>
                  <th className="py-3 px-4">Revisión presión gas (PSI)</th>
                  <th className="py-3 px-4">Limpieza de evaporadora</th>
                  <th className="py-3 px-4">Revisión instalación eléctrica</th>
                  <th className="py-3 px-4 ">Observaciones</th>
                  <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>

                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="bg-white border-b border-border last:border-0">
                    <td className="py-4 px-4 font-bold text-dark">
                      <input
                        type="text"
                        value={row.area}
                        onChange={e => handleChange(idx, 'area', e.target.value)}
                        className="rounded-xl border border-border px-2 py-1 w-full"
                        placeholder="Nombre del área"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={row.filtros}
                        onChange={e => handleChange(idx, 'filtros', e.target.value)}
                        className={`rounded-xl border border-border px-2 py-1 ${row.filtros === 'SI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={row.condensadora}
                        onChange={e => handleChange(idx, 'condensadora', e.target.value)}
                        className={`rounded-xl border border-border px-2 py-1 ${row.condensadora === 'SI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        value={row.psi}
                        onChange={e => handleChange(idx, 'psi', e.target.value)}
                        className="rounded-xl border border-border px-2 py-1 w-24"
                        placeholder="Ej: 125 PSI"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={row.evaporadora}
                        onChange={e => handleChange(idx, 'evaporadora', e.target.value)}
                        className={`rounded-xl border border-border px-2 py-1 ${row.evaporadora === 'SI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        value={row.electrica}
                        onChange={e => handleChange(idx, 'electrica', e.target.value)}
                        className="rounded-xl border border-border px-2 py-1 w-48"
                        placeholder="L1-L2=232 V / L1-T=116V / L2-T=117V"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        value={row.observaciones}
                        onChange={e => handleChange(idx, 'observaciones', e.target.value)}
                        className="rounded-xl border border-border px-2 py-1 w-32"
                        placeholder="Ej: Sin anomalías"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <button
                        className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold shadow-md hover:bg-red-600 transition-all"
                        onClick={() => eliminarFila(idx)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {!showTable && (
            <button
              className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold shadow-lg hover:bg-primary-600 transition-all ml-auto"
              onClick={handleGuardarCliente}
            >
              Guardar datos del cliente
            </button>
          )}
          {showTable && (
            <button
              className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold shadow-lg hover:bg-primary-600 transition-all ml-auto"
              onClick={handleGuardarTabla}
            >
              Generar PDF
            </button>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-dark mb-4">Capturar Firma del Cliente</h3>
            
            {/* Signature Pad */}
            <div className="mb-4 border-2 border-border rounded-lg overflow-hidden bg-gray-50">
              <SignaturePadCanvas
                ref={signaturePadRef}
                width={300}
                height={150}
              />
            </div>

            {/* Clear Button */}
            <button
              onClick={() => signaturePadRef.current?.clear()}
              className="w-full mb-3 px-3 py-2 bg-gray-300 text-dark font-semibold rounded-lg hover:bg-gray-400 transition-all"
            >
              Limpiar Firma
            </button>

            {/* Confirm/Cancel Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  signaturePadRef.current?.clear();
                }}
                className="flex-1 px-3 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (signaturePadRef.current?.isEmpty?.()) {
                    Swal.fire('Error', 'Por favor captura la firma', 'error');
                    return;
                  }
                  // Get signature data using getTrimmedCanvas for better quality
                  try {
                    const canvas = signaturePadRef.current?.getTrimmedCanvas?.() || signaturePadRef.current?.toDataURL?.();
                    const signatureImage = typeof canvas === 'string' ? canvas : canvas?.toDataURL?.();
                    setSignatureData(signatureImage);
                    setShowSignatureModal(false);
                    signaturePadRef.current?.clear();
                    Swal.fire('Éxito', 'Firma capturada correctamente', 'success');
                  } catch (e) {
                    Swal.fire('Error', 'No se pudo capturar la firma', 'error');
                  }
                }}
                className="flex-1 px-3 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ForeignServicesCreate;
