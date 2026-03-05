const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  folio: { type: DataTypes.STRING, allowNull: false },
  fecha: { type: DataTypes.STRING, allowNull: false },
  clientName: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING, allowNull: true },
  correo: { type: DataTypes.STRING, allowNull: true },
  tipo: { type: DataTypes.STRING, allowNull: true },
  marca: { type: DataTypes.STRING, allowNull: true },
  modelo: { type: DataTypes.STRING, allowNull: true },
  serie: { type: DataTypes.STRING, allowNull: true },
  accesorios: { type: DataTypes.STRING, allowNull: true },
  otrosAccesorios: { type: DataTypes.STRING, allowNull: true },
  seguridad: { type: DataTypes.STRING, allowNull: true },
  patron: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.STRING, allowNull: false },
  diagnostico: { type: DataTypes.TEXT, allowNull: true },
  observaciones: { type: DataTypes.STRING, allowNull: true },
  firma: { type: DataTypes.TEXT, allowNull: true },
  nombreRecibe: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false },
  technicianId: { type: DataTypes.INTEGER, allowNull: true },
  trabajos: { type: DataTypes.JSON, allowNull: true },
  resumen: { type: DataTypes.JSON, allowNull: true },
  clienteId: { type: DataTypes.INTEGER, allowNull: true },
  imagenes: { type: DataTypes.JSON, allowNull: true },
  usuarioCreador: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Order;
