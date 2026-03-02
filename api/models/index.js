const User = require('./User');
const Order = require('./Order');
const Technician = require('./Technician');

// Nueva relación: Order pertenece a User (rol = 'Técnico')
Order.belongsTo(User, { foreignKey: 'technicianId', as: 'Technician' });
User.hasMany(Order, { foreignKey: 'technicianId', as: 'TechnicianOrders' });

module.exports = { User, Order, Technician };
