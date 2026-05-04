const express = require('express');
const router = express.Router();
const { Quote } = require('../models');

const normalizePartida = (partida = {}) => ({
  cantidad: partida.cantidad !== undefined && partida.cantidad !== null && partida.cantidad !== ''
    ? Number(partida.cantidad)
    : '',
  descripcion: partida.descripcion || '',
  unidad: partida.unidad || '',
  precioUnitario: partida.precioUnitario !== undefined && partida.precioUnitario !== null && partida.precioUnitario !== ''
    ? Number(partida.precioUnitario)
    : '',
  importe: partida.importe !== undefined && partida.importe !== null && partida.importe !== ''
    ? Number(partida.importe)
    : '',
});

const calculateTotal = (partidas) => (Array.isArray(partidas) ? partidas : []).reduce(
  (sum, partida) => sum + (Number(partida?.importe) || 0),
  0
);

router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.findAll({ order: [['createdAt', 'DESC']] });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const {
    numeroCotizacion,
    fecha,
    vigencia,
    telefono,
    direccionCliente,
    empresa,
    cliente,
    correo,
    direccion,
    razonSocial,
    rfc,
    repse,
    descripcionGeneral,
    observaciones,
    emisor,
    partidas,
    total,
    status,
    otro,
  } = req.body;

  try {
    const normalizedPartidas = Array.isArray(partidas) ? partidas.map(normalizePartida) : [];
    const parsedVigencia = vigencia !== undefined && vigencia !== null && vigencia !== ''
      ? parseInt(vigencia, 10)
      : null;
    const parsedTotal = total !== undefined && total !== null && total !== ''
      ? Number(total)
      : calculateTotal(normalizedPartidas);

    // Generar número de cotización automáticamente si no se proporciona
    let finalNumeroCotizacion = numeroCotizacion;
    if (!finalNumeroCotizacion || finalNumeroCotizacion.trim() === '') {
      // Obtener el último ID para generar el siguiente número
      const lastQuote = await Quote.findOne({ order: [['id', 'DESC']] });
      const nextId = (lastQuote?.id || 0) + 1;
      const prefix = emisor === 'sieeg' ? 'SIEEG' : emisor === 'sinar' ? 'SINAR' : 'COT';
      const year = new Date().getFullYear();
      finalNumeroCotizacion = `${prefix}-${year}-${String(nextId).padStart(4, '0')}`;
    }

    const quote = await Quote.create({
      numeroCotizacion: finalNumeroCotizacion,
      fecha,
      vigencia: Number.isFinite(parsedVigencia) ? parsedVigencia : null,
      telefono,
      direccionCliente,
      empresa,
      cliente,
      correo,
      direccion,
      razonSocial,
      rfc,
      repse,
      descripcionGeneral,
      observaciones,
      emisor,
      partidas: normalizedPartidas,
      total: Number.isFinite(parsedTotal) ? parsedTotal : calculateTotal(normalizedPartidas),
      status: status || 'Borrador',
      otro,
    });

    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });

    const fields = [
      'numeroCotizacion', 'fecha', 'vigencia', 'telefono', 'direccionCliente', 'empresa', 'cliente',
      'correo', 'direccion', 'razonSocial', 'rfc', 'repse', 'descripcionGeneral', 'observaciones', 'emisor', 'partidas', 'total',
      'status', 'otro',
    ];

    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === 'partidas') {
          quote.partidas = Array.isArray(req.body.partidas) ? req.body.partidas.map(normalizePartida) : [];
          return;
        }
        if (field === 'vigencia') {
          const parsedVigencia = req.body.vigencia !== undefined && req.body.vigencia !== null && req.body.vigencia !== ''
            ? parseInt(req.body.vigencia, 10)
            : null;
          quote.vigencia = Number.isFinite(parsedVigencia) ? parsedVigencia : null;
          return;
        }
        if (field === 'total') {
          const normalizedPartidas = Array.isArray(req.body.partidas) ? req.body.partidas.map(normalizePartida) : (quote.partidas || []);
          const parsedTotal = req.body.total !== undefined && req.body.total !== null && req.body.total !== ''
            ? Number(req.body.total)
            : calculateTotal(normalizedPartidas);
          quote.total = Number.isFinite(parsedTotal) ? parsedTotal : calculateTotal(normalizedPartidas);
          return;
        }
        quote[field] = req.body[field];
      }
    });

    await quote.save();
    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
    await quote.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;