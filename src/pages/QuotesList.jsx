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
      <div className="rounded-2xl bg-gradient-to-tr from-primary-100 to-blue-50 shadow-lg p-1 overflow-x-auto animate-fade-in">
        <table className="min-w-full text-base border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-white font-bold bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl">
              <th className="py-3 px-4 rounded-tl-2xl">#</th>
              <th className="py-3 px-4">Número</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Empresa</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Vigencia</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted py-8 bg-white rounded-b-2xl">No hay cotizaciones registradas.</td>
              </tr>
            )}
            {quotes.map((q, idx) => {
              const isLast = idx === quotes.length - 1;
              return (
                <tr
                  key={q.id}
                  className={`transition-all duration-300 group bg-white shadow-card border-b border-border last:border-0 hover:shadow-xl hover:-translate-y-1 ${isLast ? 'rounded-b-2xl' : ''}`}
                  style={{ borderRadius: isLast ? '0 0 1rem 1rem' : undefined }}
                >
                  <td className="py-4 px-4 font-mono text-primary-600 text-lg font-bold align-middle">{idx + 1}</td>
                  <td className="py-4 px-4 align-middle">{q.numeroCotizacion}</td>
                  <td className="py-4 px-4 align-middle">{q.fecha}</td>
                  <td className="py-4 px-4 align-middle">{q.empresa}</td>
                  <td className="py-4 px-4 align-middle">{q.cliente}</td>
                  <td className="py-4 px-4 align-middle">${q.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-4 align-middle">{q.vigencia} días</td>
                  <td className="py-4 px-4 align-middle">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">{q.status}</span>
                  </td>
                  <td className="py-4 px-4 align-middle">
                    <button
                      className="px-3 py-1 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-semibold shadow-soft hover:from-primary-600 hover:to-blue-400 transition-all"
                      onClick={() => navigate(`/admin/quotes/${q.id}`)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
