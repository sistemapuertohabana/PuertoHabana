'use client';
import { useState } from 'react';
import { Trash2, UserPlus, AlertTriangle, Code2 } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 mb-6 inline-block transition-colors">← Volver al inicio</Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="bg-red-500/10 p-2.5 rounded-xl">
            <Code2 className="text-red-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Desarrollador</h1>
            <p className="text-gray-500 text-sm">Superusuario · Reset DB · Crear Admin</p>
          </div>
        </div>

        {status.msg && (
          <div className={`p-4 rounded-xl mt-6 text-sm font-medium ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            {status.msg}
          </div>
        )}

        {/* Crear Admin */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mt-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><UserPlus size={18} className="text-blue-400"/> Forzar Creación de Admin</h2>
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Nombre (ej. Super Admin)" className="bg-gray-800 border border-gray-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder-gray-500" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            <input type="email" placeholder="Correo (ej. admin@gmail.com)" className="bg-gray-800 border border-gray-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder-gray-500" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            <button onClick={handleCreateAdmin} className="bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition text-sm">Crear Admin</button>
          </div>
        </div>

        {/* Zona de peligro */}
        <div className="bg-gray-900 rounded-2xl border border-red-500/20 p-6 mt-6">
          <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Zona de Peligro (Reset DB)</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <p className="font-bold text-white text-sm">Borrar todas las ventas</p>
                <p className="text-xs text-gray-500">Elimina historial de comandas y ventas diarias.</p>
              </div>
              <button onClick={handleResetSales} className="bg-red-500/10 text-red-400 font-bold px-4 py-2 rounded-xl hover:bg-red-500/20 transition text-sm border border-red-500/20">Resetear Ventas</button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Borrar todo el personal</p>
                <p className="text-xs text-gray-500">Elimina mozos, cocina y lavaplatos (mantiene admins).</p>
              </div>
              <button onClick={handleResetStaff} className="bg-red-500/10 text-red-400 font-bold px-4 py-2 rounded-xl hover:bg-red-500/20 transition text-sm border border-red-500/20">Resetear Personal</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
