import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import DashboardLayout from '../layouts/DashboardLayout';

const ClientesManagement = () => {
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    usuario: '',
    contrasena: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId
        ? `/api/clients/${editingId}`
        : '/api/clients';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire('Éxito', `Cliente ${editingId ? 'actualizado' : 'creado'} correctamente`, 'success');
        setShowModal(false);
        resetForm();
        fetchClientes();
      } else {
        Swal.fire('Error', data.error || 'Error al procesar la solicitud', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente) => {
    setEditingId(cliente.id);
    setFormData({
      nombre: cliente.nombre,
      correo: cliente.correo,
      telefono: cliente.telefono,
      usuario: cliente.usuario,
      contrasena: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1a3a5e',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          Swal.fire('Eliminado', 'Cliente eliminado correctamente', 'success');
          fetchClientes();
        } else {
          Swal.fire('Error', 'No se pudo eliminar el cliente', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'Error de conexión', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      correo: '',
      telefono: '',
      usuario: '',
      contrasena: '',
    });
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-dark">Gestión de Clientes</h2>
          <button
            onClick={() => setShowModal(true)}
            className="py-2 px-6 rounded-xl bg-primary-500 text-white font-bold shadow-lg hover:bg-primary-600 transition-all"
          >
            Crear Cliente
          </button>
        </div>

        <div className="rounded-2xl bg-gradient-to-tr from-primary-100 to-blue-50 shadow-lg p-1 overflow-x-auto animate-fade-in">
          <table className="min-w-full text-base border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-white font-bold bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl">
                <th className="py-3 px-4 rounded-tl-2xl">Nombre</th>
                <th className="py-3 px-4">Correo</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 px-4 text-center text-gray-600 bg-white rounded-b-2xl">
                    No hay clientes registrados.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="transition-all duration-300 group bg-white shadow-card border-b border-border last:border-0 hover:shadow-xl hover:-translate-y-1">
                    <td className="py-4 px-4 font-semibold text-dark">{cliente.nombre}</td>
                    <td className="py-4 px-4 text-dark">{cliente.correo}</td>
                    <td className="py-4 px-4 text-dark">{cliente.telefono}</td>
                    <td className="py-4 px-4 font-mono text-primary-600">{cliente.usuario}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full border font-semibold text-xs shadow-sm border-current ${
                          cliente.activo ? 'bg-state-completed/20 text-state-completed' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="px-3 py-1 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cliente.id)}
                        className="px-3 py-1 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4">
              <h3 className="text-xl font-bold text-primary-600 mb-1">{editingId ? 'Editar cliente' : 'Crear cliente'}</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-dark">
                  Nombre
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-primary-200 outline-none mt-1"
                    required
                  />
                </label>

                <label className="text-sm font-semibold text-dark">
                  Correo
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-primary-200 outline-none mt-1"
                    required
                  />
                </label>

                <label className="text-sm font-semibold text-dark">
                  Teléfono
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-primary-200 outline-none mt-1"
                    required
                  />
                </label>

                <label className="text-sm font-semibold text-dark">
                  Usuario
                  <input
                    type="text"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-primary-200 outline-none mt-1"
                    required
                  />
                </label>

                <label className="text-sm font-semibold text-dark">
                  Contraseña {editingId && '(opcional)'}
                  <input
                    type="password"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-primary-200 outline-none mt-1"
                    required={!editingId}
                  />
                </label>

                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientesManagement;
