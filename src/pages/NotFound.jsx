import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f6fbff] to-[#eaf3fa] px-2 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-primary-500 mb-4">404</h1>
        <p className="text-xl font-bold text-gray-700 mb-2">Página no encontrada</p>
        <p className="text-gray-500">La ruta que buscas no existe o no tienes acceso.</p>
      </div>
    </div>
  );
}
