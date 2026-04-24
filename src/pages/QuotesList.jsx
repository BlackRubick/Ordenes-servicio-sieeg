import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

// Datos mock de cotizaciones
const mockQuotes = [
  {
    id: 1,
    numeroCotizacion: 'CT-1527D',
    fecha: '2026-04-22',
    empresa: 'PAQUETEXPRESS',
    cliente: 'ING. ULISES',
    total: 2160.34,
    vigencia: 10,
    status: 'Borrador',
  },
  {
    id: 2,
    numeroCotizacion: 'CT-1528A',
    fecha: '2026-04-23',
    empresa: 'EMPRESA DEMO',
    cliente: 'LIC. JUAN',
    total: 5000.00,
    vigencia: 15,
    status: 'Borrador',
  },
];

export default function QuotesList() {
  const [quotes] = useState(mockQuotes);
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-primary-500">Cotizaciones</h2>
        <button
          className="px-5 py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300"
          onClick={() => navigate('/admin/quotes/create')}
        >
          + Nueva cotización
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-4 overflow-x-auto animate-fade-in">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-2 px-3">#</th>
              <th className="py-2 px-3">Número</th>
              <th className="py-2 px-3">Fecha</th>
              <th className="py-2 px-3">Empresa</th>
              <th className="py-2 px-3">Cliente</th>
              <th className="py-2 px-3">Total</th>
              <th className="py-2 px-3">Vigencia</th>
              <th className="py-2 px-3">Estado</th>
              <th className="py-2 px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, idx) => (
              <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2 px-3 font-mono">{idx + 1}</td>
                <td className="py-2 px-3">{q.numeroCotizacion}</td>
                <td className="py-2 px-3">{q.fecha}</td>
                <td className="py-2 px-3">{q.empresa}</td>
                <td className="py-2 px-3">{q.cliente}</td>
                <td className="py-2 px-3">${q.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="py-2 px-3">{q.vigencia} días</td>
                <td className="py-2 px-3">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">{q.status}</span>
                </td>
                <td className="py-2 px-3">
                  <button className="px-3 py-1 rounded-xl bg-primary-100 text-primary-600 font-semibold shadow-soft hover:bg-primary-200 transition-all" onClick={() => navigate(`/admin/quotes/${q.id}`)}>
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
