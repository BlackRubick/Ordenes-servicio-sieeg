const express = require('express');
const router = express.Router();
const { Order, User } = require('../models');
const { Op } = require('sequelize');
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs');

const normalizeRole = (role) => String(role || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const isAdminRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'administrador';
};

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
  const { estado, firma, nombreRecibe } = req.body;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.status = estado;
    if (Object.prototype.hasOwnProperty.call(req.body, 'firma')) {
      order.firma = firma || null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'nombreRecibe')) {
      order.nombreRecibe = (nombreRecibe || '').trim() || null;
    }
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
  const { folio, tipo, foraneo, external, excludeForeign, clienteId } = req.query;
  let where = {};
  if (folio) where.folio = folio;
  if (clienteId) where.clienteId = clienteId;
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
    nombreRecibe,
    status,
    technicianId,
    trabajos,
    resumen,
    clienteId,
    imagenes,
    presupuestoCliente,
    presupuesto,
    presupuestoAdmin,
    estadoPresupuesto,
    notaPresupuesto,
  } = req.body;
  try {
    const parsedPresupuestoCliente = (presupuestoCliente ?? presupuesto ?? null) !== null && (presupuestoCliente ?? presupuesto ?? '') !== ''
      ? Number(presupuestoCliente ?? presupuesto)
      : null;
    const safePresupuestoCliente = Number.isFinite(parsedPresupuestoCliente) ? parsedPresupuestoCliente : null;

    const parsedPresupuestoAdmin = presupuestoAdmin !== null && presupuestoAdmin !== undefined && presupuestoAdmin !== ''
      ? Number(presupuestoAdmin)
      : null;
    const safePresupuestoAdmin = Number.isFinite(parsedPresupuestoAdmin) ? parsedPresupuestoAdmin : null;

    const safeEstadoPresupuesto = estadoPresupuesto
      || (safePresupuestoAdmin ? 'pendiente_aprobacion' : (safePresupuestoCliente ? 'pendiente_aprobacion' : 'sin_presupuesto'));

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
      nombreRecibe,
      status,
      technicianId,
      trabajos,
      resumen,
      clienteId,
      imagenes,
      presupuestoCliente: safePresupuestoCliente,
      presupuestoAdmin: safePresupuestoAdmin,
      estadoPresupuesto: safeEstadoPresupuesto,
      notaPresupuesto,
    });
    res.status(201).json(order);
  } catch (error) {
    console.log('Error al crear orden:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload de imágenes para órdenes
router.post('/upload', upload.array('images', 2), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }
    
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ success: true, imagenes: imagePaths });
  } catch (error) {
    console.log('Error al subir imágenes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar orden completa por folio
router.put('/:folio', async (req, res) => {
  const { folio } = req.params;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const fields = [
      'fecha', 'clientName', 'telefono', 'correo', 'tipo', 'marca', 'modelo',
      'serie', 'accesorios', 'otrosAccesorios', 'seguridad', 'patron',
      'description', 'diagnostico', 'observaciones', 'firma', 'nombreRecibe',
      'status', 'technicianId', 'trabajos', 'resumen', 'clienteId', 'imagenes',
      'presupuestoCliente', 'presupuestoAdmin', 'estadoPresupuesto', 'notaPresupuesto'
    ];

    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === 'presupuestoCliente') {
          const raw = req.body[field];
          const parsed = raw !== null && raw !== undefined && raw !== '' ? Number(raw) : null;
          order[field] = Number.isFinite(parsed) ? parsed : null;
          return;
        }
        if (field === 'presupuestoAdmin') {
          const raw = req.body[field];
          const parsed = raw !== null && raw !== undefined && raw !== '' ? Number(raw) : null;
          order[field] = Number.isFinite(parsed) ? parsed : null;
          return;
        }
        order[field] = req.body[field];
      }
    });

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    console.log('Error al actualizar orden:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar una imagen de una orden por folio
router.delete('/:folio/images', async (req, res) => {
  const { folio } = req.params;
  const { imageUrl } = req.body;
  const requesterRole = req.headers['x-user-role'] || req.body?.role;

  if (!isAdminRole(requesterRole)) {
    return res.status(403).json({ error: 'Solo un administrador puede eliminar imágenes' });
  }

  if (!imageUrl) return res.status(400).json({ error: 'imageUrl es requerido' });
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    let imagenes = order.imagenes;
    if (typeof imagenes === 'string') {
      try { imagenes = JSON.parse(imagenes); } catch (e) { imagenes = []; }
    }
    if (!Array.isArray(imagenes)) imagenes = [];

    const nuevasImagenes = imagenes.filter(img => img !== imageUrl);
    order.imagenes = nuevasImagenes;
    await order.save();

    // Borrar el archivo físico del servidor si existe
    const relativePath = String(imageUrl).replace(/^\/+/, '');
    const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
    const filePath = path.resolve(__dirname, '..', relativePath);
    const isInsideUploads = filePath.startsWith(uploadsRoot + path.sep) || filePath === uploadsRoot;

    if (isInsideUploads && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, imagenes: nuevasImagenes });
  } catch (error) {
    console.log('Error al eliminar imagen:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin propone un nuevo presupuesto para una orden
router.put('/:folio/presupuesto-admin', async (req, res) => {
  const { folio } = req.params;
  const { presupuestoAdmin, notaPresupuesto } = req.body;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.presupuestoAdmin = presupuestoAdmin;
    if (notaPresupuesto !== undefined) order.notaPresupuesto = notaPresupuesto;
    order.estadoPresupuesto = 'pendiente_aprobacion';
    await order.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin acepta el presupuesto del cliente
router.put('/:folio/presupuesto-aceptar', async (req, res) => {
  const { folio } = req.params;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.estadoPresupuesto = 'aceptado';
    await order.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cliente acepta el presupuesto propuesto por admin
router.put('/:folio/presupuesto-cliente-acepta', async (req, res) => {
  const { folio } = req.params;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.estadoPresupuesto = 'aceptado';
    await order.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cliente rechaza el presupuesto propuesto por admin
router.put('/:folio/presupuesto-cliente-rechaza', async (req, res) => {
  const { folio } = req.params;
  try {
    const order = await Order.findOne({ where: { folio } });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    order.estadoPresupuesto = 'rechazado';
    await order.save();
    res.json({ success: true });
  } catch (error) {
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
