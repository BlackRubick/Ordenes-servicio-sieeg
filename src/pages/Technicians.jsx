  import { useState } from 'react';
import React  from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';

const ROLES = ['Técnico', 'Administrador'];
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

  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold text-dark mb-6">Gestión de Usuarios</h2>
      <div className="mb-4 flex justify-end">
        <button className="py-2 px-6 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all" onClick={() => setShowCreate(true)}>Crear Usuario</button>
      </div>
      <div className="rounded-2xl bg-gradient-to-tr from-primary-100 to-blue-50 shadow-lg p-1 overflow-x-auto animate-fade-in">
        <table className="min-w-full text-base border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-white font-bold bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl">
              <th className="py-3 px-4 rounded-tl-2xl">Nombre</th>
              <th className="py-3 px-4">Correo</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="transition-all duration-300 group bg-white shadow-card border-b border-border last:border-0 hover:shadow-xl hover:-translate-y-1 rounded-b-2xl">
                <td className="py-4 px-4 font-mono text-primary-600 text-lg font-bold align-middle">{user.nombre}</td>
                <td className="py-4 px-4 align-middle"><span className="font-bold text-dark">{user.correo}</span></td>
                <td className="py-4 px-4 align-middle"><span className="font-semibold text-dark lowercase">{user.rol}</span></td>
                <td className="py-4 px-4 align-middle">
                  <span
                    className={
                      `px-4 py-1 rounded-full border font-semibold text-xs shadow-sm border-current ` +
                      (user.estado === 'Inactivo'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-state-completed/20 text-state-completed')
                    }
                  >
                    {user.estado}
                  </span>
                </td>
                <td className="py-4 px-4 align-middle flex gap-2">
                  <button className="px-3 py-1 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all" onClick={() => handleEdit(idx)}>Editar</button>
<button className="px-3 py-1 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all" onClick={() => handleDelete(idx)}>Eliminar</button>                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de creación */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-xl font-bold text-blue-600 mb-2">Crear usuario</h3>
            <label className="text-sm font-semibold">Nombre
              <input className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={createData.nombre} onChange={e => setCreateData(d => ({ ...d, nombre: e.target.value }))} />
            </label>
            <label className="text-sm font-semibold">Correo
              <input className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={createData.correo} onChange={e => setCreateData(d => ({ ...d, correo: e.target.value }))} />
            </label>
            <label className="text-sm font-semibold">Contraseña
              <input type="password" className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={createData.contrasena} onChange={e => setCreateData(d => ({ ...d, contrasena: e.target.value }))} placeholder="Contraseña" />
            </label>
            <label className="text-sm font-semibold">Rol
              <select className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={createData.rol} onChange={e => setCreateData(d => ({ ...d, rol: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Estado
              <select className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={createData.estado} onChange={e => setCreateData(d => ({ ...d, estado: e.target.value }))}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
            <div className="flex gap-2 justify-end mt-2">
              <button className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700" onClick={() => {
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
              }}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-xl font-bold text-blue-600 mb-2">Editar usuario</h3>
            <label className="text-sm font-semibold">Nombre
              <input className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={editData.nombre} onChange={e => setEditData(d => ({ ...d, nombre: e.target.value }))} />
            </label>
            <label className="text-sm font-semibold">Correo
              <input className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={editData.correo} onChange={e => setEditData(d => ({ ...d, correo: e.target.value }))} />
            </label>
            <label className="text-sm font-semibold">Contraseña
              <input type="password" className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={editData.contrasena} onChange={e => setEditData(d => ({ ...d, contrasena: e.target.value }))} placeholder="Contraseña (dejar vacío para no cambiar)" />
            </label>
            <label className="text-sm font-semibold">Rol
              <select className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={editData.rol} onChange={e => setEditData(d => ({ ...d, rol: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Estado
              <select className="w-full rounded-xl border border-border p-3 text-base focus:ring-2 focus:ring-blue-200 outline-none mt-1" value={editData.estado} onChange={e => setEditData(d => ({ ...d, estado: e.target.value }))}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
            <div className="flex gap-2 justify-end mt-2">
              <button className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => setEditIdx(null)}>Cancelar</button>
              <button className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Technicians;
