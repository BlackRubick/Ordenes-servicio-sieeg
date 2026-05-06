const User = require('./User');
const Order = require('./Order');
const Technician = require('./Technician');
const Client = require('./Client');
const Quote = require('./Quote');
const Product = require('./Product');

// Nueva relación: Order pertenece a User (rol = 'Técnico')
Order.belongsTo(User, { foreignKey: 'technicianId', as: 'Technician' });
User.hasMany(Order, { foreignKey: 'technicianId', as: 'TechnicianOrders' });

// Relación: Order pertenece a Client
Order.belongsTo(Client, { foreignKey: 'clienteId', as: 'Cliente' });
Client.hasMany(Order, { foreignKey: 'clienteId', as: 'Ordenes' });

module.exports = { User, Order, Technician, Client, Quote, Product };
