import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

// Mock de cotizaciones (debería venir de un store o API en el futuro)
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
    partidas: [
      { descripcion: 'Servicio de mantenimiento', cantidad: 2, unidad: 'pza', precioUnitario: 800, importe: 1600 },
      { descripcion: 'Refacción', cantidad: 1, unidad: 'pza', precioUnitario: 560.34, importe: 560.34 },
    ],
    descripcionGeneral: 'Mantenimiento preventivo y refacción de equipo.',
    direccion: 'Calle 123, Col. Centro',
    razonSocial: 'PAQUETEXPRESS S.A. de C.V.',
    rfc: 'XAXX010101000',
    repse: 'REPSE123',
    telefono: '961 123 4567',
    direccionCliente: 'Av. Cliente 456',
    correo: 'ulises@paquetexpress.com',
  },
  // ...otros mocks
];

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quote = mockQuotes.find(q => String(q.id) === String(id));

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-lg text-red-500">Cotización no encontrada</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-primary-500">Cotización {quote.numeroCotizacion}</h2>
        <button
          className="px-4 py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95"
          onClick={() => navigate('/admin/quotes')}
        >
          Volver a lista
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6 max-w-3xl mx-auto animate-fade-in border border-gray-100">
        <div className="mb-4 flex flex-wrap gap-6">
          <div>
            <div className="text-xs text-gray-400 font-semibold">Fecha</div>
            <div className="font-bold text-lg text-primary-600">{quote.fecha}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Empresa</div>
            <div className="font-semibold text-gray-700">{quote.empresa}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Cliente</div>
            <div className="font-semibold text-gray-700">{quote.cliente}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Vigencia</div>
            <div className="font-semibold text-gray-700">{quote.vigencia} días</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Estado</div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">{quote.status}</span>
          </div>
        </div>
        <div className="mb-6">
          <div className="text-xs text-gray-400 font-semibold mb-1">Descripción general</div>
          <div className="text-gray-700 italic">{quote.descripcionGeneral}</div>
        </div>
        <div className="mb-6">
          <div className="text-xs text-gray-400 font-semibold mb-2">Partidas</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold">
                  <th className="py-2 px-3 rounded-tl-2xl">#</th>
                  <th className="py-2 px-3">Descripción</th>
                  <th className="py-2 px-3">Cantidad</th>
                  <th className="py-2 px-3">Unidad</th>
                  <th className="py-2 px-3">P. Unitario</th>
                  <th className="py-2 px-3">Importe</th>
                </tr>
              </thead>
              <tbody>
                {quote.partidas.map((p, idx) => (
                  <tr key={idx} className="bg-white border-b border-border last:border-0">
                    <td className="py-2 px-3 font-mono text-primary-600 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3">{p.descripcion}</td>
                    <td className="py-2 px-3">{p.cantidad}</td>
                    <td className="py-2 px-3">{p.unidad}</td>
                    <td className="py-2 px-3">${Number(p.precioUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3">${Number(p.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end items-center gap-4 mt-6">
          <span className="text-lg font-bold text-gray-700">Total:</span>
          <span className="text-2xl font-extrabold text-primary-600">${quote.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1">Datos del emisor</div>
            <div className="text-gray-700 text-sm">
              <div><b>Razón social:</b> {quote.razonSocial}</div>
              <div><b>RFC:</b> {quote.rfc}</div>
              <div><b>REPSE:</b> {quote.repse}</div>
              <div><b>Dirección:</b> {quote.direccion}</div>
              <div><b>Teléfono:</b> {quote.telefono}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1">Datos del cliente</div>
            <div className="text-gray-700 text-sm">
              <div><b>Empresa:</b> {quote.empresa}</div>
              <div><b>Contacto:</b> {quote.cliente}</div>
              <div><b>Correo:</b> {quote.correo}</div>
              <div><b>Dirección:</b> {quote.direccionCliente}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
