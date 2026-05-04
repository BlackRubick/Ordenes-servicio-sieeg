const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Quote = sequelize.define('Quote', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  numeroCotizacion: { type: DataTypes.STRING, allowNull: false },
  fecha: { type: DataTypes.STRING, allowNull: true },
  vigencia: { type: DataTypes.INTEGER, allowNull: true },
  telefono: { type: DataTypes.STRING, allowNull: true },
  direccionCliente: { type: DataTypes.STRING, allowNull: true },
  empresa: { type: DataTypes.STRING, allowNull: true },
  cliente: { type: DataTypes.STRING, allowNull: true },
  correo: { type: DataTypes.STRING, allowNull: true },
  direccion: { type: DataTypes.STRING, allowNull: true },
  razonSocial: { type: DataTypes.STRING, allowNull: true },
  rfc: { type: DataTypes.STRING, allowNull: true },
  repse: { type: DataTypes.STRING, allowNull: true },
  descripcionGeneral: { type: DataTypes.TEXT, allowNull: true },
  partidas: { type: DataTypes.JSON, allowNull: true },
  total: { type: DataTypes.FLOAT, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Borrador' },
  otro: { type: DataTypes.TEXT, allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  emisor: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Quote;