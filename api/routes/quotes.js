const express = require('express');
const router = express.Router();
const { Quote, User } = require('../models');
const { Op } = require('sequelize');

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
  observaciones: partida.observaciones || '',
  precioCosto: partida.precioCosto !== undefined && partida.precioCosto !== null && partida.precioCosto !== ''
    ? Number(partida.precioCosto)
    : '',
  utilidad: partida.utilidad !== undefined && partida.utilidad !== null && partida.utilidad !== ''
    ? Number(partida.utilidad)
    : '',
});

const calculateTotal = (partidas) => (Array.isArray(partidas) ? partidas : []).reduce(
  (sum, partida) => sum + (Number(partida?.importe) || 0),
  0
);

const getPeriodo = (fecha) => {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return `${fecha.slice(0, 4)}${fecha.slice(5, 7)}`;
  }
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}${month}`;
};

const getPrefixByEmisor = (emisor) => {
  const normalized = String(emisor || '').toLowerCase().trim();
  if (normalized === 'sinar') return 'PF';
  if (normalized === 'sieeg') return 'PM';
  return 'PM';
};

const VENDEDOR_INCLUDE = {
  model: User,
  as: 'Vendedor',
  attributes: ['id', 'nombre', 'correo'],
};

router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.findAll({
      order: [['createdAt', 'DESC']],
      include: [VENDEDOR_INCLUDE],
    });
    const result = quotes.map(q => {
      const plain = q.get({ plain: true });
      return {
        ...plain,
        vendedorNombre: plain.Vendedor ? plain.Vendedor.nombre : null,
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats por vendedor — debe ir antes de /:id
router.get('/stats/vendedores', async (req, res) => {
  try {
    const quotes = await Quote.findAll({
      include: [VENDEDOR_INCLUDE],
    });

    const statsMap = {};

    quotes.forEach(q => {
      const plain = q.get({ plain: true });
      const vendedorId = plain.vendedorId || 'sin_vendedor';
      const vendedorNombre = plain.Vendedor ? plain.Vendedor.nombre : 'Sin vendedor asignado';

      if (!statsMap[vendedorId]) {
        statsMap[vendedorId] = {
          vendedorId,
          vendedorNombre,
          totalCotizaciones: 0,
          totalValor: 0,
          totalAprobado: 0,
          porEstado: {},
        };
      }

      const entry = statsMap[vendedorId];
      entry.totalCotizaciones += 1;
      entry.totalValor += Number(plain.total) || 0;

      const status = String(plain.status || 'Borrador');
      entry.porEstado[status] = (entry.porEstado[status] || 0) + 1;

      if (status === 'Aprobado') {
        entry.totalAprobado += Number(plain.total) || 0;
      }
    });

    res.json(Object.values(statsMap).sort((a, b) => b.totalValor - a.totalValor));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id, {
      include: [VENDEDOR_INCLUDE],
    });
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
    const plain = quote.get({ plain: true });
    res.json({
      ...plain,
      vendedorNombre: plain.Vendedor ? plain.Vendedor.nombre : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const {
    fecha,
    vigencia,
    telefono,
    direccionCliente,
    empresa,
    cliente,
    contacto,
    correo,
    direccion,
    razonSocial,
    rfc,
    repse,
    descripcionGeneral,
    observaciones,
    observacionesExtra,
    emisor,
    pruebaRendimiento,
    partidas,
    total,
    status,
    otro,
    vendedorId,
  } = req.body;

  try {
    const callerRole = String(req.headers['x-user-role'] || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (callerRole === 'cotizador') {
      return res.status(403).json({ error: 'No tienes permisos para crear cotizaciones' });
    }
    const normalizedPartidas = Array.isArray(partidas) ? partidas.map(normalizePartida) : [];
    const parsedVigencia = vigencia !== undefined && vigencia !== null && vigencia !== ''
      ? parseInt(vigencia, 10)
      : null;
    const parsedTotal = total !== undefined && total !== null && total !== ''
      ? Number(total)
      : calculateTotal(normalizedPartidas);

    const prefix = getPrefixByEmisor(emisor);
    const periodo = getPeriodo(fecha);
    const pattern = `${prefix}${periodo}/%`;
    const lastQuote = await Quote.findOne({
      where: {
        numeroCotizacion: {
          [Op.like]: pattern,
        },
      },
      order: [['numeroCotizacion', 'DESC']],
    });

    let nextConsecutive = 1;
    if (lastQuote?.numeroCotizacion) {
      const lastPart = String(lastQuote.numeroCotizacion).split('/')[1] || '';
      const lastNumber = parseInt(lastPart, 10);
      if (Number.isFinite(lastNumber)) {
        nextConsecutive = lastNumber + 1;
      }
    }

    const finalNumeroCotizacion = `${prefix}${periodo}/${String(nextConsecutive).padStart(4, '0')}`;

    const parsedVendedorId = vendedorId ? Number(vendedorId) : null;

    const quote = await Quote.create({
      numeroCotizacion: finalNumeroCotizacion,
      fecha,
      vigencia: Number.isFinite(parsedVigencia) ? parsedVigencia : null,
      telefono,
      direccionCliente,
      empresa,
      cliente: cliente ?? contacto ?? null,
      correo,
      direccion,
      razonSocial,
      rfc,
      repse,
      descripcionGeneral,
      observaciones,
      observacionesExtra,
      emisor,
      pruebaRendimiento: Boolean(pruebaRendimiento),
      partidas: normalizedPartidas,
      total: Number.isFinite(parsedTotal) ? parsedTotal : calculateTotal(normalizedPartidas),
      status: status || 'Borrador',
      otro,
      vendedorId: Number.isFinite(parsedVendedorId) ? parsedVendedorId : null,
    });

    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const callerRole = String(req.headers['x-user-role'] || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (callerRole === 'cotizador') {
      return res.status(403).json({ error: 'No tienes permisos para modificar cotizaciones' });
    }
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });

    const fields = [
      'numeroCotizacion', 'fecha', 'vigencia', 'telefono', 'direccionCliente', 'empresa', 'cliente',
      'correo', 'direccion', 'razonSocial', 'rfc', 'repse', 'descripcionGeneral', 'observaciones',
      'observacionesExtra', 'emisor', 'partidas', 'total', 'status', 'otro', 'pruebaRendimiento',
      'vendedorId',
    ];

    if (Object.prototype.hasOwnProperty.call(req.body, 'contacto') && !Object.prototype.hasOwnProperty.call(req.body, 'cliente')) {
      quote.cliente = req.body.contacto;
    }

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
        if (field === 'vendedorId') {
          const raw = req.body.vendedorId;
          const parsed = raw !== null && raw !== undefined && raw !== '' ? Number(raw) : null;
          quote.vendedorId = Number.isFinite(parsed) ? parsed : null;
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
    const callerRole = String(req.headers['x-user-role'] || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (callerRole === 'cotizador') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar cotizaciones' });
    }
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
    await quote.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
