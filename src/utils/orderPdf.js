

export async function generateQuotePdfDoc(quote) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Logo
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

  // Colores y estilos
  const azul = '#1a3a5e';
  const gris = '#f3f4f6';
  const grisOscuro = '#e5e7eb';
  const negro = '#22223b';
  const azulClaro = '#e0e7ff';
  const grisTabla = '#f9fafb';

  // Header superior
  doc.setFillColor(azul);
  doc.rect(0, 0, W, 60, 'F');
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 30, 10, 120, 40);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(azul);
  doc.text((quote.direccion || ''), W - 260, 22);
  doc.setFontSize(10);
  doc.text('Razon Social: ' + (quote.razonSocial || ''), W - 260, 36);
  doc.setFontSize(9);
  doc.text('RFC: ' + (quote.rfc || ''), W - 260, 48);
  if (quote.repse) doc.text('REPSE: ' + quote.repse, W - 260, 60);

  // Segunda fila de datos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(negro);
  doc.text('Cotización N. ', W - 260, 76);
  doc.setFont('helvetica', 'bold');
  doc.text((quote.numeroCotizacion || ''), W - 170, 76);

  // Datos generales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(azul);
  doc.text('Fecha', 40, 100);
  doc.text('Vigencia', 120, 100);
  doc.text('Empresa', 220, 100);
  doc.text('Cliente', 340, 100);
  doc.text('Teléfono', 470, 100);
  doc.text('Dirección', 570, 100);
  doc.text('Correo Electrónico', 40, 120);
  doc.text('Otro.', 220, 120);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(negro);
  doc.text((quote.fecha || ''), 40, 112);
  doc.text((quote.vigencia ? quote.vigencia + ' DÍAS' : ''), 120, 112);
  doc.text((quote.empresa || ''), 220, 112);
  doc.text((quote.cliente || ''), 340, 112);
  doc.text((quote.telefono || ''), 470, 112);
  doc.text((quote.direccionCliente || ''), 570, 112);
  doc.text((quote.correo || ''), 40, 132);

  // Descripción general
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(negro);
  doc.text((quote.descripcionGeneral || ''), 40, 150, { maxWidth: W - 80 });

  // Tabla de partidas
  let y = 170;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setFillColor(azul);
  doc.setTextColor('#fff');
  doc.rect(40, y, W - 80, 24, 'F');
  doc.text('PARTIDA', 48, y + 16);
  doc.text('CANTIDAD', 100, y + 16);
  doc.text('DESCRIPCION', 170, y + 16);
  doc.text('UNIDAD', 400, y + 16);
  doc.text('PRECIO UNITARIO', 470, y + 16);
  doc.text('IMPORTE', 570, y + 16);

  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(negro);
  for (let i = 0; i < quote.partidas.length; i++) {
    const p = quote.partidas[i];
    doc.setFillColor(i % 2 === 0 ? gris : grisTabla);
    doc.rect(40, y, W - 80, 22, 'F');
    doc.text(String(i + 1), 48, y + 15);
    doc.text(String(p.cantidad || ''), 100, y + 15);
    doc.text(String(p.descripcion || ''), 170, y + 15, { maxWidth: 220 });
    doc.text(String(p.unidad || ''), 400, y + 15);
    doc.text('$' + (Number(p.precioUnitario) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }), 470, y + 15);
    doc.text('$' + (Number(p.importe) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }), 570, y + 15);
    y += 22;
  }

  // Totales
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(negro);
  const subtotal = quote.partidas.reduce((sum, p) => sum + (parseFloat(p.importe) || 0), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  doc.text('SUBTOTAL', 470, y);
  doc.text('$' + subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 570, y);
  y += 16;
  doc.text('IVA', 470, y);
  doc.text('$' + iva.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 570, y);
  y += 16;
  doc.text('TOTAL', 470, y);
  doc.text('$' + total.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 570, y);

  // Datos bancarios
  y += 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(azul);
  doc.text('Banorte Cta : 0295855215     Clabe : 072 100 002958552154   Nombre:  Sinar Adrián Casanova García', 40, y);
  y += 16;
  doc.text('Bbva       Cta : 0480072338     Clabe: 012 100 004800723387    Nombre: Sinar Adrián Casanova García', 40, y);

  return doc;
}


