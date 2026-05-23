'use client';
import { useState, useEffect } from 'react';
import { Trash2, UserPlus, AlertTriangle, Code2 } from 'lucide-react';

export default function DevDashboard() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [admins, setAdmins] = useState<any[]>([]);
  const [status, setStatus] = useState({ msg: '', type: '' });

  const loadAdmins = async () => {
    try {
      const res = await fetch('/api/dev/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadAdmins();
  }, []);

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
      loadAdmins();
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
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-purple-100 p-2.5 rounded-xl">
          <Code2 className="text-purple-600" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Desarrollador</h1>
          <p className="text-gray-500 text-sm">Superusuario · Reset DB · Crear Admin</p>
        </div>
      </div>

      {status.msg && (
        <div className={`p-4 rounded-xl mt-6 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          {status.msg}
        </div>
      )}

      {/* Crear Admin */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><UserPlus size={18} className="text-blue-600"/> Forzar Creación de Admin</h2>
        <div className="flex flex-col gap-3">
          <input type="text" placeholder="Nombre (ej. Super Admin)" className="bg-gray-50 border border-gray-200 text-gray-900 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder-gray-400" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          <input type="email" placeholder="Correo (ej. admin@gmail.com)" className="bg-gray-50 border border-gray-200 text-gray-900 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder-gray-400" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          <button onClick={handleCreateAdmin} className="bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition text-sm">Crear Admin</button>
        </div>

        {/* Lista de Admins */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Admins Registrados ({admins.length})</h3>
          {admins.length === 0 ? (
            <p className="text-sm text-gray-400">No hay administradores registrados.</p>
          ) : (
            <ul className="space-y-2">
              {admins.map((a: any) => (
                <li key={a.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{a.nombre}</p>
                    <p className="text-xs text-gray-500">{a.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${a.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 mt-6">
        <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Zona de Peligro (Reset DB)</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="font-bold text-gray-900 text-sm">Borrar todas las ventas</p>
              <p className="text-xs text-gray-500">Elimina historial de comandas y ventas diarias.</p>
            </div>
            <button onClick={handleResetSales} className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition text-sm border border-red-200">Resetear Ventas</button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">Borrar todo el personal</p>
              <p className="text-xs text-gray-500">Elimina mozos, cocina y lavaplatos (mantiene admins).</p>
            </div>
            <button onClick={handleResetStaff} className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition text-sm border border-red-200">Resetear Personal</button>
          </div>
        </div>
      </div>

    </div>
  );
}
