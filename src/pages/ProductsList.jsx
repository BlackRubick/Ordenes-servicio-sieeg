import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [includeObservaciones, setIncludeObservaciones] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad: '',
    precioBase: '',
  });
  const navigate = useNavigate();

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

  const isEmpty = (value) => String(value ?? '').trim() === '';

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudieron cargar los productos');
      }
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudieron cargar los productos', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIncludeObservaciones(false);
    setFormData({ nombre: '', descripcion: '', unidad: '', precioBase: '' });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleAddProduct = async () => {
    if ([formData.nombre, formData.unidad, formData.precioBase].some(isEmpty)) {
      Swal.fire('Faltan datos', 'Completa nombre, unidad y precio base del producto.', 'warning');
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: includeObservaciones ? formData.descripcion.trim() : '',
        unidad: formData.unidad,
        precioBase: Number(formData.precioBase),
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo crear el producto');
      }

      setProducts((current) => [data.product, ...current]);
      Swal.fire('Éxito', 'Producto registrado correctamente.', 'success');
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo crear el producto', 'error');
    }
  };

  const handleOpenEditModal = (product) => {
    setEditingProductId(product.id);
    const descripcionActual = product.descripcion || '';
    setIncludeObservaciones(String(descripcionActual).trim() !== '');
    setFormData({
      nombre: product.nombre || '',
      descripcion: descripcionActual,
      unidad: product.unidad || '',
      precioBase: String(product.precioBase ?? ''),
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    if ([formData.nombre, formData.unidad, formData.precioBase].some(isEmpty)) {
      Swal.fire('Faltan datos', 'Completa nombre, unidad y precio base del producto.', 'warning');
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: includeObservaciones ? formData.descripcion.trim() : '',
        unidad: formData.unidad,
        precioBase: Number(formData.precioBase),
      };

      const response = await fetch(`/api/products/${editingProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo actualizar el producto');
      }

      setProducts((current) =>
        current.map((product) => (product.id === editingProductId ? data.product : product))
      );

      Swal.fire('Éxito', 'Producto actualizado correctamente.', 'success');
      setShowEditModal(false);
      setEditingProductId(null);
      resetForm();
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo actualizar el producto', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo eliminar el producto');
      }

      setProducts((current) => current.filter((product) => product.id !== id));
      Swal.fire('Eliminado', 'El producto fue eliminado.', 'success');
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo eliminar el producto', 'error');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleToggleObservaciones = (checked) => {
    setIncludeObservaciones(checked);
    if (!checked) {
      setFormData((current) => ({ ...current, descripcion: '' }));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-primary-500">Productos / Servicios</h2>
        <div className="flex gap-3">
          <button
            className="px-5 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold shadow-sm hover:bg-gray-50 transition-all"
            onClick={() => navigate('/admin/quotes')}
          >
            ← Volver a cotizaciones
          </button>
          <button
            className="px-5 py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
              <h3 className="text-lg font-extrabold">Agregar producto / servicio</h3>
              <p className="text-sm text-white/90">Captura la información para registrar un nuevo producto o servicio.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                  <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Nombre del producto o servicio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Unidad</label>
                  <select
                    name="unidad"
                    value={formData.unidad}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">Selecciona</option>
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Precio base sin IVA</label>
                  <input
                    name="precioBase"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioBase}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={includeObservaciones}
                    onChange={(e) => handleToggleObservaciones(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                  />
                  Agregar observaciones
                </label>
                {includeObservaciones && (
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleFormChange}
                    className="w-full min-h-[120px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 resize-y"
                    placeholder="Escribe observaciones del producto o servicio"
                  />
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={closeAddModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-all"
                  onClick={handleAddProduct}
                >
                  Guardar producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
              <h3 className="text-lg font-extrabold">Editar producto / servicio</h3>
              <p className="text-sm text-white/90">Actualiza la información del registro.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                  <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Nombre del producto o servicio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Unidad</label>
                  <select
                    name="unidad"
                    value={formData.unidad}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">Selecciona</option>
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Precio base</label>
                  <input
                    name="precioBase"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioBase}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={includeObservaciones}
                    onChange={(e) => handleToggleObservaciones(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                  />
                  Agregar observaciones
                </label>
                {includeObservaciones && (
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleFormChange}
                    className="w-full min-h-[120px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 resize-y"
                    placeholder="Escribe observaciones del producto o servicio"
                  />
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProductId(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-all"
                  onClick={handleUpdateProduct}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-tr from-primary-100 to-blue-50 shadow-lg p-1 overflow-x-auto animate-fade-in">
        {loading ? (
          <div className="text-center py-8 bg-white rounded-2xl">
            <p className="text-gray-500 font-semibold">Cargando productos...</p>
          </div>
        ) : (
          <table className="min-w-full text-base border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-white font-bold bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl">
                <th className="py-3 px-4 rounded-tl-2xl">#</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Unidad</th>
                <th className="py-3 px-4">Precio base</th>
                <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-8 bg-white rounded-b-2xl">
                    No hay productos registrados. Crea uno para empezar.
                  </td>
                </tr>
              )}
            {products.map((product, idx) => {
              const isLast = idx === products.length - 1;
              return (
                <tr
                  key={product.id}
                  className={`transition-all duration-300 group bg-white shadow-card border-b border-border last:border-0 hover:shadow-xl hover:-translate-y-1 ${isLast ? 'rounded-b-2xl' : ''}`}
                  style={{ borderRadius: isLast ? '0 0 1rem 1rem' : undefined }}
                >
                  <td className="py-4 px-4 font-mono text-primary-600 text-lg font-bold">{idx + 1}</td>
                  <td className="py-4 px-4 font-semibold text-gray-800">{product.nombre}</td>
                  <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">{product.descripcion}</td>
                  <td className="py-4 px-4 text-sm">{product.unidad}</td>
                  <td className="py-4 px-4 font-semibold text-primary-600">${Number(product.precioBase || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-100 hover:bg-blue-100 transition-all text-sm"
                        onClick={() => handleOpenEditModal(product)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 rounded-xl bg-red-50 text-red-700 font-semibold border border-red-100 hover:bg-red-100 transition-all text-sm"
                        onClick={() => handleDeleteProduct(product.id)}
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
        )}
      </div>
    </DashboardLayout>
  );
}
