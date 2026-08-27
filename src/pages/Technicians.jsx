  import { useState } from 'react';
import React  from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';

const ROLES = ['Técnico', 'Administrador', 'Mostrador', 'Cotizador', 'Ejecutivo de ventas'];
const ESTADOS = ['Activo', 'Inactivo'];

const Technicians = () => {
    const handleDelete = (idx) => {
      const user = users[idx];
      Swal.fire({
        title: '¿Eliminar usuario?',
        text: `¿Seguro que quieres eliminar a ${user.nombre}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          fetch(`/api/users/${user.id}`, {
            method: 'DELETE'
          })
            .then(res => res.json())
            .then(() => {
              setUsers(prev => prev.filter((_, i) => i !== idx));
              Swal.fire('Usuario eliminado', '', 'success');
            })
            .catch(() => Swal.fire('Error al eliminar', '', 'error'));
        }
      });
    };
  const [users, setUsers] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editData, setEditData] = useState({ nombre: '', correo: '', contrasena: '', rol: ROLES[0], estado: ESTADOS[0] });
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ nombre: '', correo: '', contrasena: '', rol: ROLES[0], estado: ESTADOS[0] });

  React.useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        console.log('Usuarios recibidos:', data);
        setUsers(data);
      })
      .catch((err) => {
        console.log('Error al obtener usuarios:', err);
        setUsers([]);
      });
  }, []);

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditData({ ...users[idx], contrasena: '' });
  };

  const handleSave = () => {
    const user = users[editIdx];
    fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    })
      .then(res => res.json())
      .then(updated => {
        setUsers(prev => prev.map((u, i) => (i === editIdx ? updated : u)));
        setEditIdx(null);
        Swal.fire('Usuario actualizado', '', 'success');
      })
      .catch(() => Swal.fire('Error al actualizar', '', 'error'));
  };

  const rolColor = (rol) => {
    const map = {
      'Administrador':        { bg: 'bg-purple-50',  text: 'text-purple-700' },
      'Técnico':              { bg: 'bg-primary-50', text: 'text-primary-700' },
      'Mostrador':            { bg: 'bg-yellow-50',  text: 'text-yellow-700' },
      'Cotizador':            { bg: 'bg-blue-50',    text: 'text-blue-700'   },
      'Ejecutivo de ventas':  { bg: 'bg-secondary-200/60', text: 'text-secondary-600' },
    };
    return map[rol] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const fieldClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";
  const selectClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

  return (
    <DashboardLayout>

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-sm transition-all active:scale-95"
          onClick={() => setShowCreate(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Crear Usuario
        </button>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-left">
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Correo</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">Sin usuarios registrados</span>
                    </div>
                  </td>
                </tr>
              )}
              {users.map((user, idx) => {
                const rc = rolColor(user.rol);
                return (
                  <tr key={idx} className="group hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
                          {(user.nombre || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{user.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="text-gray-600">{user.correo}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${rc.bg} ${rc.text}`}>
                        {user.rol}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.estado === 'Inactivo' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.estado === 'Inactivo' ? 'bg-red-400' : 'bg-green-500'}`} />
                        {user.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white transition-all"
                          onClick={() => handleEdit(idx)}
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          onClick={() => handleDelete(idx)}
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 4h4a1 1 0 011 1v2H9V5a1 1 0 011-1z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal creación ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Crear usuario</h3>
                  <p className="text-xs text-gray-400">Nuevo acceso al sistema</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</label>
                <input className={fieldClass} value={createData.nombre} onChange={e => setCreateData(d => ({ ...d, nombre: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo</label>
                <input className={fieldClass} value={createData.correo} onChange={e => setCreateData(d => ({ ...d, correo: e.target.value }))} placeholder="correo@ejemplo.com" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraseña</label>
                <input type="password" className={fieldClass} value={createData.contrasena} onChange={e => setCreateData(d => ({ ...d, contrasena: e.target.value }))} placeholder="Contraseña" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</label>
                  <select className={selectClass} value={createData.rol} onChange={e => setCreateData(d => ({ ...d, rol: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</label>
                  <select className={selectClass} value={createData.estado} onChange={e => setCreateData(d => ({ ...d, estado: e.target.value }))}>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all" onClick={() => setShowCreate(false)}>
                  Cancelar
                </button>
                <button
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-sm transition-all active:scale-95"
                  onClick={() => {
                    fetch('/api/users', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        nombre: createData.nombre,
                        correo: createData.correo,
                        contrasena: createData.contrasena,
                        rol: createData.rol,
                        estado: createData.estado
                      })
                    })
                      .then(res => res.json())
                      .then(newUser => {
                        setUsers(prev => [...prev, newUser]);
                        setShowCreate(false);
                        setCreateData({ nombre: '', correo: '', contrasena: '', rol: ROLES[0], estado: ESTADOS[0] });
                      });
                  }}
                >
                  Crear usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal edición ── */}
      {editIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Editar usuario</h3>
                  <p className="text-xs text-gray-400">{users[editIdx]?.nombre}</p>
                </div>
              </div>
              <button onClick={() => setEditIdx(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</label>
                <input className={fieldClass} value={editData.nombre} onChange={e => setEditData(d => ({ ...d, nombre: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo</label>
                <input className={fieldClass} value={editData.correo} onChange={e => setEditData(d => ({ ...d, correo: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraseña</label>
                <input type="password" className={fieldClass} value={editData.contrasena} onChange={e => setEditData(d => ({ ...d, contrasena: e.target.value }))} placeholder="Dejar vacío para no cambiar" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</label>
                  <select className={selectClass} value={editData.rol} onChange={e => setEditData(d => ({ ...d, rol: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</label>
                  <select className={selectClass} value={editData.estado} onChange={e => setEditData(d => ({ ...d, estado: e.target.value }))}>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all" onClick={() => setEditIdx(null)}>
                  Cancelar
                </button>
                <button
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-all active:scale-95"
                  onClick={handleSave}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Technicians;
