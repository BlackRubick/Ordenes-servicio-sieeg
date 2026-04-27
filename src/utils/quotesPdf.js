import jsPDF from 'jspdf';

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
