"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Eliminar la restricción anterior si existe
    try {
      await queryInterface.removeConstraint("Orders", "Orders_ibfk_1");
    } catch (e) {}
    // Eliminar el campo technicianId si existe
    try {
      await queryInterface.removeColumn("Orders", "technicianId");
    } catch (e) {}
    // Agregar technicianId apuntando a Users
    await queryInterface.addColumn("Orders", "technicianId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Orders", "technicianId");
  }
};
