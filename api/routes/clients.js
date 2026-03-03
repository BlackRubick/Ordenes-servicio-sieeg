const express = require('express');
const router = express.Router();
const { Client } = require('../models');
const bcrypt = require('bcrypt');

// Obtener todos los clientes (solo admin)
router.get('/', async (req, res) => {
  try {
    const clients = await Client.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear cliente (solo admin)
router.post('/', async (req, res) => {
  const { nombre, correo, telefono, usuario, contrasena } = req.body;
  try {
    // Validar campos requeridos
    if (!nombre || !correo || !telefono || !usuario || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await Client.findOne({ where: { usuario } });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Verificar si el correo ya existe
    const existingEmail = await Client.findOne({ where: { correo } });
    if (existingEmail) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    
    // Crear cliente
    const client = await Client.create({ 
      nombre, 
      correo, 
      telefono, 
      usuario, 
      contrasena: hashedPassword,
      activo: true
    });
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login de cliente
router.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;
  try {
    if (!usuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const client = await Client.findOne({ where: { usuario } });
    
    if (!client) {
      return res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    if (!client.activo) {
      return res.json({ success: false, message: 'Usuario inactivo' });
    }

    const valid = await bcrypt.compare(contrasena, client.contrasena);
    
    if (!valid) {
      return res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    // Devolver datos del cliente sin la contraseña
    const { contrasena: _, ...clientData } = client.toJSON();
    
    res.json({ success: true, client: clientData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener datos del cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    const { contrasena, ...clientData } = client.toJSON();
    res.json(clientData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar cliente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, telefono, usuario, contrasena, activo } = req.body;
  try {
    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    
    let updateData = { nombre, correo, telefono, usuario, activo };
    
    if (contrasena) {
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      updateData.contrasena = hashedPassword;
    }
    
    await client.update(updateData);
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar cliente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    
    await client.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
