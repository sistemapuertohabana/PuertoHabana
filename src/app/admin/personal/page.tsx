'use client';

import { useState, useEffect } from 'react';
import { User, Plus, X, Loader2, Edit2, Trash2 } from 'lucide-react';
import { fetchProfiles } from '@/lib/db/admin';
import type { ProfileRow } from '@/lib/database.types';

const rolLabels: Record<string, string> = {
  admin: 'Administrador',
  mozo: 'Mozo',
  cocina: 'Cocinero',
  ayudante_cocina: 'Ayudante de Cocina',
  lavaplato: 'Lavaplatos',
};

export default function PersonalPage() {
  const [personal, setPersonal] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('mozo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProfiles = () => {
    setLoading(true);
    setError('');
    
    // Fallback timeout in case Supabase hangs
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('La conexión está tardando demasiado. Verifica tu internet o recarga.');
    }, 8000);

    fetchProfiles()
      .then((data) => {
        clearTimeout(timeout);
        setPersonal(data);
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error(err);
        setError('Error al cargar perfiles. Por favor recarga la página.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const endpoint = editingId ? '/api/auth/update-user' : '/api/auth/create-user';
      const bodyPayload = editingId 
        ? { id: editingId, nombre, email, password, rol, dni }
        : { nombre, email, password, rol, dni };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear el personal');
        return;
      }

      // Success
      setShowForm(false);
      setEditingId(null);
      setNombre('');
      setDni('');
      setEmail('');
      setPassword('');
      setRol('mozo');
      loadProfiles(); // Refresh list
    } catch (err) {
      setError('Error de conexión al crear el personal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (p: ProfileRow) => {
    setEditingId(p.id);
    setNombre(p.nombre);
    setDni(p.dni || '');
    setEmail(p.email);
    setRol(p.rol);
    setPassword(''); // leave blank unless changing
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNombre('');
    setDni('');
    setEmail('');
    setPassword('');
    setRol('mozo');
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    try {
      const res = await fetch('/api/auth/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al eliminar el usuario');
        return;
      }
      loadProfiles();
    } catch (e) {
      alert('Error de conexión al eliminar el usuario');
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Personal</h1>
          <p className="text-sm text-gray-500 mt-2">
            Gestiona los usuarios y accesos al sistema Puerto Habana.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={20} />
            Crear Personal
          </button>
        )}
      </div>

      {error && !showForm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <p>{error}</p>
          <button onClick={loadProfiles} className="text-sm font-bold hover:underline">Reintentar</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 relative animate-in slide-in-from-top-4 duration-300">
          <button 
            onClick={handleCloseForm}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {editingId ? 'Editar miembro del personal' : 'Nuevo miembro del personal'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej. Juan Pérez"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI (Opcional)</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej. 12345678"
                maxLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="mozo1@puertohabana.pe"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña {editingId && <span className="text-gray-400 font-normal">(dejar en blanco para no cambiar)</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingId}
                minLength={6}
                placeholder={editingId ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol en el sistema</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="mozo">Mozo (Atención en mesas)</option>
                <option value="cocina">Cocinero (Preparación principal)</option>
                <option value="ayudante_cocina">Ayudante de Cocina</option>
                <option value="lavaplato">Lavaplatos</option>
                <option value="admin">Administrador (Control total)</option>
              </select>
            </div>

            {error && (
              <div className="md:col-span-2">
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {error}
                </p>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (editingId ? 'Guardar Cambios' : 'Crear usuario')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !personal.length ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {personal.map((p) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border border-blue-100 text-blue-600">
                    <User size={26} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{p.nombre}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{p.email}</p>
                    {p.dni && <p className="text-xs text-gray-400 mt-0.5">DNI: {p.dni}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => openEdit(p)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                  p.rol === 'admin' ? 'bg-purple-100 text-purple-700' :
                  p.rol === 'mozo' ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {rolLabels[p.rol] ?? p.rol}
                </span>
                {p.area_id && (
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md border">
                    Área: {p.area_id}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && personal.length === 0 && (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-medium text-gray-600">No hay perfiles registrados</p>
          <p className="text-sm mt-1">Agrega a tu primer miembro del personal usando el botón de arriba.</p>
        </div>
      )}
    </div>
  );
}
