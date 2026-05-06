const express = require('express');
const router = express.Router();
const { Product } = require('../models');

// GET todas los productos
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { estado: 'activo' },
      order: [['createdAt', 'DESC']],
    });
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST crear un nuevo producto
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, unidad, precioBase } = req.body;

    if (!nombre || !unidad) {
      return res.status(400).json({ error: 'Nombre y unidad son obligatorios' });
    }

    const product = await Product.create({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      unidad: unidad.trim(),
      precioBase: Number(precioBase) || 0,
      estado: 'activo',
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT actualizar un producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, unidad, precioBase, estado } = req.body;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    if (nombre) product.nombre = nombre.trim();
    if (descripcion !== undefined) product.descripcion = descripcion?.trim() || '';
    if (unidad) product.unidad = unidad.trim();
    if (precioBase !== undefined) product.precioBase = Number(precioBase) || 0;
    if (estado) product.estado = estado;

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE eliminar un producto (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    // Soft delete: marcar como inactivo
    product.estado = 'inactivo';
    await product.save();

    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
