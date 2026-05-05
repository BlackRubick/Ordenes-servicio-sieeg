import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';

export default function ProductsList() {
  const [showForm, setShowForm] = useState(false);
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

  const handleAddProduct = () => {
    if (Object.values(formData).some(isEmpty)) {
      Swal.fire('Faltan datos', 'Completa todos los campos del producto.', 'warning');
      return;
    }

    Swal.fire('Éxito', 'Producto registrado correctamente.', 'success');
    setFormData({ nombre: '', descripcion: '', unidad: '', precioBase: '' });
    setShowForm(false);
  };

  const handleDeleteProduct = async (id) => {
    // Función no utilizada pero mantenida para compatibilidad
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(current => ({ ...current, [name]: value }));
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
              setFormData({ nombre: '', descripcion: '', unidad: '', precioBase: '' });
              setShowForm(!showForm);
            }}
          >
            {showForm ? '✕ Cancelar' : '+ Nuevo producto'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Agregar nuevo producto</h3>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleFormChange}
              className="w-full min-h-[100px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 resize-y"
              placeholder="Descripción detallada"
            />
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-all"
              onClick={handleAddProduct}
            >
              Guardar producto
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
