import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';
import { generateQuotePdfDoc } from '../utils/quotesPdf';

const statusOptions = ['Borrador', 'Pendiente', 'Aprobado', 'Cancelada'];

const unitOptions = [
  'PZA',
  'SERVICIO',
  'Lote',
  'Juego',
  'Kit',
  'Paquete',
  'Caja',
  'Bolsa',
  'Rollo',
  'Metro',
  'Metro lineal',
  'Metro cuadrado',
  'Metro cúbico',
  'Centímetro',
  'Centímetro cuadrado',
  'Centímetro cúbico',
  'Milímetro',
  'Kilogramo',
  'Gramo',
  'Litro',
  'Mililitro',
  'Hora',
  'Minuto',
  'Día',
  'Semana',
  'Mes',
  'Año',
  'Par',
  'Docena',
  'Tonelada',
  'Tarro',
  'Tambor',
  'Bulto',
  'Envase',
  'Botella',
  'Saco',
  'Caja chica',
  'Caja grande',
  'Unidad',
];

const initialProductForm = {
  descripcion: '',
  observaciones: '',
  unidad: '',
  precioUnitario: '',
};

export default function QuotesList() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productValidationAttempted, setProductValidationAttempted] = useState(false);
  const navigate = useNavigate();

  const isEmpty = (value) => String(value ?? '').trim() === '';

  const handleOpenProductModal = () => {
    setProductForm(initialProductForm);
    setProductValidationAttempted(false);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setProductForm(initialProductForm);
    setProductValidationAttempted(false);
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setProductValidationAttempted(true);

    const isInvalid = Object.values(productForm).some(isEmpty);
    if (isInvalid) {
      await Swal.fire({
        title: 'Faltan datos obligatorios',
        text: 'Completa descripción, observaciones, unidad y precio unitario.',
        icon: 'warning',
      });
      return;
    }

    const normalizedProduct = {
      cantidad: 1,
      descripcion: productForm.descripcion.trim(),
      observaciones: productForm.observaciones.trim(),
      unidad: productForm.unidad,
      precioUnitario: Number(productForm.precioUnitario),
      importe: Number(productForm.precioUnitario),
    };

    setShowProductModal(false);
    navigate('/admin/quotes/create', { state: { preloadedPartida: normalizedProduct } });
  };

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
            className="px-5 py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300"
            onClick={() => navigate('/admin/quotes/create')}
          >
            + Nueva cotización
          </button>
          <button
            className="px-5 py-2 rounded-xl border border-secondary-200 bg-white text-secondary-600 font-bold shadow-sm hover:bg-secondary-50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary-300 transition-all"
            onClick={() => navigate('/admin/products')}
          >
            Ver productos/servicios
          </button>
        </div>
      </div>

      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
              <h3 className="text-lg font-extrabold">Alta Producto</h3>
              <p className="text-sm text-white/90">Captura la partida para agregarla a una cotización.</p>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleProductSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                <input
                  name="descripcion"
                  value={productForm.descripcion}
                  onChange={handleProductChange}
                  className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 ${productValidationAttempted && isEmpty(productForm.descripcion) ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="Descripción del producto o servicio"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones</label>
                <textarea
                  name="observaciones"
                  value={productForm.observaciones}
                  onChange={handleProductChange}
                  className={`w-full min-h-[110px] px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 resize-y ${productValidationAttempted && isEmpty(productForm.observaciones) ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="Escribe observaciones del producto o servicio"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unidad</label>
                <select
                  name="unidad"
                  value={productForm.unidad}
                  onChange={handleProductChange}
                  className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 ${productValidationAttempted && isEmpty(productForm.unidad) ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <option value="">Selecciona una unidad</option>
                  {unitOptions.map((unidad) => (
                    <option key={unidad} value={unidad}>
                      {unidad}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">P. Unitario</label>
                <input
                  name="precioUnitario"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.precioUnitario}
                  onChange={handleProductChange}
                  className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 ${productValidationAttempted && isEmpty(productForm.precioUnitario) ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={handleCloseProductModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-4 py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Continuar a cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
