import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const TechnicianOrders = () => (
  <DashboardLayout>
    <h2 className="text-xl font-bold text-dark mb-6">Mis Órdenes</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Tarjeta de orden asignada */}
      <div className="rounded-2xl bg-white shadow-card p-6 flex flex-col gap-2 animate-fade-in border-l-4 border-primary-500">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-muted">Folio: 0001</span>
          <span className="px-3 py-1 rounded-xl bg-state-review/30 text-info text-xs font-semibold">En revisión</span>
        </div>
        <div className="font-semibold text-dark">Juan Pérez</div>
        <div className="text-sm text-muted">Laptop - Dell Inspiron</div>
        <div className="text-xs text-muted">21/02/2026</div>
        <button className="mt-4 py-2 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-electric text-white font-semibold shadow-soft hover:from-primary-600 hover:to-violet-soft transition-all">Ver detalles</button>
      </div>
      {/* ...más tarjetas mock... */}
    </div>
  </DashboardLayout>
);

export default TechnicianOrders;
