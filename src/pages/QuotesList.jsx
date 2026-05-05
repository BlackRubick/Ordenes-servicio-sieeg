import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';
import { generateQuotePdfDoc } from '../utils/quotesPdf';

const statusOptions = ['Borrador', 'Pendiente', 'Aprobado', 'Cancelada'];

export default function QuotesList() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDeleteQuote = async (quote) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar cotización?',
        text: `Se eliminará ${quote.numeroCotizacion}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return;

      const response = await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo eliminar la cotización');
      }

      setQuotes(prev => prev.filter(item => item.id !== quote.id));
      await Swal.fire('Eliminada', 'La cotización fue eliminada correctamente.', 'success');
    } catch (error) {
      await Swal.fire('Error', error.message || 'No se pudo eliminar la cotización', 'error');
    }
  };

  const handleDownloadPDF = async (quote) => {
    try {
      const doc = await generateQuotePdfDoc(quote);
      doc.save(`Cotizacion_${quote.numeroCotizacion}.pdf`);
    } catch (error) {
      await Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  const handleStatusChange = async (quote, nextStatus) => {
    if (!nextStatus || nextStatus === quote.status) return;

    const previousStatus = quote.status;
    setQuotes(prev => prev.map(item => (item.id === quote.id ? { ...item, status: nextStatus } : item)));

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo actualizar el estado');
      }

      const savedQuote = data?.quote || data;
      setQuotes(prev => prev.map(item => (item.id === quote.id ? { ...item, ...savedQuote } : item)));
      await Swal.fire('Estado actualizado', 'El estado de la cotización se guardó correctamente.', 'success');
    } catch (error) {
      setQuotes(prev => prev.map(item => (item.id === quote.id ? { ...item, status: previousStatus } : item)));
      await Swal.fire('Error', error.message || 'No se pudo actualizar el estado', 'error');
    }
  };

  useEffect(() => {
    let active = true;

    const loadQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quotes');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'No se pudieron cargar las cotizaciones');
        }
        if (active) {
          setQuotes(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (loadError) {
        if (active) {
          setQuotes([]);
          setError(loadError.message || 'No se pudieron cargar las cotizaciones');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadQuotes();

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-primary-500">Cotizaciones</h2>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-5 py-2 rounded-xl border border-primary-200 bg-white text-primary-600 font-bold shadow-sm hover:bg-primary-50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            onClick={() => navigate('/admin/quotes/create')}
          >
            Alta Producto
          </button>
          <button
            className="px-5 py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300"
            onClick={() => navigate('/admin/quotes/create')}
          >
            + Nueva cotización
          </button>
        </div>
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
                <td colSpan={9} className="text-center text-muted py-8 bg-white rounded-b-2xl">
                  {loading ? 'Cargando cotizaciones...' : (error || 'No hay cotizaciones registradas.')}
                </td>
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
                    <select
                      value={q.status || 'Borrador'}
                      onChange={(e) => handleStatusChange(q, e.target.value)}
                      className="w-full min-w-[170px] px-3 py-2 rounded-xl border border-blue-100 bg-white text-sm font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 px-4 align-middle">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-3 py-1 rounded-xl bg-green-50 text-green-700 font-semibold border border-green-100 hover:bg-green-100 transition-all"
                        onClick={() => handleDownloadPDF(q)}
                        title="Descargar PDF"
                      >
                         PDF
                      </button>
                      <button
                        className="px-3 py-1 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-semibold shadow-soft hover:from-primary-600 hover:to-blue-400 transition-all"
                        onClick={() => navigate(`/admin/quotes/${q.id}`)}
                      >
                        Ver
                      </button>
                      <button
                        className="px-3 py-1 rounded-xl bg-red-50 text-red-700 font-semibold border border-red-100 hover:bg-red-100 transition-all"
                        onClick={() => handleDeleteQuote(q)}
                      >
                        Eliminar
                      </button>
                    </div>
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