const TERMS = [
  '1) SIEEG no se responsabiliza en caso el equipo presente daños por mal uso de terceros o a nivel software y/o hardware antes de su ingreso a reparación.',
  '2) El cliente acepta pagar todas las piezas y mano de obra al finalizar la reparación.',
  '3) La fecha estimada de finalización está sujeta a cambios según la disponibilidad de piezas.',
  '4) El taller de reparación no es responsable de ninguna pérdida de datos en equipos electrónicos.',
  '5) Si la reparación requiere trabajos y/o piezas que no se hayan especificado anteriormente, SIEEG indicará un presupuesto actualizado, en caso de no autorizarlo no se realizará ninguna reparación.',
  '6) SIEEG te notificará una vez que tu producto esté reparado y listo para su entrega, este mismo se almacenará sin coste durante los primeros 10 días hábiles. Después de 10 días, si no se ha retirado el dispositivo, se cobrará los gastos de almacenamiento. El gasto de almacenamiento equivale a $50.00 por día.',
  '7) Una vez el producto se considere abandonado, SIEEG tomará la propiedad del mismo en compensación de los costos de almacenamiento.',
  '8) La garantía sobre reparaciones es válida solo en la mano de obra a partir de la fecha de finalización.',
];

const normalizeText = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
};

const normalizeDate = (value) => {
  const text = normalizeText(value);
  return text.includes('-') ? text.split('-').reverse().join('/') : text;
};

const normalizeAccesories = (order) => {
  const primary = Array.isArray(order.accesorios)
    ? order.accesorios
    : typeof order.accesorios === 'string'
      ? order.accesorios.split(',')
      : [];

  const extras = order.otrosAccesorios ? [order.otrosAccesorios] : [];
  const items = [...primary, ...extras]
    .map((item) => String(item).trim())
    .filter(Boolean);

  return items.length > 0 ? items.join(', ') : 'Sin accesorios marcados';
};

const getOrderText = (order, keys, fallback = '—') => {
  for (const key of keys) {
    const value = order?.[key];
    if (value !== null && value !== undefined && value !== '') {
      return String(value);
    }
  }
  return fallback;
};

const parseMaybeJson = (value, fallback) => {
  if (typeof value !== 'string') {
    return value ?? fallback;
  }

  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
};

