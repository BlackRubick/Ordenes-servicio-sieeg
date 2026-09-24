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
  const [productTab, setProductTab] = useState('woo');
  const [wooSearch, setWooSearch] = useState('');
  const [wooProducts, setWooProducts] = useState([]);
  const [wooLoading, setWooLoading] = useState(false);
  const [wooSelected, setWooSelected] = useState(null);
  const [emisorFilter, setEmisorFilter] = useState('sinar');
  const [vendedorFilter, setVendedorFilter] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [searchEmpresa, setSearchEmpresa] = useState('');
  const [searchNumero, setSearchNumero] = useState('');
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const normalizedRole = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';
  const isEjecutivo = normalizedRole === 'ejecutivo de ventas';

  const isEmpty = (value) => String(value ?? '').trim() === '';

  const toggleEmisorFilter = () => {
    setEmisorFilter(prev => {
      if (prev === 'sinar') return 'sieeg';
      return 'sinar';
    });
  };

  const filteredQuotes = quotes
    .slice()
    .sort((a, b) => {
      const diff = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return diff !== 0 ? diff : (Number(b.id) - Number(a.id));
    })
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
      const matchEjecutivo = !isEjecutivo
        || String(quote?.vendedorId || '') === String(user?.id || '');
      return matchEmisor && matchVendedor && matchCliente && matchEmpresa && matchNumero && matchEjecutivo;
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
    setProductTab('woo');
    setWooSearch('');
    setWooProducts([]);
    setWooSelected(null);
  };

  const handleWooProductSelect = (p) => {
    const partida = {
      cantidad: 1,
      descripcion: p.name,
      observaciones: '',
      unidad: 'PZA',
      precioUnitario: Number(p.price) || 0,
      importe: Number(p.price) || 0,
      precioCosto: p.cost_price !== null && p.cost_price !== undefined ? Number(p.cost_price) : '',
    };
    setShowProductModal(false);
    setWooSearch('');
    setWooProducts([]);
    setWooSelected(null);
    navigate('/admin/quotes/create', { state: { preloadedPartida: partida, defaultEmisor: emisorFilter } });
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
    navigate('/admin/quotes/create', { state: { preloadedPartida: normalizedProduct, defaultEmisor: emisorFilter } });
  };

  const handleDeleteQuote = async (quote) => {
    if (normalizedRole === 'cotizador' || normalizedRole === 'ejecutivo de ventas') {
      await Swal.fire('Permisos insuficientes', 'No tienes permisos para eliminar cotizaciones.', 'warning');
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

  // Búsqueda en inventario (WooCommerce directo)
  useEffect(() => {
    if (!showProductModal || productTab !== 'woo') return;
    setWooLoading(true);
    const delay = wooSearch.trim() ? 400 : 0;
    const timer = setTimeout(() => {
      const wooUrl = process.env.REACT_APP_WOO_URL || 'https://sieeg.com.mx';
      const wooKey = process.env.REACT_APP_WOO_KEY || '';
      const wooSecret = process.env.REACT_APP_WOO_SECRET || '';
      const params = new URLSearchParams({ search: wooSearch.trim(), per_page: '30', consumer_key: wooKey, consumer_secret: wooSecret });
      fetch(`${wooUrl}/wp-json/wc/v3/products?${params.toString()}`)
        .then(r => r.json())
        .then(data => {
          const products = (Array.isArray(data) ? data : []).map(p => {
            const costMeta = (p.meta_data || []).find(m => m.key === '_op_cost_price');
            return {
              id: p.id, name: p.name, sku: p.sku || '',
              price: p.price || p.regular_price || '0',
              stock_status: p.stock_status, stock_quantity: p.stock_quantity,
              image: p.images?.[0]?.src || null,
              categories: (p.categories || []).map(c => c.name),
              cost_price: costMeta ? costMeta.value : null,
            };
          });
          setWooProducts(products);
        })
        .catch(() => setWooProducts([]))
        .finally(() => setWooLoading(false));
    }, delay);
    return () => clearTimeout(timer);
  }, [wooSearch, showProductModal, productTab]);

  const statusBadge = (status) => {
    const map = {
      'Borrador':  { bg: 'bg-gray-100',   text: 'text-gray-600'  },
      'Pendiente': { bg: 'bg-yellow-50',  text: 'text-yellow-700' },
      'Aprobado':  { bg: 'bg-green-50',   text: 'text-green-700' },
      'Cancelada': { bg: 'bg-red-50',     text: 'text-red-600'   },
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-500' };
  };

  return (
    <DashboardLayout>

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Cotizaciones</h2>
            <p className="text-sm text-gray-400 mt-0.5">{filteredQuotes.length} resultado{filteredQuotes.length !== 1 ? 's' : ''}</p>
          </div>
          {/* Toggle emisor */}
          <button
            onClick={toggleEmisorFilter}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              emisorFilter === 'sinar'
                ? 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                : 'bg-secondary-500 text-white border-secondary-600 hover:bg-secondary-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${emisorFilter === 'sinar' ? 'bg-primary-500' : 'bg-white'}`} />
            {emisorFilter === 'sinar' ? 'Persona física' : 'SIEEG'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro vendedor */}
          <select
            value={vendedorFilter}
            onChange={e => setVendedorFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Todos los vendedores</option>
            <option value="sin_vendedor">Sin vendedor</option>
            {vendedoresUnicos.map(v => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>

          {isAdmin && (
            <button
              className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-200 hover:bg-purple-100 transition-all"
              onClick={() => navigate('/admin/reportes/vendedores')}
            >
              Reportes
            </button>
          )}

          {normalizedRole !== 'cotizador' && normalizedRole !== 'ejecutivo de ventas' && (
            <button
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              onClick={() => navigate('/admin/products')}
            >
              Productos
            </button>
          )}

          {normalizedRole !== 'cotizador' && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-sm transition-all active:scale-95"
              onClick={() => navigate('/admin/quotes/create', { state: { defaultEmisor: emisorFilter } })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva cotización
            </button>
          )}
        </div>
      </div>

      {/* ── Modal: nueva partida ── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>

            {/* Header modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Nueva partida</h3>
                  <p className="text-xs text-gray-400">Inventario o captura manual</p>
                </div>
              </div>
              <button type="button" onClick={handleCloseProductModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 px-6 pt-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => { setProductTab('woo'); setWooSelected(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${productTab === 'woo' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Inventario
              </button>
              <button
                type="button"
                onClick={() => setProductTab('manual')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${productTab === 'manual' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Manual
              </button>
            </div>

            {productTab === 'woo' ? (
              <div className="flex flex-col flex-1 overflow-hidden px-6 pb-6 pt-3 min-h-0">
                <div className="relative mb-3">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    autoFocus
                    value={wooSearch}
                    onChange={e => { setWooSearch(e.target.value); setWooSelected(null); }}
                    placeholder="Buscar producto en inventario..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl min-h-0">
                  {wooLoading ? (
                    <div className="flex items-center justify-center py-12 text-sm text-gray-400 gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      Buscando en inventario...
                    </div>
                  ) : wooProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                      <span className="text-sm">{wooSearch.trim() ? 'Sin resultados' : 'Escribe para buscar productos'}</span>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {wooProducts.map(p => (
                        <li
                          key={p.id}
                          onClick={() => handleWooProductSelect(p)}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary-50 transition-colors"
                        >
                          {p.image
                            ? <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                            : <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </div>
                          }
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.sku ? `SKU: ${p.sku}` : ''} {(p.categories || []).join(', ')}</div>
                            {p.cost_price && <div className="text-xs text-secondary-500 font-medium">Costo: ${p.cost_price}</div>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-primary-600">${p.price}</div>
                            <div className={`text-xs ${p.stock_status === 'instock' ? 'text-green-500' : 'text-red-400'}`}>
                              {p.stock_status === 'instock' ? `En stock${p.stock_quantity ? ` (${p.stock_quantity})` : ''}` : 'Sin stock'}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button type="button" onClick={handleCloseProductModal} className="mt-3 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                  Cancelar
                </button>
              </div>
            ) : (
              <form className="p-6 space-y-4 overflow-y-auto flex-1" onSubmit={handleProductSubmit}>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</label>
                  <input
                    name="descripcion"
                    value={productForm.descripcion}
                    onChange={handleProductChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white outline-none focus:ring-2 focus:ring-primary-200 ${productValidationAttempted && isEmpty(productForm.descripcion) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    placeholder="Descripción del producto o servicio"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={productForm.observaciones}
                    onChange={handleProductChange}
                    className={`w-full min-h-[80px] px-3.5 py-2.5 rounded-xl border text-sm bg-white outline-none focus:ring-2 focus:ring-primary-200 resize-y ${productValidationAttempted && isEmpty(productForm.observaciones) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    placeholder="Observaciones del producto o servicio"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad</label>
                    <select
                      name="unidad"
                      value={productForm.unidad}
                      onChange={handleProductChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white outline-none focus:ring-2 focus:ring-primary-200 ${productValidationAttempted && isEmpty(productForm.unidad) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    >
                      <option value="">Selecciona unidad</option>
                      {unitOptions.map((unidad) => (
                        <option key={unidad} value={unidad}>{unidad}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio unitario</label>
                    <input
                      name="precioUnitario"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.precioUnitario}
                      onChange={handleProductChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white outline-none focus:ring-2 focus:ring-primary-200 ${productValidationAttempted && isEmpty(productForm.precioUnitario) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all" onClick={handleCloseProductModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-sm transition-all active:scale-95">
                    Continuar a cotización
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Filtros de búsqueda ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={searchNumero}
            onChange={e => setSearchNumero(e.target.value)}
            placeholder="N.º cotización..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <input
            type="text"
            value={searchEmpresa}
            onChange={e => setSearchEmpresa(e.target.value)}
            placeholder="Empresa..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            value={searchCliente}
            onChange={e => setSearchCliente(e.target.value)}
            placeholder="Cliente..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        {(searchNumero || searchEmpresa || searchCliente) && (
          <button
            type="button"
            onClick={() => { setSearchNumero(''); setSearchEmpresa(''); setSearchCliente(''); }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 transition-all"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ── Totales ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Total cotizado ({filteredQuotes.length})</div>
            <div className="text-base font-bold text-primary-600">${totalFiltrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="text-xs text-green-600 font-medium">Aprobado</div>
            <div className="text-base font-bold text-green-700">${totalAprobado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-left">
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Número</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Empresa</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendedor</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vigencia</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      {loading
                        ? <><svg className="w-5 h-5 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg><span className="text-sm">Cargando cotizaciones...</span></>
                        : <><svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span className="text-sm font-medium">{error || `No hay cotizaciones de ${emisorFilter === 'sinar' ? 'Persona física' : 'SIEEG'}`}</span></>
                      }
                    </div>
                  </td>
                </tr>
              )}
              {filteredQuotes.map((q, idx) => {
                const badge = statusBadge(q.status);
                return (
                  <tr key={q.id} className="group hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-3.5 px-4 align-middle">
                      <span className="text-xs font-mono text-gray-400">{idx + 1}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="font-semibold text-primary-600 text-sm">{q.numeroCotizacion}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="text-gray-600 text-sm">{q.fecha}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="font-semibold text-gray-800 text-sm">{q.empresa}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="text-gray-700 text-sm">{q.cliente}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="text-gray-500 text-sm">{q.vendedorNombre || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="font-semibold text-gray-800 text-sm">${Number(q.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="text-gray-500 text-sm">{q.vigencia} días</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      {isAdmin ? (
                        <select
                          value={q.status || 'Borrador'}
                          onChange={(e) => handleStatusChange(q, e.target.value)}
                          className={`px-2.5 py-1 rounded-full border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-200 ${badge.bg} ${badge.text} border-current`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          {q.status || 'Borrador'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-700 hover:bg-green-500 hover:text-white transition-all"
                          onClick={() => handleDownloadPDF(q)}
                          title="Descargar PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        {(isAdmin || normalizedRole === 'mostrador') && (
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-500 hover:text-white transition-all"
                            onClick={() => navigate(`/admin/quotes/${q.id}/edit`)}
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                          onClick={() => navigate('/admin/quotes/create', { state: { preloadedQuote: q, defaultEmisor: String(q?.emisor || '').toLowerCase().trim() } })}
                          title="Clonar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white transition-all"
                          onClick={() => navigate(`/admin/quotes/${q.id}`)}
                          title="Ver detalle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {isAdmin && (
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            onClick={() => handleDeleteQuote(q)}
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 4h4a1 1 0 011 1v2H9V5a1 1 0 011-1z" /></svg>
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
      </div>
    </DashboardLayout>
  );
}
