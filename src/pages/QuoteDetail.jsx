import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadQuote = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/quotes/${id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'No se pudo cargar la cotización');
        }
        if (active) {
          setQuote(data);
          setError('');
        }
      } catch (loadError) {
        if (active) {
          setQuote(null);
          setError(loadError.message || 'No se pudo cargar la cotización');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadQuote();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-lg text-gray-500">Cargando cotización...</div>
      </DashboardLayout>
    );
  }

  if (error || !quote) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-lg text-red-500">{error || 'Cotización no encontrada'}</div>
      </DashboardLayout>
    );
  }

  const partidas = Array.isArray(quote.partidas) ? quote.partidas : [];

  const handleDeleteQuote = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar cotización?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return;

      const response = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo eliminar la cotización');
      }

      await Swal.fire('Eliminada', 'La cotización fue eliminada correctamente.', 'success');
      navigate('/admin/quotes');
    } catch (error) {
      await Swal.fire('Error', error.message || 'No se pudo eliminar la cotización', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-primary-500">Cotización {quote.numeroCotizacion}</h2>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-all"
            onClick={() => navigate(`/admin/quotes/${id}/edit`)}
          >
            Editar
          </button>
          <button
            className="px-4 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-all"
            onClick={handleDeleteQuote}
          >
            Eliminar
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95"
            onClick={() => navigate('/admin/quotes')}
          >
            Volver a lista
          </button>
        </div>
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
            <div className="font-semibold text-gray-700">{quote.vigencia ? `${quote.vigencia} días` : 'Sin definir'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Estado</div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">{quote.status || 'Borrador'}</span>
          </div>
        </div>
        <div className="mb-6">
          <div className="text-xs text-gray-400 font-semibold mb-1">Descripción general</div>
          <div className="text-gray-700 italic">{quote.descripcionGeneral || 'Sin descripción'}</div>
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
                {partidas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 px-3 text-center text-gray-400">Sin partidas registradas</td>
                  </tr>
                )}
                {partidas.map((p, idx) => (
                  <tr key={idx} className="bg-white border-b border-border last:border-0">
                    <td className="py-2 px-3 font-mono text-primary-600 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3">{p.descripcion}</td>
                    <td className="py-2 px-3">{p.cantidad}</td>
                    <td className="py-2 px-3">{p.unidad}</td>
                    <td className="py-2 px-3">${Number(p.precioUnitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3">${Number(p.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end items-center gap-4 mt-6">
          <span className="text-lg font-bold text-gray-700">Total:</span>
          <span className="text-2xl font-extrabold text-primary-600">${Number(quote.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1">Datos del emisor</div>
            <div className="text-gray-700 text-sm">
              <div><b>Razón social:</b> {quote.razonSocial || 'Sin definir'}</div>
              <div><b>RFC:</b> {quote.rfc || 'Sin definir'}</div>
              <div><b>REPSE:</b> {quote.repse || 'Sin definir'}</div>
              <div><b>Dirección:</b> {quote.direccion || 'Sin definir'}</div>
              <div><b>Teléfono:</b> {quote.telefono || 'Sin definir'}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1">Datos del cliente</div>
            <div className="text-gray-700 text-sm">
              <div><b>Empresa:</b> {quote.empresa || 'Sin definir'}</div>
              <div><b>Contacto:</b> {quote.cliente || 'Sin definir'}</div>
              <div><b>Correo:</b> {quote.correo || 'Sin definir'}</div>
              <div><b>Dirección:</b> {quote.direccionCliente || 'Sin definir'}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