export const generateOrderPdfDoc = async (order = {}, options = {}) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const C = {
    navy: '#1a3a5e',
    blue: '#1a3a5e',
    blueLight: '#1a3a5e',
    accent: '#000000',
    bg: '#FFFFFF',
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

  const logoBase64 = await getLogoBase64(options.logoSrc || '/images/logo.ico');

  const clientName = getOrderText(order, ['clientName', 'nombre']);
  const technicianName = getOrderText(order, ['tecnico']);
  const folio = getOrderText(order, ['folio']);
  const fecha = normalizeDate(getOrderText(order, ['fecha']));
  const problema = getOrderText(order, ['description', 'problema', 'detalles', 'observaciones']);
  const accesorios = normalizeAccesories(order);
  const seguridad = getOrderText(order, ['seguridad']);
  const firmaCliente = order.firma || order.signature || null;
  const clientView = Boolean(options.clientView);
  const detalleCliente = parseMaybeJson(order.detalleSolicitud, parseMaybeJson(order.observaciones, {}));
  const presupuestoCliente = order.presupuestoCliente ?? order.presupuesto ?? null;
  const presupuestoAdmin = order.presupuestoAdmin ?? null;
  const estadoPresupuesto = getOrderText(order, ['estadoPresupuesto'], 'sin_presupuesto');
  const notaPresupuesto = getOrderText(order, ['notaPresupuesto'], '');
  const imagenes = Array.isArray(order.imagenes)
    ? order.imagenes
    : typeof order.imagenes === 'string'
      ? parseMaybeJson(order.imagenes, [])
      : [];

  const mx = 34;
  const cw = W - mx * 2;

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
    const lines = doc.splitTextToSize(String(value || '—'), w - 12);
    doc.text(lines[0] || '—', x + 6, y + 21);
  };

  const noteBox = (label, value, x, y, w, h) => {
    filledRoundRect(x, y, w, h, 4, C.bg);
    setStroke(C.divider);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, w, h, 4, 4, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setTxt(C.labelText);
    doc.text(label.toUpperCase(), x + 8, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    setTxt(C.bodyText);
    const lines = doc.splitTextToSize(String(value || '—'), w - 16);
    doc.text(lines, x + 8, y + 24);
    return y + h;
  };

  const drawPageBg = () => {
    setFill(C.bg);
    doc.rect(0, 0, W, H, 'F');
    filledRoundRect(20, 20, W - 40, H - 40, 8, C.white);
  };

  const drawHeader = () => {
    setFill(C.bg);
    doc.rect(0, 0, W, 90, 'F');
    const logoY = 22;
    const logoH = 40;
    const logoW = 100;

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
    setTxt('#000000');
    doc.text('SIEEG', textX, textY + 16);

    const boxW = 120;
    const boxH = 28;
    const boxX = W - boxW - 50;
    const boxY = logoY + 6;
    filledRoundRect(boxX, boxY, boxW, boxH, 7, C.navy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setTxt(C.white);
    doc.text('ORDEN DE SERVICIO', boxX + boxW / 2, boxY + boxH / 2 + 3, { align: 'center' });
  };

  const drawClientSummaryBlock = () => {
    if (!clientView) {
      return;
    }

    let summaryY = 108;
    summaryY = sectionHeader('Resumen del Cliente y la Solicitud', mx, summaryY, cw);
    summaryY += 8;

    const halfSummary = (cw - 8) / 2;
    fieldCell('Cliente', clientName, mx, summaryY, halfSummary);
    fieldCell('Usuario / ID', getOrderText(order, ['usuario', 'clienteId', 'id']), mx + halfSummary + 8, summaryY, halfSummary);

    summaryY += 44;
    fieldCell('Teléfono', getOrderText(order, ['telefono']), mx, summaryY, halfSummary);
    fieldCell('Correo', getOrderText(order, ['correo']), mx + halfSummary + 8, summaryY, halfSummary);

    summaryY += 44;
    fieldCell('Tipo de Equipo / Servicio', getOrderText(order, ['tipoEquipoServicio', 'tipo']), mx, summaryY, halfSummary);
    fieldCell('Dirección del Servicio', getOrderText(detalleCliente, ['direccion'], '—'), mx + halfSummary + 8, summaryY, halfSummary);

    summaryY += 44;
    fieldCell('Presupuesto del Cliente', presupuestoCliente !== null && presupuestoCliente !== undefined && presupuestoCliente !== '' ? `$${Number(presupuestoCliente).toFixed(2)}` : 'No definido', mx, summaryY, halfSummary);
    fieldCell('Costo / Presupuesto Admin', presupuestoAdmin !== null && presupuestoAdmin !== undefined && presupuestoAdmin !== '' ? `$${Number(presupuestoAdmin).toFixed(2)}` : 'Sin propuesta', mx + halfSummary + 8, summaryY, halfSummary);

    summaryY += 44;
    fieldCell('Estado del Presupuesto', estadoPresupuesto, mx, summaryY, halfSummary);
    fieldCell('Técnico Asignado', technicianName || 'Sin asignar', mx + halfSummary + 8, summaryY, halfSummary);

    summaryY += 44;
    noteBox('Detalle de la Solicitud', getOrderText(order, ['description', 'problema', 'detalles', 'observaciones']), mx, summaryY, cw, 58);

    summaryY += 66;
    if (notaPresupuesto) {
      noteBox('Nota del Presupuesto', notaPresupuesto, mx, summaryY, cw, 52);
      summaryY += 60;
    }

    if (imagenes.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setTxt(C.labelText);
      doc.text('EVIDENCIA FOTOGRÁFICA', mx, summaryY + 10);

      const thumbW = 110;
      const thumbH = 74;
      const gapThumb = 10;
      const maxThumbs = Math.min(imagenes.length, 4);

      for (let index = 0; index < maxThumbs; index += 1) {
        const img = imagenes[index];
        const thumbX = mx + (index % 2) * (thumbW + gapThumb);
        const thumbY = summaryY + 18 + Math.floor(index / 2) * (thumbH + 22);
        filledRoundRect(thumbX, thumbY, thumbW, thumbH, 4, C.bg);
        setStroke(C.divider);
        doc.roundedRect(thumbX, thumbY, thumbW, thumbH, 4, 4, 'S');
        if (typeof img === 'string' && img.startsWith('data:image')) {
          try {
            doc.addImage(img, 'JPEG', thumbX + 4, thumbY + 4, thumbW - 8, thumbH - 8);
          } catch (_) {
            try {
              doc.addImage(img, 'PNG', thumbX + 4, thumbY + 4, thumbW - 8, thumbH - 8);
            } catch (_) {
              // ignore invalid images
            }
          }
        }
      }
    }
  };

  const drawFooter = (pageNum) => {
    setStroke(C.divider);
    doc.setLineWidth(0.5);
    doc.line(34, H - 38, W - 34, H - 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setTxt(C.footerText);
    doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', 34, H - 26);
    doc.text('Tel: 961 118 0157  ·  WhatsApp: 961 333 6529', 34, H - 16);
    doc.text(`Página ${pageNum} de ${clientView ? 3 : 2}`, W - 34, H - 16, { align: 'right' });
  };

  const drawSignatures = (yStart) => {
    const bW = 180;
    const bH = 64;
    const leftX = 40;
    const rightX = W - 40 - bW;

    setStroke(C.divider);
    doc.setLineWidth(0.6);
    filledRoundRect(leftX, yStart, bW, bH, 4, C.bg);
    doc.roundedRect(leftX, yStart, bW, bH, 4, 4, 'S');

    if (firmaCliente) {
      try {
        doc.addImage(firmaCliente, 'PNG', leftX + 10, yStart + 6, bW - 20, 34);
      } catch (_) {
        // ignore invalid signature images
      }
    }

    setStroke(C.navy);
    doc.setLineWidth(0.6);
    doc.line(leftX + 14, yStart + 46, leftX + bW - 14, yStart + 46);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setTxt(C.navy);
    doc.text('FIRMA DEL CLIENTE', leftX + bW / 2, yStart + 56, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTxt(C.bodyText);
    doc.text(clientName || '', leftX + bW / 2, yStart + 64, { align: 'center' });

    filledRoundRect(rightX, yStart, bW, bH, 4, C.bg);
    doc.setLineWidth(0.6);
    setStroke(C.divider);
    doc.roundedRect(rightX, yStart, bW, bH, 4, 4, 'S');
    setStroke(C.navy);
    doc.line(rightX + 14, yStart + 46, rightX + bW - 14, yStart + 46);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setTxt(C.navy);
    doc.text('FIRMA DEL TÉCNICO', rightX + bW / 2, yStart + 56, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTxt(C.bodyText);
    doc.text(technicianName || '', rightX + bW / 2, yStart + 64, { align: 'center' });
  };

  drawPageBg();
  drawHeader();

  if (clientView) {
    drawClientSummaryBlock();
    drawFooter(1);

    doc.addPage();
    drawPageBg();
    drawHeader();
  }

  let y = 100;

  y += 12;
  const strip2W = (cw - 8) / 2;
  filledRoundRect(mx, y, cw, 38, 5, C.bg);
  setStroke(C.divider);
  doc.setLineWidth(0.4);
  doc.roundedRect(mx, y, cw, 38, 5, 5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  setTxt(C.labelText);
  doc.text('FOLIO', mx + 10, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setTxt(C.navy);
  doc.text(folio, mx + 10, y + 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  setTxt(C.labelText);
  doc.text('FECHA DE INGRESO', mx + strip2W + 10, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTxt(C.bodyText);
  doc.text(fecha, mx + strip2W + 10, y + 27);

  y += 52;
  y = sectionHeader('Información del Cliente', mx, y, cw);
  y += 8;
  const col3 = (cw - 12) / 3;
  fieldCell('Nombre Completo', clientName, mx, y, col3);
  fieldCell('Teléfono', getOrderText(order, ['telefono']), mx + col3 + 6, y, col3);
  fieldCell('Correo Electrónico', getOrderText(order, ['correo']), mx + col3 * 2 + 12, y, col3);

  y += 44;
  y = sectionHeader('Información del Equipo', mx, y, cw);
  y += 8;
  const col4 = (cw - 18) / 4;
  fieldCell('Tipo de Equipo', getOrderText(order, ['tipo']), mx, y, col4);
  fieldCell('Marca', getOrderText(order, ['marca']), mx + col4 + 6, y, col4);
  fieldCell('Modelo', getOrderText(order, ['modelo']), mx + col4 * 2 + 12, y, col4);
  fieldCell('Núm. de Serie', getOrderText(order, ['serie']), mx + col4 * 3 + 18, y, col4);

  y += 44;
  y = sectionHeader('Accesorios y Seguridad', mx, y, cw);
  y += 8;
  const halfW = (cw - 8) / 2;
  fieldCell('Accesorios Incluidos', accesorios, mx, y, halfW);
  fieldCell('Contraseña / PIN', seguridad, mx + halfW + 8, y, halfW);

  y += 44;
  y = sectionHeader('Descripción de la Falla', mx, y, cw);
  y += 8;
  const probLines = doc.splitTextToSize(problema || '—', cw - 24);
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
  y = sectionHeader('Técnico Asignado', mx, y, cw);
  y += 8;
  fieldCell('Técnico Responsable', technicianName, mx, y, cw / 2);

  y += 44;
  drawFooter(1);

  doc.addPage();
  drawPageBg();
  drawHeader();

  let ty = 110;
  ty = sectionHeader('Términos y Condiciones del Servicio', mx, ty, cw);
  ty += 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  setTxt(C.labelText);
  doc.text('Por favor lea cuidadosamente los siguientes términos antes de firmar la orden de servicio.', mx + 4, ty);
  ty += 16;

  TERMS.forEach((term, index) => {
    const lines = doc.splitTextToSize(term, cw - 20);
    const rowH = lines.length * 11 + 10;
    filledRoundRect(mx, ty, cw, rowH, 3, index % 2 === 0 ? C.bg : C.white);
    setFill(C.navy);
    doc.rect(mx, ty, 3, rowH, 'F');
    doc.setFont('helvetica', 'normal');
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

  return doc;
};
