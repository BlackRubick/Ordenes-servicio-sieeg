import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const DeletedOrders = () => (
  <DashboardLayout>
    <h2 className="text-xl font-bold text-dark mb-6">Órdenes Eliminadas</h2>
    <div className="rounded-2xl bg-white shadow-card p-4 overflow-x-auto animate-fade-in">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="py-2 px-3">Folio</th>
            <th className="py-2 px-3">Motivo</th>
            <th className="py-2 px-3">Fecha</th>
            <th className="py-2 px-3">Usuario</th>
            <th className="py-2 px-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-background transition-colors">
            <td className="py-2 px-3 font-mono">0002</td>
            <td className="py-2 px-3">Cliente canceló</td>
            <td className="py-2 px-3">20/02/2026</td>
            <td className="py-2 px-3">admin</td>
            <td className="py-2 px-3">
              <button className="px-3 py-1 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-electric text-white font-semibold shadow-soft hover:from-primary-600 hover:to-violet-soft transition-all">Restaurar</button>
            </td>
          </tr>
          {/* ...más filas mock... */}
        </tbody>
      </table>
    </div>
  </DashboardLayout>
);

export default DeletedOrders;
