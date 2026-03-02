const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'newordenes_db',
  process.env.DB_USER || 'cesar',
  process.env.DB_PASS || 'cesar123',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql', 
    logging: false,
  }
);

module.exports = sequelize;
