'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Search, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PagosMozoPage() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ph_mozo_session');
      if (stored) setSession(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    const fetchPagos = async () => {
      if (!session?.nombre) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('pagos_personal')
        .select('*')
        .ilike('nombre', `%${session.nombre}%`)
        .order('created_at', { ascending: false });
      
      if (data) setPagos(data);
      setLoading(false);
    };
    if (session) fetchPagos();
  }, [session]);

  const totalRecibido = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">Mis Pagos</h1>
          <p className="text-gray-500 mt-1">Historial de pagos recibidos por el administrador.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 mb-6">
        <div className="p-4 bg-green-50 text-green-600 rounded-xl">
          <DollarSign size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total Recibido (Histórico)</p>
          <p className="text-2xl font-bold text-gray-900">S/ {totalRecibido.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando pagos...</div>
        ) : pagos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <DollarSign size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-500">Aún no tienes pagos registrados en el sistema.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Concepto</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Calendar size={14} />
                      {new Date(p.created_at).toLocaleDateString('es-PE')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{p.concepto}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">
                    S/ {Number(p.monto).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
