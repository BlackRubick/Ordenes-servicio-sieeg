import jsPDF from 'jspdf';

export async function generateQuotePdfDoc(quote) {
  console.log('DEBUG PDF: quote.partidas[0]:', quote.partidas?.[0]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const rgb    = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  const fill   = (hex) => doc.setFillColor(...rgb(hex));
  const stroke = (hex) => doc.setDrawColor(...rgb(hex));
  const color  = (hex) => doc.setTextColor(...rgb(hex));

  const NAVY      = '#1a3a5e';
  const BLACK     = '#222222';
  const GRAY_ROW  = '#e8e8e8';
  const WHITE     = '#FFFFFF';
  const LIGHT_BOX = '#f0f4f8';

  // ── Logo ──────────────────────────────────────────────────
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

  const MX     = 28;
  const tableW = W - MX * 2;

  // ══════════════════════════════════════════════════════════
  // ENCABEZADO
  // ══════════════════════════════════════════════════════════
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', MX, 10, 160, 72);
  }

  const dCX = W / 2 + 10 + (W - MX - (W / 2 + 10)) / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  color(BLACK);
  doc.text('Blvd. Belisario Dominguez #4213 L5', dCX, 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Razon Social: ' + (quote.razonSocial || ''), dCX, 34, { align: 'center' });
  doc.text('RFC: ' + (quote.rfc || ''), dCX, 47, { align: 'center' });
  if (quote.repse && quote.repse.trim() !== '') {
    doc.text('REPSE: ' + quote.repse, dCX, 60, { align: 'center' });
  }

  const cnLabel  = 'Cotización N.';
  const cnValue  = quote.numeroCotizacion || '';
  const cnLabelW = doc.getTextWidth(cnLabel);
  const cnX      = dCX - (cnLabelW + doc.getTextWidth('  ' + cnValue) + 10) / 2;
  doc.setFont('helvetica', 'normal');
  doc.text(cnLabel, cnX, 76);
  doc.setFont('helvetica', 'bold');
  doc.text(cnValue, cnX + cnLabelW + 10, 76);

  // Removed header separator line (was drawing a thin horizontal line at y=90)
  // stroke('#bbbbbb');
  // doc.setLineWidth(0.6);
  // doc.line(MX, 90, W - MX, 90);

  // ══════════════════════════════════════════════════════════
  // GRID DATOS GENERALES
  // ══════════════════════════════════════════════════════════
  const colW = tableW / 4;
  const hH = 24, vH = 20;
  let gy = 92;

  const gridRows = [
    [
      { label: 'Fecha',    value: quote.fecha || '' },
      { label: 'Vigencia', value: quote.vigencia ? quote.vigencia + ' DIAS' : '' },
      { label: 'Empresa',  value: quote.empresa || '' },
      { label: 'Cliente',  value: quote.cliente || '' },
    ],
    [
      { label: 'Telefono',           value: quote.telefono         || '' },
      { label: 'Direccion',          value: quote.direccionCliente || '' },
      { label: 'Correo Eléctronico', value: quote.correo           || '' },
      { label: 'Otro.',              value: quote.otro             || '-------' },
    ],
  ];

  gridRows.forEach((row) => {
    row.forEach(({ label }, i) => {
      const x = MX + i * colW;
      fill(LIGHT_BOX);
      doc.setLineWidth(0.4);
      doc.rect(x, gy, colW, hH, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(NAVY);
      doc.text(label, x + colW / 2, gy + hH / 2 + 3.5, { align: 'center' });
    });
    gy += hH;
    row.forEach(({ value }, i) => {
      const x = MX + i * colW;
      fill(WHITE);
      doc.setLineWidth(0.4);
      doc.rect(x, gy, colW, vH, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); color(BLACK);
      doc.text(doc.splitTextToSize(value, colW - 8)[0] || '', x + colW / 2, gy + vH / 2 + 3, { align: 'center' });
    });
    gy += vH;
  });

  // ── Descripción ───────────────────────────────────────────
const bodyY = gy + 8;

  // ══════════════════════════════════════════════════════════
  // COLUMNAS DE LA TABLA
  // ══════════════════════════════════════════════════════════
  const TC = [
    { label: 'CANTIDAD',         key: 'cantidad',       x: MX,      w: 55  },
    { label: 'DESCRIPCION',      key: 'descripcion',    x: MX+55,   w: 210 },
    { label: 'UNIDAD',           key: 'unidad',         x: MX+265,  w: 58  },
    { label: 'PRECIO\nUNITARIO', key: 'precioUnitario', x: MX+323,  w: 82  },
    { label: 'IMPORTE',          key: 'importe',        x: MX+405,  w: tableW - 405 },
  ];

  const thH  = 32;
  const rowH = 22;

  // ══════════════════════════════════════════════════════════
  // ZONA FIJA AL PIE: totales (3×20) + banco (2 líneas) + margen
  // Esto se dibuja SIEMPRE al fondo, independiente de cuántos productos haya
  // ══════════════════════════════════════════════════════════
  const tRowH   = 20;
  const bankH   = 40;  // 2 líneas de texto banco
  const footerY = H - bankH - tRowH * 3 - 14; // Y donde empiezan los totales

  // — Totales —
  const subtotal = (quote.partidas || []).reduce((s, p) => s + (parseFloat(p.importe) || 0), 0);
  const iva      = subtotal * 0.16;
  const total    = subtotal + iva;

  const tLabelCol = TC[3];
  const tValCol   = TC[4];
  let totY = footerY;

  // Observaciones: caja a la izquierda de los totales
  const obsX = MX;
  const obsW = tLabelCol.x - MX;
  const obsY = footerY;
  const obsH = tRowH * 3;
  fill(LIGHT_BOX);
  doc.setLineWidth(0.3);
  doc.rect(obsX, obsY, obsW, obsH, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5); color(BLACK);
  // Usar únicamente el campo `observaciones` proporcionado por el formulario.
  const obsText = quote.observaciones && String(quote.observaciones).trim()
    ? String(quote.observaciones)
    : '';
  if (obsText !== '') {
    const obsLines = doc.splitTextToSize(obsText, obsW - 12);
    // dibujar el texto dentro del cuadro con un pequeño padding
    doc.text(obsLines, obsX + 6, obsY + 12);
  }

  [
    { label: 'SUBTOTAL', value: subtotal },
    { label: 'IVA',      value: iva      },
    { label: 'TOTAL',    value: total    },
  ].forEach(({ label, value }) => {
    fill(LIGHT_BOX);
    doc.setLineWidth(0.3);
    doc.rect(tLabelCol.x, totY, tLabelCol.w, tRowH, 'F');
    doc.rect(tValCol.x,   totY, tValCol.w,   tRowH, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); color(BLACK);
    doc.text(label, tLabelCol.x + tLabelCol.w / 2, totY + tRowH / 2 + 3, { align: 'center' });
    doc.text(
      '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      tValCol.x + tValCol.w / 2, totY + tRowH / 2 + 3, { align: 'center' }
    );
    totY += tRowH;
  });

  // — Datos bancarios —
  // (Los datos bancarios se renderizan más abajo según el emisor)

  // ══════════════════════════════════════════════════════════
  // ENCABEZADO DE TABLA
  // ══════════════════════════════════════════════════════════
  TC.forEach(({ x, w }) => {
    fill(NAVY);
    doc.setLineWidth(0.3);
    doc.rect(x, bodyY, w, thH, 'F');
  });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); color(WHITE);
  TC.forEach(({ label, x, w }) => {
    const lines = label.split('\n');
    if (lines.length === 2) {
      doc.text(lines[0], x + w / 2, bodyY + 12, { align: 'center' });
      doc.text(lines[1], x + w / 2, bodyY + 23, { align: 'center' });
    } else {
      doc.text(label, x + w / 2, bodyY + thH / 2 + 4, { align: 'center' });
    }
  });

  // ══════════════════════════════════════════════════════════
  // FILAS DE PRODUCTOS — crecen hacia abajo desde el header
  // Se detienen antes de pisar los totales
  // Incluyen observaciones debajo de cada producto si existen
  // ══════════════════════════════════════════════════════════
  const partidas    = quote.partidas || [];
  const tableEndY   = footerY - 6; // límite: no pisar totales
  let ry = bodyY + thH;

  partidas.forEach((p, i) => {
    console.log(`DEBUG PDF: Partida ${i}:`, JSON.stringify(p, null, 2));
    const descLines = doc.splitTextToSize(String(p.descripcion || ''), TC[1].w - 6);
    const dynH = Math.max(rowH, descLines.length * 11 + 10);

    // Si no cabe en la zona disponible, parar (evitar solaparse con totales)
    if (ry + dynH > tableEndY) return;

    // ─ Dibujar fila del producto ─
    fill(i % 2 === 0 ? GRAY_ROW : WHITE);
    doc.setLineWidth(0.3);
    TC.forEach(({ x, w }) => doc.rect(x, ry, w, dynH, 'F'));

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(BLACK);

    const row = {
      cantidad:       String(p.cantidad || ''),
      descripcion:    String(p.descripcion || ''),
      unidad:         String(p.unidad || ''),
      precioUnitario: '$' + (Number(p.precioUnitario)||0).toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      importe:        '$' + (Number(p.importe)       ||0).toLocaleString('es-MX', { minimumFractionDigits: 2 }),
    };

    TC.forEach(({ key, x, w }) => {
      if (key === 'descripcion') {
        doc.text(descLines, x + 4, ry + 9);
      } else {
        doc.text(row[key], x + w / 2, ry + dynH / 2 + 3, { align: 'center' });
      }
    });

    ry += dynH;

    // ─ Si hay observaciones, dibuja una fila adicional debajo ─
      const hasObservaciones = p.observaciones && String(p.observaciones).trim() !== '';
      if (hasObservaciones) {
        const obsLines = doc.splitTextToSize(String(p.observaciones), TC[1].w - 12);
        const obsH = Math.max(12, obsLines.length * 8 + 8);

        // Verificar si cabe
        if (ry + obsH > tableEndY) return;

        // Texto de observaciones: negrita, pequeño y en color gris-azulado
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6); color('#3b556f');
        const textX = TC[1].x + 6;
        let textY = ry + 6;
        obsLines.forEach((ln) => {
          doc.text(ln, textX, textY);
          textY += 8;
        });

        // Espacio después de observaciones
        ry += obsH + 4;
      }
  });

  // ══════════════════════════════════════════════════════════
  // TEXTO DE PRUEBA DE RENDIMIENTO EN LA MITAD DEL PDF
  // Se muestra solo cuando el checkbox está activo
  // ══════════════════════════════════════════════════════════
  if (quote.pruebaRendimiento) {
    const rendimientoParagraphs = [
      'Pruebas Foráneas. Se describe el alcance y condiciones del servicio de validación, pruebas de rendimiento y/o certificación de cableado estructurado realizadas con equipo certificador Fluke DSX2-5000.',
      'Las pruebas de rendimiento al interior de la República Mexicana, se realiza 1 prueba por nodo para validación y 1 prueba extra en caso de no pasar. Se requiere 1 técnico de parte del cliente para apoyar en la identificación de los servicios.',
    ];
    const rendimientoBoxWidth = Math.min(320, tableW - 120);
    const rendimientoX = MX + (tableW - rendimientoBoxWidth) / 2;
    const rendimientoLineH = 11;
    const rendimientoGap = 8;
    const rendimientoWrapped = rendimientoParagraphs.map((paragraph) => doc.splitTextToSize(paragraph, rendimientoBoxWidth));
    const rendimientoH = rendimientoWrapped.reduce((sum, lines) => sum + (lines.length * rendimientoLineH), 0) + rendimientoGap;
    let rendimientoY = Math.max(ry + 24, ry + ((footerY - ry - rendimientoH) / 2));

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    color(BLACK);
    rendimientoWrapped.forEach((lines, index) => {
      doc.text(lines, rendimientoX, rendimientoY);
      rendimientoY += lines.length * rendimientoLineH + (index === 0 ? rendimientoGap : 0);
    });
  }

  // ══════════════════════════════════════════════════════════
  // DATOS BANCARIOS SEGÚN EMISOR
  // ══════════════════════════════════════════════════════════
  // Asegurar que los datos bancarios queden al final, justo debajo de los totales
  // añadir un salto extra para que no quede tan pegado a los totales
  let bankY = footerY + tRowH * 3 + 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  color(NAVY);
  if ((quote.razonSocial || '').toUpperCase().includes('SIEEG')) {
    doc.text('cuenta bbva : 0123875156   clabe 012100001238751568   Nombre SIEEG INGENIERIA Y TELECOMUNICACIONES SA DE CV', MX, bankY);
  } else {
    doc.text('Banorte Cta : 0295855215     Clabe : 072 100 002958552154   Nombre:  Sinar Adrián Casanova García', MX, bankY);
    bankY += 16;
    doc.text('Bbva       Cta : 0480072338     Clabe: 012 100 004800723387    Nombre: Sinar Adrián Casanova García', MX, bankY);
  }
  return doc;
}