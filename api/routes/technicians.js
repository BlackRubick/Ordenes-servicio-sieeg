const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Obtener todos los técnicos desde Users (rol = 'técnico')
router.get('/', async (req, res) => {
  const technicians = await User.findAll({ where: { rol: 'Técnico' } });
  res.json(technicians);
});

// Crear técnico
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  const technician = await Technician.create({ name, email });
  res.status(201).json(technician);
});

module.exports = router;
