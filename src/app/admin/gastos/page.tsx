'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, MessageSquare, ChefHat, Beer, Package, DollarSign, StickyNote, X, Clock, Loader2, Send } from 'lucide-react';

interface Nota {
  id: string;
  contenido: string;
  tags: string[];
  monto: number | null;
  created_at: string;
}

const TAG_INFO: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  gasto:   { label: 'Gasto',   color: 'bg-red-100 text-red-700 border-red-200',    icon: DollarSign },
  cocina:  { label: 'Cocina',  color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ChefHat },
  bebidas: { label: 'Bebidas', color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: Beer },
  insumos: { label: 'Insumos', color: 'bg-teal-100 text-teal-700 border-teal-200',   icon: Package },
  nota:    { label: 'Nota',    color: 'bg-gray-100 text-gray-700 border-gray-200',   icon: StickyNote },
};

function detectarTags(contenido: string): string[] {
  const tags: string[] = [];
  const upper = contenido.toUpperCase().trim();
  const match = upper.match(/^\[(\w+)\]/) || upper.match(/^(\w+)[:\s]/);
  if (match) {
    const tag = match[1].toLowerCase();
    if (['gasto', 'cocina', 'bebidas', 'insumos', 'nota'].includes(tag)) {
      tags.push(tag);
    }
  }
  if (tags.length === 0) {
    tags.push('nota');
  }
  if (!tags.includes('gasto') && /\bgasto\b/i.test(contenido)) {
    tags.push('gasto');
  }
  return tags;
}

function formatearFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function NotasPage() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [contenido, setContenido] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);

  const loadNotas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTag) params.append('tag', filtroTag);
      const res = await fetch(`/api/notas?${params.toString()}`);
      if (res.ok) setNotas(await res.json());
      else throw new Error();
    } catch {
      setNotas([]);
    }
    setLoading(false);
  }, [filtroTag]);

  useEffect(() => { loadNotas(); }, [loadNotas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    setIsSaving(true);

    try {
      if (editandoId) {
        await fetch(`/api/notas/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contenido: contenido.trim() }),
        });
      } else {
        await fetch('/api/notas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contenido: contenido.trim() }),
        });
      }
      setContenido('');
      setEditandoId(null);
      await loadNotas();
    } catch {
      // Fallback localStorage
      const current: Nota[] = JSON.parse(localStorage.getItem('ph_notas') || '[]');
      const tags = detectarTags(contenido);
      if (editandoId) {
        const updated = current.map(n => n.id === editandoId ? { ...n, contenido: contenido.trim(), tags } : n);
        localStorage.setItem('ph_notas', JSON.stringify(updated));
        setNotas(updated);
      } else {
        const nueva: Nota = {
          id: String(Date.now()),
          contenido: contenido.trim(),
          tags,
          monto: null,
          created_at: new Date().toISOString(),
        };
        const updated = [nueva, ...current];
        localStorage.setItem('ph_notas', JSON.stringify(updated));
        setNotas(updated);
      }
      setContenido('');
      setEditandoId(null);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
      await fetch(`/api/notas/${id}`, { method: 'DELETE' });
      await loadNotas();
    } catch {
      const current: Nota[] = JSON.parse(localStorage.getItem('ph_notas') || '[]');
      const updated = current.filter(n => n.id !== id);
      localStorage.setItem('ph_notas', JSON.stringify(updated));
      setNotas(updated);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('¿Eliminar TODAS las notas? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch('/api/notas', { method: 'DELETE' });
      if (res.ok) {
        setNotas([]);
        localStorage.removeItem('ph_notas');
      }
    } catch {
      // Fallback: limpiar localStorage
      localStorage.removeItem('ph_notas');
      setNotas([]);
    }
  };

  const handleEdit = (nota: Nota) => {
    setContenido(nota.contenido);
    setEditandoId(nota.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setContenido('');
    setEditandoId(null);
  };

  // Tags disponibles para el filtro
  const allTags = Array.from(new Set(notas.flatMap(n => n.tags)));

  // Nota seleccionada para el preview
  const tagsPreview = contenido ? detectarTags(contenido) : [];

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Bloc de Notas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Escribe con <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">[Tag]</code> para clasificar automáticamente.
          </p>
        </div>
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MessageSquare size={14} />
          {showHint ? 'Ocultar' : 'Mostrar'} ayudas
        </button>
      </div>

      {/* Hint panel */}
      {showHint && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <MessageSquare size={15} />
            Escribe con tags para clasificar automáticamente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {Object.entries(TAG_INFO).map(([key, info]) => {
              const Icon = info.icon;
              return (
                <div key={key} className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2 border border-blue-100">
                  <Icon size={14} className="text-gray-500" />
                  <code className="font-mono font-semibold text-blue-700">[{info.label}]</code>
                  <span className="text-gray-500">— mensaje para {info.label.toLowerCase()}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-blue-600 mt-2">
            💡 Ej: <code className="font-mono bg-blue-100 px-1 rounded">[Gasto] Compre 50kg de arroz S/120</code> → se registra en gastos automáticamente
          </p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe tu nota aquí... Ej: [Cocina] Preparar 30 ceviches para el evento"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none placeholder-gray-400"
            />
            {/* Tag preview */}
            {contenido && tagsPreview.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] text-gray-400 font-medium">Se detectará como:</span>
                {tagsPreview.map(tag => {
                  const info = TAG_INFO[tag];
                  if (!info) return null;
                  const Icon = info.icon;
                  return (
                    <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${info.color}`}>
                      <Icon size={10} />
                      {info.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSaving || !contenido.trim()}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              title={editandoId ? 'Actualizar nota' : 'Guardar nota'}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-100 text-gray-600 p-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center"
                title="Cancelar edición"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Filtros por tag + limpiar todo */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-red-200 text-red-600 hover:bg-red-50 ml-auto"
            title="Eliminar todas las notas"
          >
            <Trash2 size={12} />
            Limpiar todo
          </button>
          <button
            onClick={() => setFiltroTag(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              filtroTag === null
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          {allTags.map(tag => {
            const info = TAG_INFO[tag];
            if (!info) return null;
            const Icon = info.icon;
            const count = notas.filter(n => n.tags.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setFiltroTag(filtroTag === tag ? null : tag)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  filtroTag === tag
                    ? info.color + ' ring-2 ring-offset-1'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon size={12} />
                {info.label}
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de notas */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-300" />
        </div>
      )}

      {!loading && (
        <>
          {notas.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <StickyNote size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-500">No hay notas todavía</p>
              <p className="text-xs text-gray-400 mt-1">Escribe tu primera nota arriba 👆</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notas.map(nota => (
                <div
                  key={nota.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Tags */}
                      {nota.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {nota.tags.map(tag => {
                            const info = TAG_INFO[tag];
                            if (!info) return null;
                            const Icon = info.icon;
                            return (
                              <span
                                key={tag}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${info.color}`}
                              >
                                <Icon size={10} />
                                {info.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {/* Contenido */}
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {nota.contenido}
                      </p>
                      {/* Monto si es gasto */}
                      {nota.monto && (
                        <p className="text-sm font-bold text-red-600 mt-1">
                          S/ {Number(nota.monto).toFixed(2)}
                        </p>
                      )}
                      {/* Fecha */}
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                        <Clock size={10} />
                        {formatearFecha(nota.created_at)}
                      </div>
                    </div>
                    {/* Acciones */}
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(nota)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(nota.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
