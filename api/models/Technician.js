const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Technician = sequelize.define('Technician', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
});

module.exports = Technician;
