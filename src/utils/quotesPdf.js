import jsPDF from 'jspdf';

// mode: 'client' (default, oculta precioCosto) | 'internal' (muestra columna COSTO)
export async function generateQuotePdfDoc(quote, mode = 'client') {
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

  const fitSingleLineText = (text, maxWidth, maxFontSize = 8.5, minFontSize = 6.5) => {
    const cleanText = String(text ?? '').trim();
    if (!cleanText) return { text: '', fontSize: maxFontSize };

    let fontSize = maxFontSize;
    doc.setFont('helvetica', 'normal');
    while (fontSize > minFontSize) {
      doc.setFontSize(fontSize);
      if (doc.getTextWidth(cleanText) <= maxWidth) break;
      fontSize -= 0.5;
    }

    return { text: cleanText, fontSize };
  };

  const fitWrappedText = (text, maxWidth, maxFontSize = 8.5, minFontSize = 6.5, maxLines = 2) => {
    const cleanText = String(text ?? '').trim();
    if (!cleanText) return { lines: [], fontSize: maxFontSize };

    let fontSize = maxFontSize;
    let lines = [];

    while (fontSize > minFontSize) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      lines = doc.splitTextToSize(cleanText, maxWidth);
      if (lines.length <= maxLines) break;
      fontSize -= 0.5;
    }

    // No truncar con '...': si con el tamaño mínimo sigue habiendo más líneas,
    // devolver todas las líneas para que el alto de la fila aumente y el texto
    // quede visible (se evita recortar con puntos suspensivos).
    // Esto permite que la descripción/observaciones se muestren completas.

    return { lines, fontSize };
  };

  const fitWrappedTextStyled = (text, maxWidth, maxFontSize = 7.5, minFontSize = 6, maxLines = 3, fontStyle = 'normal') => {
    const cleanText = String(text ?? '').trim();
    if (!cleanText) return { lines: [], fontSize: maxFontSize };

    let fontSize = maxFontSize;
    let lines = [];

    while (fontSize >= minFontSize) {
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(fontSize);
      lines = doc.splitTextToSize(cleanText, maxWidth);
      if (lines.length <= maxLines) break;
      fontSize -= 0.25;
    }

    // Si con el tamaño mínimo hay más líneas, devolver todas las líneas
    // para que el alto de la fila aumente y el texto quede visible.
    // No se añaden puntos suspensivos.

    return { lines, fontSize };
  };

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
  const logoBase64        = await getLogoBase64('/images/logo.ico');
  const bbvaLogoBase64    = await getLogoBase64('/images/bbva-logo.png');
  const banorteLogoBase64 = await getLogoBase64('/images/banorte-logo.png');

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

  const valueLayout = gridRows.map((row) => row.map(({ value }) => fitWrappedText(value, colW - 8, 8.5, 6.5, 2)));
  const valueHeights = valueLayout.map((row) => Math.max(vH, ...row.map((entry) => Math.max(vH, entry.lines.length * 9 + 8))));

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
    const rowIndex = gridRows.indexOf(row);
    const rowValueHeight = valueHeights[rowIndex] || vH;
    row.forEach(({ value }, i) => {
      const x = MX + i * colW;
      fill(WHITE);
      doc.setLineWidth(0.4);
      doc.rect(x, gy, colW, rowValueHeight, 'F');
      const fitted = valueLayout[rowIndex][i];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fitted.fontSize);
      color(BLACK);
      if (fitted.lines.length <= 1) {
        doc.text(fitted.lines[0] || '', x + colW / 2, gy + rowValueHeight / 2 + 3, { align: 'center' });
      } else {
        const lineGap = 9;
        const startY = gy + (rowValueHeight - (fitted.lines.length - 1) * lineGap) / 2 + 3;
        fitted.lines.forEach((line, lineIndex) => {
          doc.text(line, x + colW / 2, startY + lineIndex * lineGap, { align: 'center' });
        });
      }
    });
    gy += rowValueHeight;
  });

  // ── Descripción ───────────────────────────────────────────
