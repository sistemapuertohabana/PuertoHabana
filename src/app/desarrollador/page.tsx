'use client';
import { useState, useEffect } from 'react';
import { UserPlus, AlertTriangle, Code2 } from 'lucide-react';

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
      {/* Header minimalista */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
          <Code2 size={20} className="text-purple-500" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Desarrollador</h1>
          <p className="text-xs text-gray-400 mt-0.5">Superusuario · Reset DB · Crear Admin</p>
        </div>
      </div>

      {status.msg && (
        <div className={`mb-5 px-4 py-3 rounded-lg border text-xs font-medium ${
          status.type === 'error'
            ? 'bg-red-50 border-red-100 text-red-700'
            : 'bg-green-50 border-green-100 text-green-700'
        }`}>
          {status.msg}
        </div>
      )}

      {/* Crear Admin */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm mb-4">
        <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus size={15} className="text-gray-400" strokeWidth={1.5} />
          Forzar Creación de Admin
        </h2>
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            placeholder="Nombre (ej. Super Admin)"
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-200 placeholder-gray-400"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Correo (ej. admin@gmail.com)"
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-200 placeholder-gray-400"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <button
            onClick={handleCreateAdmin}
            className="bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Crear Admin
          </button>
        </div>

        {/* Lista de Admins */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-[10px] font-medium uppercase text-gray-400 tracking-wider mb-3">
            Admins Registrados ({admins.length})
          </p>
          {admins.length === 0 ? (
            <p className="text-xs text-gray-400">No hay administradores registrados.</p>
          ) : (
            <div className="space-y-1.5">
              {admins.map((a: any) => (
                <div key={a.id} className="flex justify-between items-center px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                    <p className="text-[11px] text-gray-400">{a.email}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    a.activo
                      ? 'bg-green-50 text-green-700 border-green-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {a.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium text-red-600 mb-4 flex items-center gap-2">
          <AlertTriangle size={15} strokeWidth={1.5} />
          Zona de Peligro (Reset DB)
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Borrar todas las ventas</p>
              <p className="text-[11px] text-gray-400">Elimina historial de comandas y ventas.</p>
            </div>
            <button
              onClick={handleResetSales}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors shrink-0 ml-3"
            >
              Resetear
            </button>
          </div>
          
          <div className="flex items-center justify-between px-3 py-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Borrar todo el personal</p>
              <p className="text-[11px] text-gray-400">Elimina mozos, cocina y lavaplatos.</p>
            </div>
            <button
              onClick={handleResetStaff}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors shrink-0 ml-3"
            >
              Resetear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
