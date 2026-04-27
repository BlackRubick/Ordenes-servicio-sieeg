import jsPDF from 'jspdf';

export async function generateQuotePdfDoc(quote) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ── Helpers ──────────────────────────────────────────────
  const rgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const fill = (hex) => doc.setFillColor(...rgb(hex));
  const stroke = (hex) => doc.setDrawColor(...rgb(hex));
  const txt = (hex) => doc.setTextColor(...rgb(hex));

  // ── Paleta (igual que el Excel) ───────────────────────────
  const NAVY   = '#1a3a5e';   // encabezado azul oscuro
  const WHITE  = '#FFFFFF';
  const BLACK  = '#1A1A2E';
  const GRAY1  = '#f3f6fb';   // fila par tabla
  const GRAY2  = '#FFFFFF';   // fila impar
  const BORDER = '#C5CEE0';   // bordes suaves
  const LBLUE  = '#dde8f5';   // fondo info superior

  // ── Logo ─────────────────────────────────────────────────
  const getLogoBase64 = (src) =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = '';
      img.onload = () => {
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

  // ══════════════════════════════════════════════════════════
  // BLOQUE 1 – HEADER AZUL OSCURO
  // ══════════════════════════════════════════════════════════
  const headerH = 70;
  fill(NAVY);
  doc.rect(0, 0, W, headerH, 'F');

  // Logo (izquierda)
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 22, 10, 100, 50);
  }

  // Texto empresa (derecha del logo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  txt(WHITE);
  doc.text('INGENIERÍA Y TELECOMUNICACIONES', 140, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  txt(WHITE);
  doc.text('SIEEG', 140, 46);

  // Número cotización — badge derecha
  const badgeW = 150;
  const badgeX = W - badgeW - 22;
  fill('#2563a8');
  doc.roundedRect(badgeX, 14, badgeW, 42, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  txt(WHITE);
  doc.text('COTIZACIÓN N.', badgeX + badgeW / 2, 28, { align: 'center' });
  doc.setFontSize(13);
  doc.text(quote.numeroCotizacion || '—', badgeX + badgeW / 2, 46, { align: 'center' });

  // ══════════════════════════════════════════════════════════
  // BLOQUE 2 – DATOS DE LA EMPRESA (fondo azul claro)
  // ══════════════════════════════════════════════════════════
  const infoY = headerH;
  const infoH = 42;
  fill(LBLUE);
  doc.rect(0, infoY, W, infoH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  txt(NAVY);

  const col1 = 22, col2 = 220, col3 = 400;

  // Fila 1
  doc.text('DIRECCIÓN:', col1, infoY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.direccion || '—', col1 + 58, infoY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('RFC:', col2, infoY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.rfc || '—', col2 + 26, infoY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('REPSE:', col3, infoY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.repse || '—', col3 + 38, infoY + 13);

  // Fila 2
  doc.setFont('helvetica', 'bold');
  doc.text('RAZÓN SOCIAL:', col1, infoY + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.razonSocial || '—', col1 + 74, infoY + 29);

  // ══════════════════════════════════════════════════════════
  // BLOQUE 3 – DATOS GENERALES (grid 6 columnas)
  // ══════════════════════════════════════════════════════════
  const gridY = infoY + infoH + 8;
  const gridH = 48;
  const cols = [
    { label: 'FECHA',             value: quote.fecha || '—',                          x: 22,  w: 80  },
    { label: 'VIGENCIA',          value: quote.vigencia ? quote.vigencia + ' DÍAS' : '—', x: 108, w: 80  },
    { label: 'EMPRESA',           value: quote.empresa || '—',                        x: 194, w: 100 },
    { label: 'CLIENTE',           value: quote.cliente || '—',                        x: 300, w: 110 },
    { label: 'TELÉFONO',          value: quote.telefono || '—',                       x: 416, w: 80  },
    { label: 'DIRECCIÓN CLIENTE', value: quote.direccionCliente || '—',               x: 502, w: 93  },
  ];

  cols.forEach(({ label, value, x, w }) => {
    // celda fondo blanco con borde
    fill(WHITE);
    stroke(BORDER);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, gridY, w, gridH, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    txt(NAVY);
    doc.text(label, x + 5, gridY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    txt(BLACK);
    const lines = doc.splitTextToSize(value, w - 10);
    doc.text(lines[0] || '—', x + 5, gridY + 24);
  });

  // Fila 2 del grid: correo + otro
  const grid2Y = gridY + gridH + 4;
  const grid2H = 36;
  const cols2 = [
    { label: 'CORREO ELECTRÓNICO', value: quote.correo || '—', x: 22, w: 270 },
    { label: 'OTRO',               value: quote.otro   || '—', x: 298, w: 297 },
  ];
  cols2.forEach(({ label, value, x, w }) => {
    fill(WHITE);
    stroke(BORDER);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, grid2Y, w, grid2H, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    txt(NAVY);
    doc.text(label, x + 5, grid2Y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    txt(BLACK);
    doc.text(value, x + 5, grid2Y + 23);
  });

  // ── Descripción general ──────────────────────────────────
  let descY = grid2Y + grid2H + 6;
  if (quote.descripcionGeneral) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    txt('#555577');
    doc.text(quote.descripcionGeneral, 22, descY, { maxWidth: W - 44 });
    descY += 16;
  }

  // ══════════════════════════════════════════════════════════
  // BLOQUE 4 – TABLA DE PARTIDAS
  // ══════════════════════════════════════════════════════════
  const tableY = descY + 4;

  // Definición de columnas de la tabla
  const TC = [
    { label: '#',               key: 'idx',           x: 22,  w: 28,  align: 'center' },
    { label: 'CANTIDAD',        key: 'cantidad',       x: 50,  w: 55,  align: 'center' },
    { label: 'DESCRIPCIÓN',     key: 'descripcion',    x: 105, w: 230, align: 'left'   },
    { label: 'UNIDAD',          key: 'unidad',         x: 335, w: 65,  align: 'center' },
    { label: 'PRECIO UNITARIO', key: 'precioUnitario', x: 400, w: 90,  align: 'right'  },
    { label: 'IMPORTE',         key: 'importe',        x: 490, w: 105, align: 'right'  },
  ];

  const tableW = W - 44; // 22 margen c/lado
  const rowH   = 22;
  const thH    = 26;

  // Encabezado de tabla
  fill(NAVY);
  doc.rect(22, tableY, tableW, thH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  txt(WHITE);
  TC.forEach(({ label, x, w, align }) => {
    const tx = align === 'right' ? x + w - 4 : align === 'center' ? x + w / 2 : x + 4;
    doc.text(label, tx, tableY + 17, { align: align === 'left' ? 'left' : align });
  });

  // Filas de partidas
  let ry = tableY + thH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  quote.partidas.forEach((p, i) => {
    const bg = i % 2 === 0 ? GRAY1 : GRAY2;
    fill(bg);
    stroke(BORDER);
    doc.setLineWidth(0.3);
    doc.rect(22, ry, tableW, rowH, 'FD');

    txt(BLACK);
    const row = {
      idx:           String(i + 1),
      cantidad:      String(p.cantidad || ''),
      descripcion:   String(p.descripcion || ''),
      unidad:        String(p.unidad || ''),
      precioUnitario:'$' + (Number(p.precioUnitario) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      importe:       '$' + (Number(p.importe) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }),
    };

    TC.forEach(({ key, x, w, align }) => {
      const val = row[key];
      if (key === 'descripcion') {
        const lines = doc.splitTextToSize(val, w - 6);
        doc.text(lines[0] || '', x + 4, ry + 14);
      } else {
        const tx = align === 'right' ? x + w - 4 : align === 'center' ? x + w / 2 : x + 4;
        doc.text(val, tx, ry + 14, { align: align === 'left' ? 'left' : align });
      }
    });

    // línea separadora vertical entre columnas
    stroke(BORDER);
    doc.setLineWidth(0.3);
    TC.forEach(({ x }, ci) => {
      if (ci > 0) doc.line(x, ry, x, ry + rowH);
    });

    ry += rowH;
  });

  // Borde inferior de la tabla
  stroke(NAVY);
  doc.setLineWidth(0.8);
  doc.line(22, ry, 22 + tableW, ry);

  // ══════════════════════════════════════════════════════════
  // BLOQUE 5 – TOTALES (alineados a la derecha)
  // ══════════════════════════════════════════════════════════
  const subtotal = quote.partidas.reduce((s, p) => s + (parseFloat(p.importe) || 0), 0);
  const iva      = subtotal * 0.16;
  const total    = subtotal + iva;

  const totals = [
    { label: 'SUBTOTAL', value: subtotal },
    { label: 'IVA (16%)', value: iva     },
    { label: 'TOTAL',     value: total   },
  ];

  const totX  = W - 22 - 200;   // inicio bloque totales
  const totW  = 200;
  let   totY  = ry + 10;

  totals.forEach(({ label, value }, i) => {
    const isTotal = i === 2;
    if (isTotal) {
      fill(NAVY);
      doc.rect(totX, totY, totW, 22, 'F');
      txt(WHITE);
    } else {
      fill(i % 2 === 0 ? GRAY1 : WHITE);
      stroke(BORDER);
      doc.setLineWidth(0.3);
      doc.rect(totX, totY, totW, 22, 'FD');
      txt(BLACK);
    }

    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(label, totX + 8, totY + 15);
    doc.text(
      '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      totX + totW - 6,
      totY + 15,
      { align: 'right' },
    );

    // línea divisoria vertical
    stroke(isTotal ? WHITE : BORDER);
    doc.setLineWidth(0.3);
    doc.line(totX + 100, totY, totX + 100, totY + 22);

    totY += 22;
  });

  // ══════════════════════════════════════════════════════════
  // BLOQUE 6 – DATOS BANCARIOS
  // ══════════════════════════════════════════════════════════
  const bankY = Math.max(totY, ry) + 24;
  fill(LBLUE);
  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(22, bankY, tableW, 42, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  txt(NAVY);
  doc.text('DATOS BANCARIOS PARA TRANSFERENCIA', 30, bankY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  txt(BLACK);
  doc.text(
    'Banorte  ·  Cta: 0295855215  ·  CLABE: 072 100 002958552154  ·  Nombre: Sinar Adrián Casanova García',
    30, bankY + 24,
  );
  doc.text(
    'BBVA     ·  Cta: 0480072338  ·  CLABE: 012 100 004800723387  ·  Nombre: Sinar Adrián Casanova García',
    30, bankY + 36,
  );

  // ══════════════════════════════════════════════════════════
  // BLOQUE 7 – FOOTER
  // ══════════════════════════════════════════════════════════
  fill(NAVY);
  doc.rect(0, H - 28, W, 28, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  txt(WHITE);
  doc.text(
    'Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas  ·  Tel: 961 118 0157  ·  WhatsApp: 961 333 6529',
    W / 2, H - 12,
    { align: 'center' },
  );

  return doc;
}