import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
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
  const [emisorFilter, setEmisorFilter] = useState('sinar');
  const [vendedorFilter, setVendedorFilter] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [searchEmpresa, setSearchEmpresa] = useState('');
  const [searchNumero, setSearchNumero] = useState('');
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const normalizedRole = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';

  const isEmpty = (value) => String(value ?? '').trim() === '';

  const toggleEmisorFilter = () => {
    setEmisorFilter(prev => {
      if (prev === 'sinar') return 'sieeg';
      return 'sinar';
    });
  };

  const filteredQuotes = quotes
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .filter(quote => {
      const emisor = String(quote?.emisor || '').toLowerCase().trim();
      const matchEmisor = emisorFilter === 'sinar' ? emisor === 'sinar' : emisor === 'sieeg';
      const matchVendedor = !vendedorFilter
        || String(quote?.vendedorId || '') === vendedorFilter
        || (vendedorFilter === 'sin_vendedor' && !quote?.vendedorId);
      const matchCliente = !searchCliente
        || (quote?.cliente || '').toLowerCase().includes(searchCliente.toLowerCase());
      const matchEmpresa = !searchEmpresa
        || (quote?.empresa || '').toLowerCase().includes(searchEmpresa.toLowerCase());
      const matchNumero = !searchNumero
        || (quote?.numeroCotizacion || '').toLowerCase().includes(searchNumero.toLowerCase());
      return matchEmisor && matchVendedor && matchCliente && matchEmpresa && matchNumero;
    });

  // Vendedores únicos para el filtro
  const vendedoresUnicos = Array.from(
    new Map(
      quotes
        .filter(q => q.vendedorId && q.vendedorNombre)
        .map(q => [String(q.vendedorId), { id: String(q.vendedorId), nombre: q.vendedorNombre }])
    ).values()
  );

  // Totales del filtro actual
  const totalFiltrado = filteredQuotes.reduce((s, q) => s + (Number(q.total) || 0), 0);
  const totalAprobado = filteredQuotes
    .filter(q => q.status === 'Aprobado')
    .reduce((s, q) => s + (Number(q.total) || 0), 0);

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
    if (normalizedRole === 'cotizador') {
      await Swal.fire('Permisos insuficientes', 'No puedes eliminar cotizaciones con el rol Cotizador.', 'warning');
      return;
    }
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-1 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Volver
          </button>
          <h2 className="text-2xl font-extrabold text-primary-500">Cotizaciones {emisorFilter === 'sinar' ? 'Persona física' : 'SIEEG'}</h2>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            className={`px-5 py-2 rounded-xl font-bold shadow-lg transition-all ${
              emisorFilter === 'sinar'
                ? 'bg-gradient-to-tr from-primary-500 to-secondary-500 text-white hover:scale-105'
                  : 'bg-gradient-to-tr from-orange-400 to-orange-500 text-white hover:scale-105'
            } active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300`}
            onClick={toggleEmisorFilter}
          >
            {emisorFilter === 'sinar' ? 'Persona física' : 'SIEEG'}
          </button>

          {/* Filtro por vendedor */}
          <select
            value={vendedorFilter}
            onChange={e => setVendedorFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Todos los vendedores</option>
            <option value="sin_vendedor">Sin vendedor</option>
            {vendedoresUnicos.map(v => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>

          {isAdmin && (
            <button
              className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-200 hover:bg-purple-100 transition-all"
              onClick={() => navigate('/admin/reportes/vendedores')}
            >
              Reportes vendedores
            </button>
          )}
          {normalizedRole !== 'cotizador' && (
            <button
              className="px-5 py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300"
              onClick={() => navigate('/admin/quotes/create', { state: { defaultEmisor: emisorFilter } })}
            >
              + Nueva cotización
            </button>
          )}
          <button
            className="px-5 py-2 rounded-xl border border-secondary-200 bg-white text-secondary-600 font-bold shadow-sm hover:bg-secondary-50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary-300 transition-all"
            onClick={() => { if (normalizedRole !== 'cotizador') navigate('/admin/products'); }}
            style={{ display: normalizedRole === 'cotizador' ? 'none' : undefined }}
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
      {/* Filtros de búsqueda */}
      <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Número de cotización</label>
          <input
            type="text"
            value={searchNumero}
            onChange={e => setSearchNumero(e.target.value)}
            placeholder="Buscar por número..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Empresa</label>
          <input
            type="text"
            value={searchEmpresa}
            onChange={e => setSearchEmpresa(e.target.value)}
            placeholder="Buscar por empresa..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Cliente</label>
          <input
            type="text"
            value={searchCliente}
            onChange={e => setSearchCliente(e.target.value)}
            placeholder="Buscar por cliente..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        {(searchNumero || searchEmpresa || searchCliente) && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setSearchNumero(''); setSearchEmpresa(''); setSearchCliente(''); }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 transition-all"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Resumen de totales */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
          <div className="text-xs text-gray-400 font-semibold">Cotizaciones ({filteredQuotes.length})</div>
          <div className="text-lg font-extrabold text-primary-600">${totalFiltrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 px-4 py-3 shadow-sm">
          <div className="text-xs text-green-600 font-semibold">Aprobado</div>
          <div className="text-lg font-extrabold text-green-700">${totalAprobado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
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
              <th className="py-3 px-4">Vendedor</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Vigencia</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-muted py-8 bg-white rounded-b-2xl">
                  {loading ? 'Cargando cotizaciones...' : (error || `No hay cotizaciones de ${emisorFilter === 'sinar' ? 'Persona física' : 'SIEEG'}.`)}
                </td>
              </tr>
            )}
            {filteredQuotes.map((q, idx) => {
              const isLast = idx === filteredQuotes.length - 1;
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
                  <td className="py-4 px-4 align-middle text-sm text-gray-600">{q.vendedorNombre || '—'}</td>
                  <td className="py-4 px-4 align-middle">${Number(q.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-4 align-middle">{q.vigencia} días</td>
                  <td className="py-4 px-4 align-middle">
                    <select
                      value={q.status || 'Borrador'}
                      onChange={(e) => handleStatusChange(q, e.target.value)}
                      disabled={!isAdmin}
                      className={`w-full min-w-[170px] px-3 py-2 rounded-xl border border-blue-100 bg-white text-sm font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-primary-200 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                        className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-100 hover:bg-blue-100 transition-all"
                        onClick={() => navigate('/admin/quotes/create', { state: { preloadedQuote: q } })}
                        title="Clonar"
                      >
                        Clonar
                      </button>
                      <button
                        className="px-3 py-1 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-semibold shadow-soft hover:from-primary-600 hover:to-blue-400 transition-all"
                        onClick={() => navigate(`/admin/quotes/${q.id}`)}
                      >
                        Ver
                      </button>
                      {isAdmin && (
                        <button
                          className="px-3 py-1 rounded-xl font-semibold border transition-all bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
                          onClick={() => handleDeleteQuote(q)}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      )}
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