const bodyY = gy + 8;

  // ══════════════════════════════════════════════════════════
  // COLUMNAS DE LA TABLA (varía según el modo)
  // ══════════════════════════════════════════════════════════
  const TC = mode === 'internal'
    ? [
        { label: 'CANTIDAD',    key: 'cantidad',       x: MX,      w: 50  },
        { label: 'DESCRIPCION', key: 'descripcion',    x: MX+50,   w: 170 },
        { label: 'UNIDAD',      key: 'unidad',         x: MX+220,  w: 48  },
        { label: 'COSTO',       key: 'precioCosto',    x: MX+268,  w: 65  },
        { label: 'P. NETO',     key: 'precioUnitario', x: MX+333,  w: 67  },
        { label: 'IMPORTE',     key: 'importe',        x: MX+400,  w: tableW - 400 },
      ]
    : [
        { label: 'CANTIDAD',    key: 'cantidad',       x: MX,      w: 55  },
        { label: 'DESCRIPCION', key: 'descripcion',    x: MX+55,   w: 210 },
        { label: 'UNIDAD',      key: 'unidad',         x: MX+265,  w: 58  },
        { label: 'P. NETO',     key: 'precioUnitario', x: MX+323,  w: 82  },
        { label: 'IMPORTE',     key: 'importe',        x: MX+405,  w: tableW - 405 },
      ];

  const thH  = 26;
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
  const obsText = quote.observaciones && String(quote.observaciones).trim()
    ? String(quote.observaciones).trim()
    : '';
  if (obsText !== '') {
    const allObsLines = doc.splitTextToSize(obsText, obsW - 12);
    const obsLineH = 6.5;
    const maxLines = Math.max(1, Math.floor((obsH - 10) / obsLineH));
    const visibleLines = allObsLines.slice(0, maxLines);
    doc.text(visibleLines, obsX + 6, obsY + 9);
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
      '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      tValCol.x + tValCol.w / 2, totY + tRowH / 2 + 3, { align: 'center' }
    );
    totY += tRowH;
  });

  // — Datos bancarios —
  // (Los datos bancarios se renderizan más abajo según el emisor)
  // Los logos se cargan al inicio del documento para usarlos aquí.

  // ══════════════════════════════════════════════════════════
  // ENCABEZADO DE TABLA
  // ══════════════════════════════════════════════════════════
  TC.forEach(({ x, w }) => {
    fill(NAVY);
    doc.setLineWidth(0.3);
    doc.rect(x, bodyY, w, thH, 'F');
  });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(WHITE);
  TC.forEach(({ label, x, w }) => {
    const lines = label.split('\n');
    if (lines.length === 2) {
      doc.text(lines[0], x + w / 2, bodyY + 10, { align: 'center' });
      doc.text(lines[1], x + w / 2, bodyY + 18, { align: 'center' });
    } else {
      doc.text(label, x + w / 2, bodyY + thH / 2 + 1, { align: 'center' });
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
    // Separar descripción y observaciones y calcular la altura total de la celda
    const obsText = p.observaciones && String(p.observaciones).trim() !== '' ? String(p.observaciones) : '';
    const descFit = fitWrappedTextStyled(p.descripcion || '', TC[1].w - 8, 7.5, 6, 3, 'normal');
    const obsFit  = obsText ? fitWrappedTextStyled(obsText, TC[1].w - 8, 7.2, 6, 2, 'bold') : { lines: [], fontSize: 7.2 };
    const combinedLines = descFit.lines.concat(obsFit.lines);
    const lineGap = 9;
    const dynH = Math.max(rowH, combinedLines.length * lineGap + 8);

    // Verificar si cabe (producto con su descripción/observaciones)
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
      precioCosto:    p.precioCosto !== '' && p.precioCosto !== undefined && p.precioCosto !== null
        ? '$' + (Number(p.precioCosto)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '—',
      precioUnitario: '$' + (Number(p.precioUnitario)||0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      importe:        '$' + (Number(p.importe)       ||0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };

    TC.forEach(({ key, x, w }) => {
      if (key === 'descripcion') {
        // Renderizar descripción (normal) con ajuste dinámico de tamaño
        doc.setFont('helvetica', 'normal'); doc.setFontSize(descFit.fontSize); color(BLACK);
        // Calcular posición inicial para centrar verticalmente el bloque de texto
        const totalLines = descFit.lines.length + obsFit.lines.length;
        const totalTextHeight = totalLines * lineGap;
        let startY = ry + Math.max(8, (dynH - totalTextHeight) / 2 + 6);
        let ly = startY;
        descFit.lines.forEach((ln) => {
          doc.text(ln, x + 4, ly);
          ly += lineGap;
        });
        // Renderizar observaciones en negrita si existen (también con ajuste dinámico)
        if (obsFit.lines.length) {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(obsFit.fontSize); color(BLACK);
          obsFit.lines.forEach((ln) => {
            doc.text(ln, x + 4, ly);
            ly += lineGap;
          });
          // restaurar fuente normal para las demás celdas
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(BLACK);
        }
      } else if (key === 'precioCosto') {
        const hasCosto = p.precioCosto !== '' && p.precioCosto !== undefined && p.precioCosto !== null;
        const hasUtil  = p.utilidad !== '' && p.utilidad !== undefined && p.utilidad !== null;
        const costoStr = hasCosto
          ? '$' + (Number(p.precioCosto)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '—';
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(BLACK);
        if (hasCosto && hasUtil) {
          const ganancia = (Number(p.precioUnitario) || 0) - (Number(p.precioCosto) || 0);
          const utilStr = `(${parseFloat(p.utilidad).toFixed(1)}% / $${ganancia.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
          doc.text(costoStr, x + w / 2, ry + dynH / 2, { align: 'center' });
          doc.setFontSize(5.5); color('#16a34a');
          doc.text(utilStr, x + w / 2, ry + dynH / 2 + 5.5, { align: 'center' });
          doc.setFontSize(7.5); color(BLACK);
        } else {
          doc.text(costoStr, x + w / 2, ry + dynH / 2 + 3, { align: 'center' });
        }
      } else if (key === 'cantidad') {
        doc.text(row[key], x + w / 2, ry + dynH / 2 + 3, { align: 'center' });
      } else if (key === 'unidad' || key === 'precioUnitario' || key === 'importe') {
        doc.text(row[key], x + w / 2, ry + dynH / 2 + 3, { align: 'center' });
      } else {
        doc.text(row[key], x + w / 2, ry + 8, { align: 'center' });
      }
    });

    ry += dynH;
  });

  // ══════════════════════════════════════════════════════════
  // OBSERVACIONES EXTRA EN LA MITAD DEL PDF
  // Se muestran solo cuando el checkbox está activo y hay texto capturado
  // ══════════════════════════════════════════════════════════
  const observacionesExtra = String(quote.observacionesExtra || '').trim();
  if (quote.pruebaRendimiento && observacionesExtra) {
    const boxWidth = 480;
    const boxX = (W - boxWidth) / 2 + 20; // Centrado + 20px hacia la derecha
    const bodyWidth = boxWidth - 10;
    const wrapped = doc.splitTextToSize(observacionesExtra, bodyWidth);
    const bodyLineH = 7;
    const boxH = (wrapped.length * bodyLineH) + 8;
    const boxY = Math.max(ry + 20, ry + ((footerY - ry - boxH) / 2));

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    color(BLACK);
    doc.text(wrapped, boxX + 5, boxY + 14);
  }

  // ══════════════════════════════════════════════════════════
  // DATOS BANCARIOS SEGÚN EMISOR
  // ══════════════════════════════════════════════════════════
  // Asegurar que los datos bancarios queden al final, justo debajo de los totales
  // añadir un salto extra para que no quede tan pegado a los totales
  let bankY = footerY + tRowH * 3 + 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  color(NAVY);

  const bankLogoH = 10; // altura en pt para los logos de banco
  const bbvaW     = bbvaLogoBase64    ? bankLogoH * (201 / 60) : 0;
  const banorteW  = banorteLogoBase64 ? bankLogoH * (417 / 60) : 0;

  if ((quote.razonSocial || '').toUpperCase().includes('SIEEG')) {
    if (bbvaLogoBase64) {
      doc.addImage(bbvaLogoBase64, 'PNG', MX, bankY - bankLogoH, bbvaW, bankLogoH);
    }
    doc.text('Cta: 0123875156   Clabe: 012100001238751568   Nombre: SIEEG INGENIERIA Y TELECOMUNICACIONES SA DE CV', MX + bbvaW + 5, bankY);
  } else {
    if (banorteLogoBase64) {
      doc.addImage(banorteLogoBase64, 'PNG', MX, bankY - bankLogoH, banorteW, bankLogoH);
    }
    doc.text('Cta: 0295855215   Clabe: 072 100 002958552154   Nombre: Sinar Adrián Casanova García', MX + banorteW + 5, bankY);
    bankY += 16;
    if (bbvaLogoBase64) {
      doc.addImage(bbvaLogoBase64, 'PNG', MX, bankY - bankLogoH, bbvaW, bankLogoH);
    }
    doc.text('Cta: 0480072338   Clabe: 012 100 004800723387   Nombre: Sinar Adrián Casanova García', MX + bbvaW + 5, bankY);
  }
  return doc;
}