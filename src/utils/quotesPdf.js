import jsPDF from 'jspdf';

export async function generateQuotePdfDoc(quote) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ── Colores fieles al PDF de referencia ───────────────────
  const NAVY      = '#1a3a5e';
  const BLACK     = '#222222';
  const GRAY_ROW  = '#e8e8e8';
  const WHITE     = '#FFFFFF';
  const LIGHT_BOX = '#f0f4f8';

  const rgb    = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  const fill   = (hex) => doc.setFillColor(...rgb(hex));
  const stroke = (hex) => doc.setDrawColor(...rgb(hex));
  const color  = (hex) => doc.setTextColor(...rgb(hex));

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

  const MX = 28;

  // ══════════════════════════════════════════════════════════
  // ENCABEZADO: Logo izquierda | Datos empresa derecha
  // ══════════════════════════════════════════════════════════
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', MX, 10, 160, 72);
  }

  // Datos empresa — derecha, centrados en su columna
  const dX = W / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  color(BLACK);
  doc.text('Blvd. Belisario Dominguez #4213 L5', dX + (W - MX - dX) / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Razon Social: ' + (quote.razonSocial || ''), dX + (W - MX - dX) / 2, 34, { align: 'center' });
  doc.text('RFC: ' + (quote.rfc || ''), dX + (W - MX - dX) / 2, 47, { align: 'center' });
  doc.text('REPSE: ' + (quote.repse || ''), dX + (W - MX - dX) / 2, 60, { align: 'center' });

  // Línea "Cotización N." con valor en negrita
  const cnY = 76;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  color(BLACK);
  const cnLabel = 'Cotización N.';
  const cnValue = quote.numeroCotizacion || '';
  const cnLabelW = doc.getTextWidth(cnLabel);
  const cnTotalW = cnLabelW + doc.getTextWidth('  ' + cnValue) + 10;
  const cnX = dX + (W - MX - dX) / 2 - cnTotalW / 2;
  doc.text(cnLabel, cnX, cnY);
  doc.setFont('helvetica', 'bold');
  doc.text(cnValue, cnX + cnLabelW + 10, cnY);

  // Línea separadora
  stroke('#bbbbbb');
  doc.setLineWidth(0.6);
  doc.line(MX, 90, W - MX, 90);

  // ══════════════════════════════════════════════════════════
  // GRID DATOS GENERALES (2 filas × 4 celdas)
  // ══════════════════════════════════════════════════════════
  const tableW = W - MX * 2;
  const colW   = tableW / 4;
  const gY     = 92;
  const hH     = 24; // altura fila etiqueta
  const vH     = 20; // altura fila valor

  const rows = [
    [
      { label: 'Fecha',    value: quote.fecha || '' },
      { label: 'Vigencia', value: quote.vigencia ? quote.vigencia + ' DIAS' : '' },
      { label: 'Empresa',  value: quote.empresa || '' },
      { label: 'Cliente',  value: quote.cliente || '' },
    ],
    [
      { label: 'Telefono',           value: quote.telefono || '' },
      { label: 'Direccion',          value: quote.direccionCliente || '' },
      { label: 'Correo Eléctronico', value: quote.correo || '' },
      { label: 'Otro.',              value: quote.otro || '-------' },
    ],
  ];

  let gy = gY;
  rows.forEach((row) => {
    // Fila etiquetas
    row.forEach(({ label }, i) => {
      const x = MX + i * colW;
      fill(LIGHT_BOX);
      stroke('#cccccc');
      doc.setLineWidth(0.4);
      doc.rect(x, gy, colW, hH, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      color(NAVY);
      doc.text(label, x + colW / 2, gy + hH / 2 + 3.5, { align: 'center' });
    });
    gy += hH;
    // Fila valores
    row.forEach(({ value }, i) => {
      const x = MX + i * colW;
      fill(WHITE);
      stroke('#cccccc');
      doc.setLineWidth(0.4);
      doc.rect(x, gy, colW, vH, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      color(BLACK);
      const safe = doc.splitTextToSize(value, colW - 8)[0] || '';
      doc.text(safe, x + colW / 2, gy + vH / 2 + 3, { align: 'center' });
    });
    gy += vH;
  });

  // ── Descripción general ───────────────────────────────────
  const desc = quote.descripcionGeneral || 'Por este medio pongo a su disposición la cotización solicitada.';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  color(BLACK);
  doc.text(desc, W - MX, gy + 14, { align: 'right', maxWidth: tableW * 0.6 });
  let bodyY = gy + 26;

  // ══════════════════════════════════════════════════════════
  // TABLA DE PARTIDAS
  // ══════════════════════════════════════════════════════════
  // Columnas
  const TC = [
    { label: 'PARTIDA',          key: 'idx',            x: MX,       w: 46  },
    { label: 'CANTIDAD',         key: 'cantidad',       x: MX+46,    w: 55  },
    { label: 'DESCRIPCION',      key: 'descripcion',    x: MX+101,   w: 210 },
    { label: 'UNIDAD',           key: 'unidad',         x: MX+311,   w: 58  },
    { label: 'PRECIO\nUNITARIO', key: 'precioUnitario', x: MX+369,   w: 82  },
    { label: 'IMPORTE',          key: 'importe',        x: MX+451,   w: W - MX*2 - 451 },
  ];

  const thH  = 32;
  const rowH = 22;

  // Encabezado
  TC.forEach(({ x, w }) => {
    fill(NAVY); stroke(NAVY);
    doc.setLineWidth(0.3);
    doc.rect(x, bodyY, w, thH, 'FD');
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  color(WHITE);
  TC.forEach(({ label, x, w }) => {
    const lines = label.split('\n');
    if (lines.length === 2) {
      doc.text(lines[0], x + w / 2, bodyY + 12, { align: 'center' });
      doc.text(lines[1], x + w / 2, bodyY + 23, { align: 'center' });
    } else {
      doc.text(label, x + w / 2, bodyY + thH / 2 + 4, { align: 'center' });
    }
  });

  // Filas: datos + vacías hasta llenar (igual al PDF ref con fondo gris)
  const partidas   = quote.partidas || [];
  const usedH      = bodyY + thH;
  const footerH    = 70; // espacio para totales + banco
  const availRows  = Math.floor((H - usedH - footerH) / rowH);
  const totalRows  = Math.max(partidas.length, availRows);

  let ry = bodyY + thH;

  for (let i = 0; i < totalRows; i++) {
    const p = partidas[i];

    fill(GRAY_ROW);
    stroke('#bbbbbb');
    doc.setLineWidth(0.3);
    TC.forEach(({ x, w }) => doc.rect(x, ry, w, rowH, 'FD'));

    if (p) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      color(BLACK);

      const row = {
        idx:            String(i + 1),
        cantidad:       String(p.cantidad || ''),
        descripcion:    String(p.descripcion || ''),
        unidad:         String(p.unidad || ''),
        precioUnitario: '$' + (Number(p.precioUnitario)||0).toLocaleString('es-MX', { minimumFractionDigits: 2 }),
        importe:        '$' + (Number(p.importe)       ||0).toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      };

      TC.forEach(({ key, x, w }) => {
        if (key === 'descripcion') {
          const lines = doc.splitTextToSize(row[key], w - 6);
          doc.text(lines, x + 4, ry + 8);
        } else {
          doc.text(row[key], x + w / 2, ry + rowH / 2 + 3, { align: 'center' });
        }
      });
    }

    ry += rowH;
  }

  // ══════════════════════════════════════════════════════════
  // TOTALES (bajo tabla, alineados con últimas 2 columnas)
  // ══════════════════════════════════════════════════════════
  const subtotal = partidas.reduce((s, p) => s + (parseFloat(p.importe) || 0), 0);
  const iva      = subtotal * 0.16;
  const total    = subtotal + iva;

  const tLabelCol = TC[4]; // PRECIO UNITARIO → label totales
  const tValCol   = TC[5]; // IMPORTE         → valor totales
  const tRowH     = 20;

  [
    { label: 'SUBTOTAL', value: subtotal },
    { label: 'IVA',      value: iva      },
    { label: 'TOTAL',    value: total    },
  ].forEach(({ label, value }, idx) => {
    fill(LIGHT_BOX);
    stroke('#bbbbbb');
    doc.setLineWidth(0.3);
    doc.rect(tLabelCol.x, ry, tLabelCol.w, tRowH, 'FD');
    doc.rect(tValCol.x,   ry, tValCol.w,   tRowH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    color(BLACK);
    doc.text(label,
      tLabelCol.x + tLabelCol.w / 2,
      ry + tRowH / 2 + 3,
      { align: 'center' });
    doc.text(
      '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      tValCol.x + tValCol.w / 2,
      ry + tRowH / 2 + 3,
      { align: 'center' });

    ry += tRowH;
  });

  // ══════════════════════════════════════════════════════════
  // DATOS BANCARIOS
  // ══════════════════════════════════════════════════════════
  const bankY = ry + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  color(BLACK);
  doc.text('Banorte Cta : 0295855215     Clabe : 072 100 002958552154   Nombre: Sinar Adrián Casanova García', MX, bankY);
  doc.text('Bbva       Cta : 0480072338     Clabe: 012 100 004800723387    Nombre: Sinar Adrián Casanova García', MX, bankY + 14);

  return doc;
}