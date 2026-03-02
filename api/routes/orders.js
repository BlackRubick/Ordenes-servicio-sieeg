const express = require('express');
const router = express.Router();
const { Order, User } = require('../models');
const { Op } = require('sequelize');

// Actualizar diagnóstico de una orden por folio
router.put('/:folio/diagnostico', async (req, res) => {
  const { folio } = req.params;
  const { diagnostico } = req.body;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.diagnostico = diagnostico;
    await order.save();
    res.json({ success: true });
  } catch (error) {
    console.log('Error al actualizar diagnóstico:', error);
    res.status(500).json({ error: error.message });
  }
});


// Actualizar técnico de una orden por folio
router.put('/:folio/tecnico', async (req, res) => {
  const { folio } = req.params;
  const { technicianId } = req.body;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.technicianId = technicianId;
    await order.save();
    res.json({ success: true });
  } catch (error) {
    console.log('Error al actualizar técnico:', error);
    res.status(500).json({ error: error.message });
  }
});


// Actualizar estado de una orden por folio
router.put('/:folio/estado', async (req, res) => {
  const { folio } = req.params;
  const { estado } = req.body;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.status = estado;
    await order.save();
    res.json({ success: true });
  } catch (error) {
    console.log('Error al actualizar estado:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar trabajos realizados de una orden por folio
router.put('/:folio/trabajos', async (req, res) => {
  const { folio } = req.params;
  const { trabajos } = req.body;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.trabajos = trabajos;
    // Calcular el total de trabajos
    const totalTrabajos = Array.isArray(trabajos) ? trabajos.reduce((acc, t) => acc + (typeof t.costo === 'number' ? t.costo : 0), 0) : 0;
    // Actualizar resumen.total
    if (!order.resumen || typeof order.resumen !== 'object') {
      order.resumen = {};
    }
    order.resumen.total = totalTrabajos;
    await order.save();
    res.json({ success: true, trabajos, total: totalTrabajos });
  } catch (error) {
    console.log('Error al actualizar trabajos:', error);
    res.status(500).json({ error: error.message });
  }
});
// Obtener todas las órdenes
router.get('/', async (req, res) => {
  const { folio, tipo, foraneo, external, excludeForeign } = req.query;
  let where = {};
  if (folio) where.folio = folio;
  if (tipo) {
    where.tipo = tipo;
  } else if (foraneo === 'true' || external === 'true') {
    where.tipo = {
      [Op.in]: ['foraneo', 'Foraneo', 'foráneo', 'Foráneo'],
    };
  } else if (excludeForeign === 'true') {
    where.tipo = {
      [Op.or]: [
        { [Op.is]: null },
        { [Op.notIn]: ['foraneo', 'Foraneo', 'foráneo', 'Foráneo'] },
      ],
    };
  }
  try {
    const orders = await Order.findAll({ where, include: [{ model: User, as: 'Technician' }] });
    // Transformar cada orden para agregar la propiedad 'tecnico' igual al nombre del técnico
    const ordersWithTecnico = orders.map(order => {
      const plain = order.get({ plain: true });
      return {
        ...plain,
        tecnico: plain.Technician ? plain.Technician.nombre : '',
        diagnostico: plain.diagnostico || '',
      };
    });
    res.json(ordersWithTecnico);
  } catch (error) {
    console.log('Error al obtener órdenes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear orden
router.post('/', async (req, res) => {
  const {
    folio,
    fecha,
    clientName,
    telefono,
    correo,
    tipo,
    marca,
    modelo,
    serie,
    accesorios,
    otrosAccesorios,
    seguridad,
    patron,
    description,
    diagnostico,
    observaciones,
    firma,
    status,
    technicianId,
    trabajos,
    resumen,
  } = req.body;
  try {
    const order = await Order.create({
      folio,
      fecha,
      clientName,
      telefono,
      correo,
      tipo,
      marca,
      modelo,
      serie,
      accesorios,
      otrosAccesorios,
      seguridad,
      patron,
      description,
      diagnostico,
      observaciones,
      firma,
      status,
      technicianId,
      trabajos,
      resumen,
    });
    res.status(201).json(order);
  } catch (error) {
    console.log('Error al crear orden:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar orden por folio
router.delete('/:folio', async (req, res) => {
  const { folio } = req.params;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    await order.destroy();
    res.json({ success: true, message: 'Orden eliminada correctamente' });
  } catch (error) {
    console.log('Error al eliminar orden:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
