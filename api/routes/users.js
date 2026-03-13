const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcrypt');

const ROLES_VALIDOS = ['administrador', 'admin', 'tecnico', 'técnico', 'mostrador'];

const normalizarRol = (rol) => String(rol || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const validarRol = (rol) => ROLES_VALIDOS.includes(normalizarRol(rol));

// Editar usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, contrasena, rol, estado } = req.body;
  try {
    if (rol && !validarRol(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    let updateData = { nombre, correo, rol, estado };
    if (contrasena) {
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      updateData.contrasena = hashedPassword;
    }
    await user.update(updateData);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    await user.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear usuario
router.post('/', async (req, res) => {
  const { nombre, correo, contrasena, rol, estado } = req.body;
  try {
    if (!validarRol(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const user = await User.create({ nombre, correo, contrasena: hashedPassword, rol, estado });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Login
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Faltan datos para login' });
    }
    const user = await User.findOne({ where: { correo } });
    if (!user) return res.json({ success: false });
    const valid = await bcrypt.compare(contrasena, user.contrasena);
    if (!valid) return res.json({ success: false });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
