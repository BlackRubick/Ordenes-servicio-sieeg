import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const TechnicianOrderDetail = () => (
  <DashboardLayout>
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-card p-8 animate-fade-in">
      <h2 className="text-xl font-bold text-dark mb-4">Detalle de Orden</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-xs text-muted mb-1">Cliente</div>
          <div className="font-semibold text-dark">Juan Pérez</div>
          <div className="text-xs text-muted mb-1 mt-4">Equipo</div>
          <div className="text-dark">Laptop - Dell Inspiron</div>
          <div className="text-xs text-muted mb-1 mt-4">Accesorios</div>
          <div className="text-dark">Cargador, Mouse</div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">Estado</div>
          <span className="px-3 py-1 rounded-xl bg-state-review/30 text-info text-xs font-semibold">En revisión</span>
          <div className="text-xs text-muted mb-1 mt-4">Problema reportado</div>
          <div className="text-dark">No enciende</div>
        </div>
      </div>
      <div className="mb-6">
        <div className="text-xs text-muted mb-1">Diagnóstico</div>
        <textarea className="w-full px-4 py-3 rounded-2xl border border-muted bg-white/80 min-h-[60px]" placeholder="Diagnóstico..." />
      </div>
      <div className="mb-6">
        <div className="text-xs text-muted mb-1">Trabajo realizado</div>
        <textarea className="w-full px-4 py-3 rounded-2xl border border-muted bg-white/80 min-h-[60px]" placeholder="Trabajo realizado..." />
      </div>
      <div className="mb-6">
        <div className="text-xs text-muted mb-1">Piezas usadas</div>
        <table className="min-w-full text-sm mb-2">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 px-2">Pieza</th>
              <th className="py-1 px-2">Cantidad</th>
              <th className="py-1 px-2">Costo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 px-2">Memoria RAM</td>
              <td className="py-1 px-2">1</td>
              <td className="py-1 px-2">$500.00</td>
            </tr>
            {/* ...más piezas mock... */}
          </tbody>
        </table>
        <div className="text-right text-dark font-bold">Total: $500.00</div>
      </div>
      <button className="w-full py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-electric text-white font-semibold shadow-soft hover:from-primary-600 hover:to-violet-soft transition-all">Actualizar estado</button>
    </div>
  </DashboardLayout>
);

export default TechnicianOrderDetail;
