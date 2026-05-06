const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  unidad: { type: DataTypes.STRING, allowNull: false },
  precioBase: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  estado: { type: DataTypes.STRING, allowNull: false, defaultValue: 'activo' },
}, {
  timestamps: true,
});

module.exports = Product;
