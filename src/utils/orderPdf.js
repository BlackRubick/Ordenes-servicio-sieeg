import jsPDF from 'jspdf';

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  revision: 'En revisión',
  diagnostico: 'Diagnóstico generado',
  espera_aprobacion: 'En espera de aprobación',
  reparacion: 'En reparación',
  lista: 'Lista',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
  en_proceso: 'En proceso',
  completada: 'Completada',
};

export const generateOrderPdfDoc = async (order) => {
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
  const statusLabel = STATUS_LABELS[statusKey] || statusKey;
  const details = order.description || order.detalles || order.observaciones || 'No especificado';
  const total = typeof order.resumen?.total === 'number' ? `$${order.resumen.total.toFixed(2)}` : '$0.00';

  const C = {
    primary: '#1a3a5e',
    primaryMid: '#162f50',
    primaryDark: '#0f2440',
    primaryLight: '#2e5f9e',
    accent: '#4a90d9',
    white: '#FFFFFF',
    offWhite: '#F7FAFC',
    border: '#CBD5E0',
    labelGray: '#6b7a99',
    bodyText: '#1A202C',
    mutedText: '#a8c4e0',
    mutedText2: '#6a8faf',
    subtleBlue: '#eef2f7',
  };

  const rgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const setFill = (hex) => doc.setFillColor(...rgb(hex));
  const setStroke = (hex) => doc.setDrawColor(...rgb(hex));
  const setTxt = (hex) => doc.setTextColor(...rgb(hex));
  const fillRect = (x, y, w, h, c) => { setFill(c); doc.rect(x, y, w, h, 'F'); };
  const fillRR = (x, y, w, h, r, c) => { setFill(c); doc.roundedRect(x, y, w, h, r, r, 'F'); };
  const strokeRR = (x, y, w, h, r, c, lw = 0.5) => { setStroke(c); doc.setLineWidth(lw); doc.roundedRect(x, y, w, h, r, r, 'S'); };

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

  fillRect(0, 0, W, H, C.offWhite);

  const hdrH = 100;
  fillRect(0, 0, W, hdrH, C.primary);
  fillRect(0, 0, W, 3, C.primaryLight);
  fillRect(0, 0, 88, hdrH, C.primaryMid);
  fillRect(88, 0, 1.5, hdrH, C.primaryLight);
  fillRect(0, hdrH - 4, W, 4, C.primaryDark);
  fillRect(0, hdrH - 2, W, 2, C.primaryLight);

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 20, 58, 58);
  }

  const txtX = 104;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setTxt(C.white);
  doc.text('Ingeniería y Telecomunicaciones', txtX, 42);
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

  const tagW = 148, tagH = 64, tagX = W - tagW - 24, tagY = 17;
  fillRR(tagX, tagY, tagW, tagH, 5, C.primary);
  setStroke(C.primaryLight); doc.setLineWidth(1.1);
  doc.roundedRect(tagX, tagY, tagW, tagH, 5, 5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setTxt(C.white);
  doc.text('ORDEN DE SERVICIO', tagX + tagW / 2, tagY + 15, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  setTxt(C.white);
  doc.text(String(order.folio || '—'), tagX + tagW / 2, tagY + 50, { align: 'center' });
  setStroke(C.primaryLight); doc.setLineWidth(0.5);
  doc.line(tagX + 16, tagY + 57, tagX + tagW - 16, tagY + 57);

  const subY = hdrH + 8;
  const subH = 46;
  fillRR(18, subY, W - 36, subH, 5, C.white);
  strokeRR(18, subY, W - 36, subH, 5, C.border, 0.5);

  const fechaFmt = String(order.fecha || '').includes('-')
    ? String(order.fecha).split('-').reverse().join('/')
    : (order.fecha || '—');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
  doc.text('FOLIO', 34, subY + 15);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); setTxt(C.primary);
  doc.text(String(order.folio || '—'), 34, subY + 34);

  setStroke(C.border); doc.setLineWidth(0.5);
  doc.line(132, subY + 9, 132, subY + subH - 9);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
  doc.text('FECHA DE INGRESO', 146, subY + 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); setTxt(C.bodyText);
  doc.text(fechaFmt, 146, subY + 33);

  doc.line(W / 2 + 10, subY + 9, W / 2 + 10, subY + subH - 9);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
  doc.text('ESTADO DE LA ORDEN', W / 2 + 24, subY + 15);
  const pillX = W / 2 + 24, pillY = subY + 20, pillW = 120, pillH = 18;
  fillRR(pillX, pillY, pillW, pillH, 9, C.subtleBlue);
  strokeRR(pillX, pillY, pillW, pillH, 9, C.primary, 0.7);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); setTxt(C.primary);
  doc.text(String(statusLabel).toUpperCase(), pillX + pillW / 2, pillY + 12, { align: 'center' });

  const mx = 18;
  const cw = W - mx * 2;
  let y = subY + subH + 14;
  const gap = 6;

  const sectionHeader = (label, sx, sy, sw) => {
    fillRR(sx, sy, sw, 21, 4, C.primary);
    fillRR(sx, sy, 5, 21, 2, C.accent);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setTxt(C.white);
    doc.text(label.toUpperCase(), sx + 15, sy + 14);
    return sy + 21;
  };

  const fieldCell = (label, value, fx, fy, fw, fh = 33) => {
    fillRR(fx, fy, fw, fh, 4, C.white);
    strokeRR(fx, fy, fw, fh, 4, C.border, 0.4);
    fillRR(fx, fy, fw, 2.5, 1, C.accent);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); setTxt(C.labelGray);
    doc.text(label.toUpperCase(), fx + 8, fy + 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setTxt(C.bodyText);
    const lines = doc.splitTextToSize(String(value || '—'), fw - 16);
    doc.text(lines[0] || '—', fx + 8, fy + 25);
  };

  const drawFooter = (pageNum, totalPages) => {
    fillRect(0, H - 42, W, 42, C.primary);
    fillRect(0, H - 42, W, 2, C.primaryLight);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); setTxt(C.mutedText);
    doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', W / 2, H - 22, { align: 'center' });
    doc.text('Tel: 961 118 0157  ·  WhatsApp: 961 333 6529  ·  SIEEG Ingeniería y Telecomunicaciones', W / 2, H - 10, { align: 'center' });

    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); setTxt(C.mutedText);
    doc.text(`Pág. ${pageNum} / ${totalPages}`, W - 28, H - 14, { align: 'right' });
  };

  const drawSignatures = (yStart) => {
    const bW = 220, bH = 78;
    const gapSig = 18;
    const leftX = 34;
    const rightX = leftX + bW + gapSig;

    setStroke(C.border);
    doc.setLineWidth(0.6);

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
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setTxt(C.primary);
    doc.text('FIRMA DEL CLIENTE', leftX + bW / 2, yStart + 60, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTxt(C.bodyText);
    doc.text(order.clientName || '', leftX + bW / 2, yStart + 69, { align: 'center' });

    fillRR(rightX, yStart, bW, bH, 6, C.offWhite);
    setStroke(C.border);
    doc.roundedRect(rightX, yStart, bW, bH, 6, 6, 'S');
    setStroke(C.primary);
    doc.line(rightX + 12, yStart + 50, rightX + bW - 12, yStart + 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setTxt(C.primary);
    doc.text('FIRMA DEL TÉCNICO', rightX + bW / 2, yStart + 60, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTxt(C.bodyText);
    doc.text(order.tecnico || '', rightX + bW / 2, yStart + 69, { align: 'center' });
  };

  y = sectionHeader('Información del Cliente', mx, y, cw); y += 7;
  const col3 = (cw - gap * 2) / 3;
  fieldCell('Nombre Completo', order.clientName || '—', mx, y, col3);
  fieldCell('Teléfono', order.telefono || '—', mx + col3 + gap, y, col3);
  fieldCell('Correo Electrónico', order.correo || '—', mx + col3 * 2 + gap * 2, y, col3);
  y += 44;

  y = sectionHeader('Información del Equipo', mx, y, cw); y += 7;
  const col4 = (cw - gap * 3) / 4;
  fieldCell('Tipo de Equipo', order.tipo || '—', mx, y, col4);
  fieldCell('Marca', order.marca || '—', mx + col4 + gap, y, col4);
  fieldCell('Modelo', order.modelo || '—', mx + col4 * 2 + gap * 2, y, col4);
  fieldCell('Núm. de Serie', order.serie || '—', mx + col4 * 3 + gap * 3, y, col4);
  y += 44;

  y = sectionHeader('Accesorios y Seguridad', mx, y, cw); y += 7;
  const half = (cw - gap) / 2;
  const accs = [order.accesorios, order.otrosAccesorios].filter(Boolean).join(', ') || 'Sin accesorios marcados';
  fieldCell('Accesorios Incluidos', accs, mx, y, half);
  fieldCell('Contraseña / PIN', order.seguridad || '—', mx + half + gap, y, half);
  y += 44;

  y = sectionHeader('Descripción del Problema Reportado', mx, y, cw); y += 7;
  const probLines = doc.splitTextToSize(String(details), cw - 24);
  const probH = Math.max(50, probLines.length * 13 + 24);
  fillRR(mx, y, cw, probH, 4, C.white);
  strokeRR(mx, y, cw, probH, 4, C.border, 0.4);
  fillRR(mx, y, cw, 2.5, 1, C.accent);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setTxt(C.bodyText);
  doc.text(probLines, mx + 10, y + 17);
  y += probH + 14;

  y = sectionHeader('Asignación y Resumen Económico', mx, y, cw); y += 7;
  const col3b = (cw - gap * 2) / 3;
  fieldCell('Técnico Responsable', order.tecnico || '—', mx, y, col3b);
  fieldCell('Estado de la Orden', statusLabel || '—', mx + col3b + gap, y, col3b);

  const totX = mx + col3b * 2 + gap * 2;
  const totW = col3b;
  fillRR(totX, y, totW, 33, 4, C.primary);
  strokeRR(totX, y, totW, 33, 4, C.primaryLight, 0.8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6); setTxt(C.mutedText);
  doc.text('TOTAL', totX + 8, y + 12);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); setTxt(C.white);
  doc.text(total, totX + totW / 2, y + 27, { align: 'center' });

  drawFooter(1, 2);

  doc.addPage();
  fillRect(0, 0, W, H, C.offWhite);
  fillRR(20, 20, W - 40, H - 40, 8, C.white);

  let ty = 40;
  ty = sectionHeader('Términos y Condiciones del Servicio', 34, ty, W - 68);
  ty += 10;

  doc.setFont('helvetica', 'italic');
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
    doc.setFont('helvetica', 'normal');
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
