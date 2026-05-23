'use client';
import { useState } from 'react';
import { Trash2, UserPlus, AlertTriangle } from 'lucide-react';

export default function DevDashboard() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [status, setStatus] = useState({ msg: '', type: '' });

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminName) {
      setStatus({ msg: 'Llena nombre y correo', type: 'error' });
      return;
    }
    const res = await fetch('/api/dev/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: adminName, email: adminEmail })
    });
    const data = await res.json();
    if (data.success) {
      setStatus({ msg: 'Admin creado/actualizado con éxito', type: 'success' });
      setAdminEmail('');
      setAdminName('');
    } else {
      setStatus({ msg: data.error || 'Error', type: 'error' });
    }
  };

  const handleResetSales = async () => {
    if (!confirm('¿Estás SEGURO de borrar TODAS las comandas y ventas de Supabase?')) return;
    const res = await fetch('/api/dev/reset-sales', { method: 'POST' });
    const data = await res.json();
    setStatus({ msg: data.success ? data.message : data.error, type: data.success ? 'success' : 'error' });
  };

  const handleResetStaff = async () => {
    if (!confirm('¿Estás SEGURO de borrar a todo el personal (menos admin)?')) return;
    const res = await fetch('/api/dev/reset-staff', { method: 'POST' });
    const data = await res.json();
    setStatus({ msg: data.success ? data.message : data.error, type: data.success ? 'success' : 'error' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="text-red-500" />
          Developer Dashboard
        </h1>
        <p className="text-gray-500 mb-8">Panel de superusuario para resetear la base de datos o forzar la creación del Admin principal.</p>

        {status.msg && (
          <div className={`p-4 rounded-lg mb-6 ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {status.msg}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><UserPlus size={20}/> Forzar Creación de Admin</h2>
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Nombre (ej. Super Admin)" className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            <input type="email" placeholder="Correo (ej. admin@gmail.com)" className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            <button onClick={handleCreateAdmin} className="bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition">Crear Admin</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2"><Trash2 size={20}/> Zona de Peligro (Reset DB)</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-bold text-gray-800">Borrar todas las ventas</p>
                <p className="text-sm text-gray-500">Elimina historial de comandas y ventas diarias de Supabase.</p>
              </div>
              <button onClick={handleResetSales} className="bg-red-100 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-200 transition">Resetear Ventas</button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800">Borrar todo el personal</p>
                <p className="text-sm text-gray-500">Elimina mozos, cocina y lavaplatos (mantiene admins).</p>
              </div>
              <button onClick={handleResetStaff} className="bg-red-100 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-200 transition">Resetear Personal</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
