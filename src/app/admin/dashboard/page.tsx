'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import Boleta from '@/components/Boleta';
import CobrarBoleta from '@/components/CobrarBoleta';
import { addToSyncQueue } from '@/components/ServiceWorkerRegister';


interface InventoryItem {
  id: string | number;
  seccion: string;
  nombre: string;
  precio: number;
  costo: number;
  cantidad: number;
  categoria?: string;
}

// Helper para obtener fecha local en formato YYYY-MM-DD
function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
import { 
  Utensils, 
  Wine, 
  Users, 
  DollarSign, 
  Calendar,
  Clock,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCw,
  Sparkles,
  ClipboardList,
  Download,
  Trash2,
  Printer,
  X,
  MessageSquare,
  Tag
} from 'lucide-react';

type TabType = 'activos' | 'historial' | 'ventas_mozo' | 'reportes';
type RangoHistorial = 'dia' | 'semana' | 'mes';

interface Pedido {
  id: number | string;
  item: string;
  cantidad: number;
  mesa: string;
  precio: number;
  estado: 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado';
  hora: string;
  notas?: string;
  mozoId: string;
  mozoNombre: string;
  fecha: string;
  category: 'comida' | 'bebidas';
  comandaId?: string;
  mesaId?: number;
  metodo_pago?: 'Efectivo' | 'Yape' | 'Tarjeta' | 'Otro';
}

interface InsumoWaste {
  id: number | string;
  descripcion: string;
  costo: number;
  fecha: string;
}

interface StaffPayment {
  id: number | string;
  mozoNombre: string;
  monto: number;
  concepto: string;
  fecha: string;
}

interface Personal {
  id: string;
  nombre: string;
  rol: string;
  salario_monto?: number;
  salario_tipo?: string;
}

interface Comanda {
  id: number | string;
  mesa: string;
  mesa_nombre?: string;
  mozo_id?: string;
  mozo_nombre?: string;
  estado: string;
  hora: string;
  fecha: string;
  metodo_pago?: 'Efectivo' | 'Yape' | 'Tarjeta' | 'Otro';
  items?: ComandaItem[];
}

interface ComandaItem {
  id: number | string;
  nombre: string;
  cantidad: number;
  precio: number;
  categoria?: string;
  notas?: string;
}

const platosMenu = [
  { name: 'Ceviche Mixto', price: 45.00, category: 'comida' as const },
  { name: 'Ceviche de Pescado', price: 42.00, category: 'comida' as const },
  { name: 'Arroz con Mariscos', price: 38.00, category: 'comida' as const },
  { name: 'Lomo Saltado', price: 32.00, category: 'comida' as const },
  { name: 'Jalea Mixta', price: 40.00, category: 'comida' as const },
  { name: 'Leche de Tigre', price: 20.00, category: 'comida' as const },
  { name: 'Cerveza Pilsner', price: 12.00, category: 'bebidas' as const },
  { name: 'Inca Kola', price: 5.00, category: 'bebidas' as const },
  { name: 'Chicha Morada', price: 8.00, category: 'bebidas' as const },
  { name: 'Jugo de Naranja', price: 8.00, category: 'bebidas' as const },
];


export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('activos');
  const [mozosList, setMozosList] = useState<{ id: string; nombre: string }[]>([]);
  const [allStaffList, setAllStaffList] = useState<{ id: string; nombre: string; salario_monto?: number; salario_tipo?: string; rol?: string }[]>([]);
  const [platosMenuDynamic] = useState(platosMenu);
  
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [selectedMesaBoleta, setSelectedMesaBoleta] = useState<{ mesa: string; mozoNombre: string; items: Pedido[]; hora: string } | null>(null);
  const [mozoHistoryModal, setMozoHistoryModal] = useState<{ id: string; nombre: string } | null>(null);
  const [showClienteSearchForMesa, setShowClienteSearchForMesa] = useState<{ mesa: string; mozoNombre: string; items: Pedido[]; hora: string } | null>(null);
  const [clienteInfoForMesa, setClienteInfoForMesa] = useState<{ nombre: string; documento?: string } | null>(null);
  const [clienteSearchQuery, setClienteSearchQuery] = useState('');
  const [clientesSearchResults, setClientesSearchResults] = useState<{ id: number; nombre: string; dni?: string; ruc?: string }[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  
  // Date Simulation
  const [simulatedDate, setSimulatedDate] = useState('2026-05-19');
  const [isManualSim, setIsManualSim] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Reports State
  const [insumosWasted, setInsumosWasted] = useState<InsumoWaste[]>([]);
  
  const [staffPayments, setStaffPayments] = useState<StaffPayment[]>([]);
  const [inventarioItems, setInventarioItems] = useState<InventoryItem[]>([]);
  const [ultimasNotas, setUltimasNotas] = useState<{ id: number; contenido: string; tags: string[]; monto: number | null; created_at: string }[]>([]);


  // Forms state
  const [wasteForm, setWasteForm] = useState({ descripcion: '', costo: '', fecha: '' });
  const [paymentForm, setPaymentForm] = useState({ mozoNombre: 'Juan Pérez', monto: '', concepto: '', fecha: '' });
  
  // Registration Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    mozoId: '',
    mesa: 'Mesa 1',
    platoIndex: 0,
    cantidad: 1,
    notas: '',
  });

  // History State
  const [rangoHistorial, setRangoHistorial] = useState<RangoHistorial>('dia');
  const [selectedDateForHistory, setSelectedDateForHistory] = useState('2026-05-19');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2026, 4, 19)); // May 2026
  const [searchQuery, setSearchQuery] = useState('');

  // Date Formatting helper
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  };

  useEffect(() => {
    // Initialize all state from localStorage in a single batch
    const savedActiveTab = localStorage.getItem('puerto_habana_active_tab') as TabType;
    const savedSimDate = localStorage.getItem('puerto_habana_simulated_date');
    const manualSimFlag = localStorage.getItem('puerto_habana_is_manual_sim') === 'true';

    // Batch state updates to avoid cascading renders
    requestAnimationFrame(() => {
      setMounted(true);

      if (savedActiveTab && ['activos', 'historial', 'ventas_mozo', 'reportes'].includes(savedActiveTab)) {
        setActiveTab(savedActiveTab);
      }

      setIsManualSim(manualSimFlag);
      let activeSimDate = savedSimDate || getLocalDateString();
      const realTodayStr = getLocalDateString();
      if (!manualSimFlag && activeSimDate !== realTodayStr) {
        activeSimDate = realTodayStr;
        localStorage.setItem('puerto_habana_simulated_date', realTodayStr);
      }
      setSimulatedDate(activeSimDate);
      setSelectedDateForHistory(activeSimDate);
      const parts = activeSimDate.split('-');
      setCalendarMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
    });

    // ── Cargar datos desde APIs en paralelo ──────────────────────────────
    const loadAll = async () => {
      // Helper para fallback a localStorage
      const fallbackPersonal = () => {
        try {
          const data = JSON.parse(localStorage.getItem('ph_personal') || '[]');
          const mozos = data.filter((x: Personal) => x.rol === 'mozo').map((x: Personal) => ({ id: x.id, nombre: x.nombre }));
          const allStaff = data.map((x: Personal) => ({ id: x.id, nombre: x.nombre, salario_monto: x.salario_monto, salario_tipo: x.salario_tipo, rol: x.rol }));
          if (mozos.length) { setMozosList(mozos); setSelectedWaiterId(mozos[0].id); }
          setAllStaffList(allStaff);
        } catch {}
      };

      // Ejecutar todas las llamadas API en paralelo
      await Promise.all([
        (async () => {
          try {
            const res = await fetch('/api/personal');
            if (res.ok) {
              const data = await res.json();
              localStorage.setItem('ph_personal', JSON.stringify(data));
              const mozos = data.filter((x: Personal) => x.rol === 'mozo').map((x: Personal) => ({ id: x.id, nombre: x.nombre }));
              const allStaff = data.map((x: Personal) => ({ id: x.id, nombre: x.nombre, salario_monto: x.salario_monto, salario_tipo: x.salario_tipo, rol: x.rol }));
              setAllStaffList(allStaff);
              if (mozos.length) {
                setMozosList(mozos);
                setSelectedWaiterId((prev: string) => prev || mozos[0].id);
                setNewOrder((n: typeof newOrder) => ({ ...n, mozoId: n.mozoId || mozos[0].id }));
              }
              if (allStaff.length) {
                const first = allStaff[0];
                setPaymentForm((f: typeof paymentForm) => ({ 
                  ...f, 
                  mozoNombre: first.nombre,
                  monto: first.rol === 'dev' ? '' : (first.salario_monto ? String(first.salario_monto) : ''),
                  concepto: first.rol === 'dev' ? 'Pago contratista' : (first.salario_tipo ? `Pago ${first.salario_tipo}` : 'Jornal')
                }));
              }
            }
          } catch {
            fallbackPersonal();
          }
        })(),
        (async () => {
          try {
            const res = await fetch('/api/reportes/wastes');
            if (res.ok) { setInsumosWasted(await res.json()); }
          } catch {
            try { setInsumosWasted(JSON.parse(localStorage.getItem('puerto_habana_wastes') || '[]')); } catch {}
          }
        })(),
        (async () => {
          try {
            const res = await fetch('/api/reportes/payments');
            if (res.ok) { setStaffPayments(await res.json()); }
          } catch {
            try { setStaffPayments(JSON.parse(localStorage.getItem('puerto_habana_payments') || '[]')); } catch {}
          }
        })(),
        (async () => {
          try {
            const res = await fetch('/api/pedidos');
            if (res.ok) {
              const data = await res.json();
              const normalized = data.flatMap((c: Comanda) =>
                (c.items || []).map((item: ComandaItem) => ({
                  id: `${c.id}-${item.id}`,
                  item: item.nombre,
                  cantidad: item.cantidad,
                  mesa: c.mesa_nombre || c.mesa,
                  precio: item.precio,
                  estado: c.estado,
                  hora: c.hora,
                  notas: item.notas,
                  mozoId: c.mozo_id || '',
                  mozoNombre: c.mozo_nombre || '',
                  fecha: c.fecha,
                  category: item.categoria || 'comida',
                  comandaId: String(c.id),
                  metodo_pago: c.metodo_pago || 'Efectivo',
                }))
              );
              setPedidos(normalized);
            }
          } catch {
            try { setPedidos(JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]')); } catch {}
          }
        })(),
        (async () => {
          try {
            const res = await fetch('/api/inventario');
            if (res.ok) {
              const data = await res.json();
              setInventarioItems(data);
            }
          } catch {
            try { setInventarioItems(JSON.parse(localStorage.getItem('ph_inventario') || '[]')); } catch {}
          }
        })(),
        (async () => {
          try {
            const res = await fetch('/api/notas?limit=5');
            if (res.ok) setUltimasNotas(await res.json());
          } catch {}
        })(),
      ]);
    };

    loadAll();

  }, []);

  // Real-time automatic midnight clock checker
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      const todayStr = getLocalDateString();
      const currentSimDate = localStorage.getItem('puerto_habana_simulated_date') || getLocalDateString();
      const manualSimFlag = localStorage.getItem('puerto_habana_is_manual_sim') === 'true';
      
      if (!manualSimFlag && currentSimDate !== todayStr) {
        setSimulatedDate(todayStr);
        setSelectedDateForHistory(todayStr);
        localStorage.setItem('puerto_habana_simulated_date', todayStr);
        
        setToastMessage(`¡Nueva fecha de operación! El día de hoy ha comenzado (${formatDate(todayStr)}).`);
        setTimeout(() => setToastMessage(null), 6000);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [mounted, simulatedDate]);

  useEffect(() => {
    if (!mounted) return;
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  // ── Búsqueda debounced de clientes ──
  useEffect(() => {
    if (!showClienteSearchForMesa) return;
    const debounce = setTimeout(async () => {
      if (clienteSearchQuery.length < 2) {
        setClientesSearchResults([]);
        setLoadingClientes(false);
        return;
      }
      setLoadingClientes(true);
      try {
        const res = await fetch(`/api/clientes?search=${encodeURIComponent(clienteSearchQuery)}&limit=10`);
        if (res.ok) setClientesSearchResults(await res.json());
      } catch {} finally { setLoadingClientes(false); }
    }, 300);
    return () => clearTimeout(debounce);
  }, [clienteSearchQuery, showClienteSearchForMesa]);

  if (!mounted) {
    return (
      <div className="animate-pulse w-full">
        <div className="h-10 bg-gray-200 rounded-lg w-1/2 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          <div className="h-28 bg-gray-200 rounded-xl"></div>
          <div className="h-28 bg-gray-200 rounded-xl"></div>
          <div className="h-28 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Simulate Day Close / End of Day (00:00 AM Reset)
  const handleNextDaySimulate = () => {
    const parts = simulatedDate.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    date.setDate(date.getDate() + 1);
    const newDateStr = date.toISOString().split('T')[0];
    
    setSimulatedDate(newDateStr);
    setSelectedDateForHistory(newDateStr);
    localStorage.setItem('puerto_habana_simulated_date', newDateStr);
    localStorage.setItem('puerto_habana_is_manual_sim', 'true');
    setIsManualSim(true);
    
    // Shift calendar if needed
    const newParts = newDateStr.split('-');
    setCalendarMonth(new Date(parseInt(newParts[0]), parseInt(newParts[1]) - 1, 1));

    setToastMessage(`¡Día finalizado! Son las 00:00 hrs. Los pedidos de hoy se han archivado en el historial. Comienza el nuevo día: ${formatDate(newDateStr)}.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleResetDate = () => {
    const todayStr = getLocalDateString();
    setSimulatedDate(todayStr);
    setSelectedDateForHistory(todayStr);
    localStorage.setItem('puerto_habana_simulated_date', todayStr);
    localStorage.removeItem('puerto_habana_is_manual_sim');
    setIsManualSim(false);
    
    const parts = todayStr.split('-');
    setCalendarMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
    
    setToastMessage(`Fecha restablecida a la fecha real del sistema: ${formatDate(todayStr)}.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Financial metrics calculations
  const totalVentas = pedidos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const totalInsumosLoss = insumosWasted.reduce((sum, w) => sum + w.costo, 0);
  const totalStaffPayments = staffPayments.reduce((sum, p) => sum + p.monto, 0);
  const netProfit = totalVentas - totalInsumosLoss - totalStaffPayments;

  const handleAddWaste = async () => {
    if (!wasteForm.descripcion || !wasteForm.costo) return;
    try {
      const res = await fetch('/api/reportes/wastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: wasteForm.descripcion, costo: wasteForm.costo, fecha: simulatedDate }),
      });
      if (res.ok) {
        const { id } = await res.json();
        const newWaste = { id, descripcion: wasteForm.descripcion, costo: parseFloat(wasteForm.costo), fecha: simulatedDate };
        setInsumosWasted(prev => [newWaste, ...prev]);
      }
    } catch {
      addToSyncQueue('POST', '/api/reportes/wastes', { descripcion: wasteForm.descripcion, costo: wasteForm.costo, fecha: simulatedDate });
      const newWaste = { id: Date.now(), descripcion: wasteForm.descripcion, costo: parseFloat(wasteForm.costo) || 0, fecha: simulatedDate };
      const updated = [newWaste, ...insumosWasted];
      setInsumosWasted(updated);
      localStorage.setItem('puerto_habana_wastes', JSON.stringify(updated));
    }
    setWasteForm({ descripcion: '', costo: '', fecha: '' });
    setToastMessage('Pérdida de insumo registrada correctamente.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteWaste = async (id: string) => {
    try {
      await fetch(`/api/reportes/wastes?id=${id}`, { method: 'DELETE' });
    } catch {}
    setInsumosWasted(prev => prev.filter((w: InsumoWaste) => String(w.id) !== String(id)));
  };

  const handleAddPayment = async () => {
    if (!paymentForm.concepto || !paymentForm.monto) return;
    
    // Find the staff member to get their ID
    const staff = allStaffList.find(s => s.nombre === paymentForm.mozoNombre);
    
    try {
      const res = await fetch('/api/reportes/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: paymentForm.mozoNombre, 
          monto: paymentForm.monto, 
          concepto: paymentForm.concepto, 
          fecha: simulatedDate,
          usuario_id: staff?.id || null
        }),
      });
      if (res.ok) {
        const { id } = await res.json();
        const newPayment = { id, mozoNombre: paymentForm.mozoNombre, monto: parseFloat(paymentForm.monto), concepto: paymentForm.concepto, fecha: simulatedDate };
        setStaffPayments(prev => [newPayment, ...prev]);

        // Enviar notificacion al usuario pagado
        if (staff) {
          fetch('/api/notificaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usuario_id: staff.id,
              titulo: 'Pago Registrado',
              mensaje: `El administrador ha registrado tu pago de S/ ${paymentForm.monto} por el concepto de: ${paymentForm.concepto}`
            })
          }).catch(() => {});
        }
      }
    } catch {
      addToSyncQueue('POST', '/api/reportes/payments', { nombre: paymentForm.mozoNombre, monto: paymentForm.monto, concepto: paymentForm.concepto, fecha: simulatedDate });
      const newPayment = { id: Date.now(), mozoNombre: paymentForm.mozoNombre, monto: parseFloat(paymentForm.monto) || 0, concepto: paymentForm.concepto, fecha: simulatedDate };
      const updated = [newPayment, ...staffPayments];
      setStaffPayments(updated);
      localStorage.setItem('puerto_habana_payments', JSON.stringify(updated));
    }
    const resetStaff = allStaffList[0];
    setPaymentForm({ 
      mozoNombre: resetStaff?.nombre ?? '', 
      monto: resetStaff?.rol === 'dev' ? '' : (resetStaff?.salario_monto ? String(resetStaff.salario_monto) : ''), 
      concepto: resetStaff?.rol === 'dev' ? 'Pago contratista' : (resetStaff?.salario_tipo ? `Pago ${resetStaff.salario_tipo}` : 'Jornal'), 
      fecha: '' 
    });
    setToastMessage('Pago a personal registrado y deducido de la ganancia.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await fetch(`/api/reportes/payments?id=${id}`, { method: 'DELETE' });
    } catch {}
    setStaffPayments(prev => prev.filter((p: StaffPayment) => String(p.id) !== String(id)));
  };

  // ── Cálculo de margen de ganancia real basado en costo del inventario ──
  const getMargenData = () => {
    // Crear un mapa de nombre -> costo desde inventario
    const costMap: Record<string, number> = {};
    inventarioItems.forEach(item => {
      const key = item.nombre.toLowerCase().trim();
      // Si hay múltiples items con el mismo nombre, tomamos el costo promedio
      if (costMap[key]) {
        costMap[key] = (costMap[key] + (item.costo || 0)) / 2;
      } else {
        costMap[key] = item.costo || 0;
      }
    });

    // Calcular margen por producto vendido
    const productMargins: Record<string, { ventas: number; costoTotal: number; qty: number; category: string }> = {};
    pedidos.forEach(p => {
      const key = p.item;
      const costo = costMap[p.item.toLowerCase().trim()] || 0;
      if (!productMargins[key]) {
        productMargins[key] = { ventas: 0, costoTotal: 0, qty: 0, category: p.category };
      }
      productMargins[key].ventas += p.precio * p.cantidad;
      productMargins[key].costoTotal += costo * p.cantidad;
      productMargins[key].qty += p.cantidad;
    });

    return Object.entries(productMargins)
      .map(([name, data]) => ({
        name,
        ventas: data.ventas,
        costo: data.costoTotal,
        ganancia: data.ventas - data.costoTotal,
        margen: data.ventas > 0 ? ((data.ventas - data.costoTotal) / data.ventas * 100) : 0,
        qty: data.qty,
        category: data.category,
      }))
      .sort((a, b) => b.ganancia - a.ganancia);
  };

  const getMargenPorCategoria = () => {
    const categorias: Record<string, { ventas: number; costo: number }> = {};
    getMargenData().forEach(p => {
      const cat = p.category === 'bebidas' ? 'Bebidas' : p.category === 'comida' ? 'Comida' : 'Tapers';
      if (!categorias[cat]) categorias[cat] = { ventas: 0, costo: 0 };
      categorias[cat].ventas += p.ventas;
      categorias[cat].costo += p.costo;
    });
    return Object.entries(categorias).map(([nombre, data]) => ({
      nombre,
      ventas: data.ventas,
      costo: data.costo,
      ganancia: data.ventas - data.costo,
      margen: data.ventas > 0 ? ((data.ventas - data.costo) / data.ventas * 100) : 0,
    }));
  };

  // ── Cálculo de margen para historial de ventas (con filtro de órdenes) ──
  const getMargenHistorial = (orders: Pedido[]) => {
    const costMap: Record<string, number> = {};
    inventarioItems.forEach(item => {
      const key = item.nombre.toLowerCase().trim();
      if (costMap[key]) {
        costMap[key] = (costMap[key] + (item.costo || 0)) / 2;
      } else {
        costMap[key] = item.costo || 0;
      }
    });

    let totalVenta = 0;
    let totalCosto = 0;
    orders.forEach(p => {
      const costo = costMap[p.item.toLowerCase().trim()] || 0;
      totalVenta += p.precio * p.cantidad;
      totalCosto += costo * p.cantidad;
    });

    return {
      totalVenta,
      totalCosto,
      ganancia: totalVenta - totalCosto,
      margen: totalVenta > 0 ? ((totalVenta - totalCosto) / totalVenta * 100) : 0,
    };
  };

  // Helper to extract top dishes data dynamically from the orders list
  const getTopDishesData = () => {
    const counts: Record<string, { qty: number; revenue: number }> = {};
    pedidos.forEach(p => {
      if (!counts[p.item]) {
        counts[p.item] = { qty: 0, revenue: 0 };
      }
      counts[p.item].qty += p.cantidad;
      counts[p.item].revenue += p.precio * p.cantidad;
    });
    
    return Object.entries(counts)
      .map(([name, val]) => ({ name, qty: val.qty, revenue: val.revenue }))
      .sort((a, b) => b.qty - a.qty);
  };

  // Export financial and sales details to CSV/Excel format
  const exportToExcel = () => {
    let csvContent = "\ufeff"; // BOM for Excel UTF-8 support
    
    // Header for Financial Summary
    csvContent += "=== ESTADO DE RESULTADOS FINANCIEROS ===\n";
    csvContent += `Fecha del Reporte;${formatDate(simulatedDate)}\n`;
    csvContent += `Ventas Brutas Totales;S/ ${Number(totalVentas).toFixed(2)}\n`;
    csvContent += `Costo de Insumos Perdidos;S/ ${Number(totalInsumosLoss).toFixed(2)}\n`;
    csvContent += `Pagos Totales a Personal;S/ ${Number(totalStaffPayments).toFixed(2)}\n`;
    csvContent += `GANANCIA NETA DEL PERIODO;S/ ${(Number(totalVentas) - Number(totalInsumosLoss) - Number(totalStaffPayments)).toFixed(2)}\n\n`;
    
    // Wasted supplies
    csvContent += "=== DETALLE DE PERDIDA DE INSUMOS ===\n";
    csvContent += "ID;Descripcion;Costo;Fecha\n";
    insumosWasted.forEach(w => {
      csvContent += `${w.id};${w.descripcion};S/ ${Number(w.costo).toFixed(2)};${w.fecha}\n`;
    });
    csvContent += "\n";
    
    // Payroll payments
    csvContent += "=== DETALLE DE PAGOS AL PERSONAL ===\n";
    csvContent += "ID;Personal;Monto;Concepto;Fecha\n";
    staffPayments.forEach(p => {
      csvContent += `${p.id};${p.mozoNombre};S/ ${Number(p.monto).toFixed(2)};${p.concepto};${p.fecha}\n`;
    });
    csvContent += "\n";

    // Top Selling Dishes
    csvContent += "=== PLATOS MAS VENDIDOS (HISTORIAL) ===\n";
    csvContent += "Posicion;Producto;Cantidad Vendida;Ventas Totales\n";
    getTopDishesData().forEach((d, idx) => {
      csvContent += `${idx + 1};${d.name};${d.qty};S/ ${Number(d.revenue).toFixed(2)}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_financiero_puerto_habana_${simulatedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToastMessage("Reporte de Excel (.csv) exportado y descargado con éxito.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export detailed audit and statistical forecast report as a beautiful text file
  const exportStatisticalReport = () => {
    let report = "";
    report += "=========================================================================\n";
    report += "                  REPORTE ESTADÍSTICO - CEVICHERÍA PUERTO HABANA         \n";
    report += `                     Fecha de Auditoría: ${formatDate(simulatedDate)}    \n`;
    report += "=========================================================================\n\n";
    
    report += "1. BALANCE GENERAL Y NUEVA GANANCIA DEDUCIDA\n";
    report += "-------------------------------------------------------------------------\n";
    report += `   (+) Ventas de Comandas Registradas: S/ ${Number(totalVentas).toFixed(2)}\n`;
    report += `   (-) Pérdidas por Mermas / Insumos:  S/ ${Number(totalInsumosLoss).toFixed(2)}\n`;
    report += `   (-) Costos de Nómina y Personal:    S/ ${Number(totalStaffPayments).toFixed(2)}\n`;
    report += "   ----------------------------------------------------------------------\n";
    report += `   (=) GANANCIA NETA DEDUCIDA (Nueva): S/ ${(Number(totalVentas) - Number(totalInsumosLoss) - Number(totalStaffPayments)).toFixed(2)}\n\n`;
    
    report += "2. MANDO DE CONTROL DE RENDIMIENTO Y PRODUCTIVIDAD\n";
    report += "-------------------------------------------------------------------------\n";
    mozosList.forEach(m => {
      const orders = pedidos.filter(p => p.mozoId === m.id);
      const sales = orders.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      report += `   * Mozo: ${m.nombre.padEnd(20)} | Comandas: ${String(orders.length).padEnd(4)} | Total Generado: S/ ${Number(sales).toFixed(2)}\n`;
    });
    report += "\n";
    
    report += "3. RANKING DE PLATOS Y PRODUCTOS MÁS VENDIDOS\n";
    report += "-------------------------------------------------------------------------\n";
    getTopDishesData().forEach((d, idx) => {
      report += `   [Rank #${idx + 1}] ${d.name.padEnd(22)} | Cantidad: ${String(d.qty).padEnd(4)} u. | Total Recaudado: S/ ${Number(d.revenue).toFixed(2)}\n`;
    });
    report += "\n";
    
    report += "4. MODELO PREDICTIVO Y PRONÓSTICOS DE SALIDA DE PRODUCTOS\n";
    report += "-------------------------------------------------------------------------\n";
    report += "   [Pronóstico Diario]:\n";
    report += "   - Los días lunes a viernes se proyecta mayor rotación del Ceviche de Pescado.\n";
    report += "   - Fines de semana (sábado y domingo) lidera Ceviche Mixto con un incremento del 25%.\n\n";
    report += "   [Pronóstico Semanal - Demanda Estimada]:\n";
    report += "   - Ceviche de Pescado : ~120 platos estimados\n";
    report += "   - Arroz con Mariscos : ~85 platos estimados\n";
    report += "   - Ceviche Mixto      : ~75 platos estimados\n";
    report += "   - Jalea Mixta        : ~60 platos estimados\n\n";
    report += "   [Pronóstico Mensual - Distribución de Ventas Proyectada]:\n";
    report += "   - Línea Ceviches (Estrella)           : 42.5% del volumen general\n";
    report += "   - Línea Arroces y Mariscos            : 28.0% del volumen general\n";
    report += "   - Línea Cocina Caliente (Criollos)    : 18.5% del volumen general\n";
    report += "   - Línea Bebidas y Complementos        : 11.0% del volumen general\n\n";
    
    report += "=========================================================================\n";
    report += "                  FIN DEL INFORME - ARCHIVO DE CONTROL GENERAL           \n";
    report += "=========================================================================\n";

    // Trigger download
    const element = document.createElement("a");
    const file = new Blob([report], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `informe_estadistico_puerto_habana_${simulatedDate}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setToastMessage("Informe Estadístico (.txt) descargado correctamente.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add new order — guarda en MySQL via API
  const handleCreateOrder = async () => {
    const menu = platosMenuDynamic.length ? platosMenuDynamic : platosMenu;
    const selectedItem = menu[newOrder.platoIndex];
    const mozo = mozosList.find((m) => m.id === newOrder.mozoId);
    if (!mozo || !selectedItem) return;

    const now = new Date();
    const horaStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesa_nombre: newOrder.mesa,
          mozo_id: mozo.id,
          mozo_nombre: mozo.nombre,
          items: [{ nombre: selectedItem.name, cantidad: newOrder.cantidad, precio: selectedItem.price, categoria: selectedItem.category, notas: newOrder.notas }],
          fecha: simulatedDate,
          hora: horaStr,
        }),
      });
      if (res.ok) {
        // Recargar pedidos desde API
        const pedRes = await fetch('/api/pedidos');
        if (pedRes.ok) {
          const data = await pedRes.json();
          const normalized = data.flatMap((c: Comanda) =>
            (c.items || []).map((item: ComandaItem) => ({
              id: `${c.id}-${item.id}`, item: item.nombre, cantidad: item.cantidad,
              mesa: c.mesa, precio: item.precio, estado: c.estado, hora: c.hora,
              notas: item.notas, mozoId: c.mozo_id || '', mozoNombre: c.mozo_nombre || '',
              fecha: c.fecha, category: item.categoria || 'comida', comandaId: String(c.id),
            }))
          );
          setPedidos(normalized);
        }
      }
    } catch {
      addToSyncQueue('POST', '/api/pedidos', {
        mesa_nombre: newOrder.mesa, mozo_id: mozo.id, mozo_nombre: mozo.nombre,
        items: [{ nombre: selectedItem.name, cantidad: newOrder.cantidad, precio: selectedItem.price, categoria: selectedItem.category, notas: newOrder.notas }],
        fecha: simulatedDate, hora: horaStr,
      });
      // Fallback localStorage
      const newPedidoObj: Pedido = {
        id: Date.now(), item: selectedItem.name, cantidad: newOrder.cantidad,
        mesa: newOrder.mesa, precio: selectedItem.price, estado: 'Pendiente',
        hora: horaStr, notas: newOrder.notas, category: selectedItem.category,
        fecha: simulatedDate, mozoId: mozo.id, mozoNombre: mozo.nombre,
      };
      const updatedPedidos = [newPedidoObj, ...pedidos];
      setPedidos(updatedPedidos);
      localStorage.setItem('puerto_habana_pedidos', JSON.stringify(updatedPedidos));
    }

    setShowAddModal(false);
    setNewOrder({ mozoId: mozosList[0]?.id ?? '', mesa: 'Mesa 1', platoIndex: 0, cantidad: 1, notas: '' });
    setToastMessage(`Pedido registrado para ${mozo.nombre} en ${newOrder.mesa}.`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: 'Pendiente' | 'En preparación' | 'Listo'
  ) => {
    // Extraer el ID de comanda del formato "comandaId-itemId"
    const comandaId = orderId.includes('-') ? orderId.split('-')[0] : orderId;
    try {
      await fetch(`/api/pedidos/${comandaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nextStatus }),
      });
    } catch {}
    const updated = pedidos.map((p: Pedido) =>
      String(p.id) === String(orderId) ? { ...p, estado: nextStatus } : p
    );
    setPedidos(updated);
    // Mesa-based grouping — no mozo-level filter needed
  };

  // Date ranges calculations for History
  const getWeekRange = (dateStr: string) => {
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayOfWeek = date.getDay(); // 0 is Sunday
    
    const start = new Date(date);
    start.setDate(date.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return { start, end };
  };

  const getMonthRange = (dateStr: string) => {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  };

  const isDateInRange = (orderDateStr: string) => {
    if (rangoHistorial === 'dia') {
      return orderDateStr === selectedDateForHistory;
    }
    
    const { start, end } = rangoHistorial === 'semana' 
      ? getWeekRange(selectedDateForHistory) 
      : getMonthRange(selectedDateForHistory);
      
    const ordDate = new Date(orderDateStr + 'T00:00:00');
    const startDate = new Date(start);
    startDate.setHours(0,0,0,0);
    const endDate = new Date(end);
    endDate.setHours(23,59,59,999);
    
    return ordDate >= startDate && ordDate <= endDate;
  };

  // Filtered orders for History Tab
  const filteredHistoryOrders = pedidos.filter(p => {
    const inRange = isDateInRange(p.fecha);
    if (!inRange) return false;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        (p.item || '').toLowerCase().includes(query) ||
        (p.mesa || '').toLowerCase().includes(query) ||
        (p.mozoNombre || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate dynamic sales for Tab-specific cards
  const getTabCards = () => {
    if (activeTab === 'reportes') {
      return {};
    }
    if (activeTab === 'activos') {
      const todayOrders = pedidos.filter(p => p.fecha === simulatedDate);
      const comidaVal = todayOrders.filter(p => p.category === 'comida').reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const bebidasVal = todayOrders.filter(p => p.category === 'bebidas').reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

      return {
        comida: { title: 'Comida (Hoy)', value: `S/ ${comidaVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Utensils },
        bebidas: { title: 'Bebidas (Hoy)', value: `S/ ${bebidasVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wine },
        mozos: { title: 'Mozos Registrados', value: String(mozosList.length), icon: Users },
      };
    } else if (activeTab === 'historial') {
      const totalRev = filteredHistoryOrders.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const comidaVal = filteredHistoryOrders.filter(p => p.category === 'comida').reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const bebidasVal = filteredHistoryOrders.filter(p => p.category === 'bebidas').reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const totalYape = filteredHistoryOrders.filter(p => p.metodo_pago === 'Yape').reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const totalEfectivo = filteredHistoryOrders.filter(p => p.metodo_pago === 'Efectivo').reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const margenHist = getMargenHistorial(filteredHistoryOrders);

      return {
        ventasTotal: { title: 'Ventas Totales', value: `S/ ${totalRev.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: DollarSign },
        yape: { title: 'Total Yape', value: `S/ ${totalYape.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: DollarSign },
        efectivo: { title: 'Total Efectivo', value: `S/ ${totalEfectivo.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: DollarSign },
        comidaHist: { title: 'Ventas Comida', value: `S/ ${comidaVal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: Utensils },
        bebidasHist: { title: 'Ventas Bebidas', value: `S/ ${bebidasVal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: Wine },
        costoHist: { title: 'Costo de Ventas', value: `S/ ${margenHist.totalCosto.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: TrendingUp },
        gananciaHist: { title: 'Ganancia Bruta', value: `S/ ${margenHist.ganancia.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: TrendingUp },
        margenHistPct: { title: 'Margen %', value: `${margenHist.margen.toFixed(1)}%`, icon: TrendingUp },
      };
    } else {
      // ventas_mozo
      // Active orders in selected historical range
      const rangeOrders = pedidos.filter(p => isDateInRange(p.fecha));
      const totalRev = rangeOrders.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      
      // Calculate best mozo
      const mozoSales: Record<string, number> = {};
      rangeOrders.forEach(p => {
        mozoSales[p.mozoNombre] = (mozoSales[p.mozoNombre] || 0) + (p.precio * p.cantidad);
      });
      let bestMozoName = 'Ninguno';
      let bestMozoAmt = 0;
      Object.entries(mozoSales).forEach(([name, amt]) => {
        if (amt > bestMozoAmt) {
          bestMozoAmt = amt;
          bestMozoName = name;
        }
      });

      const averageMozoSale = mozosList.length > 0 ? totalRev / mozosList.length : 0;

      return {
        totalVentas: { title: 'Ventas Mozos', value: `S/ ${totalRev.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: DollarSign },
        mejorMozo: { title: 'Mejor Mozo', value: bestMozoName, icon: Award },
        promedioMozo: { title: 'Venta Promedio / Mozo', value: `S/ ${averageMozoSale.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: TrendingUp },
      };
    }
  };

  // Group active orders by mozo (for Active Tab)
  const activeOrdersForSimDate = pedidos.filter(p => p.fecha === simulatedDate);
  const mozosPedidos = mozosList.map(mozo => {
    const mOrders = activeOrdersForSimDate.filter(p => p.mozoId === mozo.id);
    const total = mOrders.reduce((sum, p) => sum + (Number(p.precio) * p.cantidad), 0);
    const mesasOfMozo = Array.from(new Set(mOrders.map(p => p.mesa))).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    const pedidosByMesa = mesasOfMozo.map(m => ({
      mesa: m,
      pedidos: mOrders.filter(p => p.mesa === m)
    }));
    return { mozoId: mozo.id, mozoNombre: mozo.nombre, total, pedidosByMesa };
  });

  // Check for orders not assigned to any current mozo
  const unassignedOrders = activeOrdersForSimDate.filter(p => !mozosList.some(m => m.id === p.mozoId));
  if (unassignedOrders.length > 0) {
    const total = unassignedOrders.reduce((sum, p) => sum + (Number(p.precio) * p.cantidad), 0);
    const mesasOfUnassigned = Array.from(new Set(unassignedOrders.map(p => p.mesa))).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    const pedidosByMesa = mesasOfUnassigned.map(m => ({
      mesa: m,
      pedidos: unassignedOrders.filter(p => p.mesa === m)
    }));
    mozosPedidos.push({ mozoId: 'unassigned', mozoNombre: 'Otros / Sin asignar', total, pedidosByMesa });
  }

  // Waiter statistics calculations (for Waiter Sales Tab)
  const rangeOrdersForWaiter = pedidos.filter(p => isDateInRange(p.fecha));
  const selectedWaiterOrders = rangeOrdersForWaiter.filter(p => p.mozoId === selectedWaiterId);
  const waiterStats = mozosList.map(mozo => {
    const mOrders = rangeOrdersForWaiter.filter(p => p.mozoId === mozo.id);
    const totalVendido = mOrders.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const numPedidos = mOrders.length;
    const ticketProm = numPedidos > 0 ? totalVendido / numPedidos : 0;
    
    // Star Item (Plato estrella)
    const itemsCount: Record<string, number> = {};
    mOrders.forEach(p => {
      itemsCount[p.item] = (itemsCount[p.item] || 0) + p.cantidad;
    });
    let topItem = 'Ninguno';
    let topItemCount = 0;
    Object.entries(itemsCount).forEach(([name, count]) => {
      if (count > topItemCount) {
        topItemCount = count;
        topItem = name;
      }
    });

    return {
      id: mozo.id,
      nombre: mozo.nombre,
      totalVendido,
      numPedidos,
      ticketProm,
      platoEstrella: topItem === 'Ninguno' ? '-' : `${topItem} (${topItemCount})`,
    };
  }).sort((a, b) => b.totalVendido - a.totalVendido);

  // Calendar rendering variables
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDayIndex = firstDay.getDay(); // 0 is Sunday
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    return (
      <div className={`p-3.5 sm:p-5 rounded-2xl border transition-all duration-200 ${
        'bg-white border-gray-200 text-gray-900 shadow-sm'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-sm tracking-wide">
            {calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
              className={`p-2 rounded-lg border transition-colors ${
                'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
              className={`p-2 rounded-lg border transition-colors ${
                'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold mb-3 text-gray-500">
          {weekdays.map(w => <div key={w}>{w}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10 sm:h-14"></div>;
            }
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDateForHistory;
            const isSimDate = dateStr === simulatedDate;
            
            const dayOrders = pedidos.filter(p => p.fecha === dateStr);
            const dayRevenue = dayOrders.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
            
            return (
              <button
                key={`day-${day}`}
                onClick={() => {
                  setSelectedDateForHistory(dateStr);
                }}
                className={`h-10 sm:h-14 rounded-lg sm:rounded-xl flex flex-col justify-between p-1 sm:p-1.5 transition-all relative ${
                  isSelected 
                    ? 'bg-blue-600 text-white font-medium shadow-sm' 
                    : isSimDate
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-300 text-gray-800'
                }`}
              >
                <div className="flex justify-between w-full">
                  <span className="text-[10px] sm:text-xs font-medium">{day}</span>
                  {isSimDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  )}
                </div>
                {dayRevenue > 0 ? (
                  <span className={`text-[8px] sm:text-[10px] w-full text-center truncate block mt-0.5 sm:mt-1 ${
                    isSelected ? 'text-blue-100 font-semibold' : 'text-green-600 font-medium'
                  }`}>
                    <span className="hidden sm:inline">S/</span>{Number(dayRevenue).toFixed(0)}
                  </span>
                ) : (
                  <span className="text-[10px] text-transparent select-none">-</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
    

  };

  const getHistoryPeriodLabel = () => {
    if (rangoHistorial === 'dia') {
      return `Día: ${formatDate(selectedDateForHistory)}`;
    }
    if (rangoHistorial === 'semana') {
      const { start, end } = getWeekRange(selectedDateForHistory);
      return `Semana: ${formatDate(start.toISOString().split('T')[0])} al ${formatDate(end.toISOString().split('T')[0])}`;
    }
    if (rangoHistorial === 'mes') {
      const parts = selectedDateForHistory.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      return `Mes: ${d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
    }
    return '';
  };

  return (
    <div className={`animate-in fade-in duration-300 overflow-x-hidden w-full text-gray-900`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`p-4 rounded-xl border shadow-xl max-w-sm flex items-start gap-3 ${
            'bg-white border-gray-200 text-gray-800 shadow-gray-200/50'
          }`}>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Notificación</p>
              <p className="text-sm mt-1 text-inherit opacity-90 leading-snug">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 gap-4 border-b pb-6 border-gray-150 dark:border-gray-800">
        <div>
          <h1 className={`text-3xl md:text-4xl font-medium tracking-tight text-gray-900`}>
            Puerto Habana
          </h1>
          <p className={`text-sm mt-1.5 flex items-center gap-1.5 text-gray-500`}>
            <Clock size={15} />
            Fecha de operación: <span className="font-semibold text-blue-600">{formatDate(simulatedDate)}</span>
          </p>
        </div>
        
        {/* Time Simulator Panel */}
        <div className={`p-3 rounded-xl border flex flex-col md:flex-row items-center gap-3 shrink-0 ${
          'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="text-center md:text-left">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Control de Fecha/Hora</span>
            <span className="text-xs font-medium block flex items-center gap-1.5 justify-center md:justify-start">
              <Clock size={12} className="text-blue-600" />
              <span className="font-semibold text-blue-600">{currentTime}</span> 
              <span className="text-gray-300">|</span> 
              {formatDate(simulatedDate)}
            </span>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleNextDaySimulate}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm hover:shadow"
            >
              <RefreshCw size={12} className="animate-spin-slow" />
              Avanzar un día
            </button>
            {isManualSim && (
              <button
                onClick={handleResetDate}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                Restablecer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Últimas Notas Section */}
      {ultimasNotas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-violet-600" />
            <h2 className="text-base font-semibold text-gray-900">Últimas Notas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {ultimasNotas.map((nota) => {
              const tagColors: Record<string, string> = {
                gasto: 'bg-red-100 text-red-700 border-red-200',
                cocina: 'bg-orange-100 text-orange-700 border-orange-200',
                bebidas: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                insumos: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                nota: 'bg-violet-100 text-violet-700 border-violet-200',
              };
              const tagLabels: Record<string, string> = {
                gasto: 'Gasto',
                cocina: 'Cocina',
                bebidas: 'Bebidas',
                insumos: 'Insumos',
                nota: 'Nota',
              };
              return (
                <div
                  key={nota.id}
                  className="p-3.5 rounded-xl border bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col gap-2"
                >
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {nota.tags.map((t) => (
                      <span
                        key={t}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tagColors[t] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        <Tag size={10} />
                        {tagLabels[t] || t}
                      </span>
                    ))}
                    {nota.monto && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                        S/ {Number(nota.monto).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {/* Contenido */}
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                    {nota.contenido.replace(/^\[\w+\]\s*/i, '')}
                  </p>
                  {/* Fecha */}
                  <p className="text-[10px] text-gray-400 mt-auto">
                    {new Date(nota.created_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className={`flex border-b mb-8 overflow-x-auto gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 ${
        'border-gray-200'
      }`}>
        <button
          onClick={() => { setActiveTab('activos'); localStorage.setItem('puerto_habana_active_tab', 'activos'); }}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'activos'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Clock size={16} />
          Pedidos Activos
          {activeOrdersForSimDate.length > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              'bg-blue-100 text-blue-800'
            }`}>
              {activeOrdersForSimDate.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('historial'); localStorage.setItem('puerto_habana_active_tab', 'historial'); }}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'historial'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar size={16} />
          Historial de Ventas
        </button>
        <button
          onClick={() => { setActiveTab('ventas_mozo'); localStorage.setItem('puerto_habana_active_tab', 'ventas_mozo'); }}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ventas_mozo'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users size={16} />
          Vendido por Mozo
        </button>
        <button
          onClick={() => { setActiveTab('reportes'); localStorage.setItem('puerto_habana_active_tab', 'reportes'); }}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reportes'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <TrendingUp size={16} />
          Reportes y Ganancias
        </button>
      </div>
      
      {/* Summary Cards Grid */}
      {activeTab !== 'reportes' && (
        <div className={`grid grid-cols-1 ${activeTab === 'historial' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 md:gap-6 mb-10 w-full overflow-hidden`}>
          {Object.entries(getTabCards()).map(([key, data]) => {
            const Icon = data.icon;
            return (
              <DashboardCard
                key={key}
                title={data.title}
                value={data.value}
                icon={Icon}
              />
            );
          })}
        </div>
      )}

      {/* Tab 1: Pedidos Activos */}
      {activeTab === 'activos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className={`text-xl md:text-2xl font-medium text-gray-900`}>
                Pedidos por Mozo
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monitoreo de comandas activas agrupadas por mozo.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow w-full sm:w-auto"
            >
              <Plus size={16} />
              Registrar Pedido
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-4 w-full">
            {mozosPedidos.map((mozo) => (
              <div 
                key={mozo.mozoId} 
                className={`border rounded-xl p-4 md:p-6 transition-all duration-200 flex flex-col justify-between ${
                  'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div>
                  {/* Header: Mozo + total mesas badge */}
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className={`text-base md:text-lg font-bold text-gray-900 flex items-center gap-2`}>
                        <Users size={18} className="text-blue-600" />
                        {mozo.mozoNombre}
                      </h3>
                      <p className={`text-xs text-gray-500 mt-0.5`}>Mesas activas: {mozo.pedidosByMesa.length}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        mozo.pedidosByMesa.length > 0
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-gray-50 text-gray-400 border border-gray-100'
                      }`}>
                        {mozo.pedidosByMesa.reduce((acc, m) => acc + m.pedidos.length, 0)} items
                      </span>
                    </div>
                  </div>
                  
                  {/* Items detallados agrupados por mesa */}
                  {mozo.pedidosByMesa.length > 0 ? (
                    <div className="space-y-4">
                      {mozo.pedidosByMesa.map((mesaGroup, mIdx) => (
                        <div key={mIdx} className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">{mesaGroup.mesa}</h4>
                          <div className="space-y-2">
                            {mesaGroup.pedidos.map((pedido, idx) => (
                              <div key={idx} className={`flex justify-between items-center py-1.5`}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-sm font-medium text-gray-900 truncate`}>{pedido.item}</p>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      pedido.estado === 'Listo' ? 'bg-green-500' : pedido.estado === 'En preparación' ? 'bg-yellow-500' : 'bg-gray-400'
                                    }`}></span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className={`text-[10px] text-gray-500`}>{pedido.hora}</p>
                                    {pedido.notas && (
                                      <span className="text-[10px] text-gray-400 italic truncate max-w-[100px]" title={pedido.notas}>
                                        📝 {pedido.notas}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                    'text-gray-800 bg-gray-200'
                                  }`}>x{pedido.cantidad}</span>
                                  <p className="text-[10px] font-semibold text-green-600 mt-0.5">
                                    S/ {(Number(pedido.precio) * pedido.cantidad).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Mesa Action */}
                          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end">
                            <button
                              onClick={() => {
                                setShowClienteSearchForMesa({
                                  mesa: mesaGroup.mesa,
                                  mozoNombre: mozo.mozoNombre,
                                  items: mesaGroup.pedidos,
                                  hora: mesaGroup.pedidos[0]?.hora || '',
                                });
                                setClienteInfoForMesa(null);
                                setClienteSearchQuery('');
                                setClientesSearchResults([]);
                              }}
                              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors text-xs font-semibold"
                            >
                              <Printer size={12} />
                              Imprimir Mesa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                      <p className={`text-sm text-gray-400`}>Sin pedidos activos</p>
                    </div>
                  )}
                </div>
                
                {/* Footer: Total */}
                <div className={`mt-4 pt-3 border-t flex flex-col gap-3 ${
                  'border-gray-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total Acumulado (Activos):</span>
                    <span className="font-bold text-sm text-gray-900 ml-2">
                      S/ {mozo.total.toFixed(2)}
                    </span>
                  </div>
                  {mozo.mozoId !== 'unassigned' && (
                    <button
                      onClick={() => setMozoHistoryModal({ id: mozo.mozoId, nombre: mozo.mozoNombre })}
                      className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors flex justify-center items-center gap-1.5"
                    >
                      <ClipboardList size={14} />
                      Ver Historial y SUNAT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Historial de Ventas */}
      {activeTab === 'historial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full overflow-hidden">
          {/* Calendar Picker Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h3 className={`text-lg font-medium mb-3 text-gray-900`}>Navegar Fechas</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Selecciona un día en el calendario para auditar su historial o cambiar la agrupación temporal.</p>
            </div>
            
            {/* Visual Calendar */}
            <div className="overflow-x-auto -mx-4 px-4 sm:-mx-2 sm:px-2 md:mx-0 md:px-0">
              <div className="inline-block min-w-full">
                {renderCalendar()}
              </div>
            </div>
            
            {/* Interval buttons */}
            <div className={`p-1.5 rounded-xl border flex gap-1 ${
              'bg-white border-gray-200'
            }`}>
              <button
                onClick={() => setRangoHistorial('dia')}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors ${
                  rangoHistorial === 'dia'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setRangoHistorial('semana')}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors ${
                  rangoHistorial === 'semana'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setRangoHistorial('mes')}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors ${
                  rangoHistorial === 'mes'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Mes
              </button>
            </div>
          </div>

          {/* List of Orders Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className={`text-lg font-medium text-gray-900`}>
                  {getHistoryPeriodLabel()}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Auditoría detallada de comandas en el período seleccionado.</p>
              </div>
              
              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mesa, mozo o plato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${
                    'border-gray-200 focus:border-black bg-white'
                  }`}
                />
              </div>
            </div>

            {/* List/Table */}
            {filteredHistoryOrders.length > 0 ? (
              <>
                {/* Desktop View Table */}
                <div className={`hidden md:block border rounded-xl overflow-hidden w-full ${
                  'border-gray-200 bg-white shadow-sm'
                }`}>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm">
                      <thead className={`border-b bg-gray-50 border-gray-200`}>
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-xs text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-gray-500 uppercase tracking-wider">Mozo</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-gray-500 uppercase tracking-wider">Mesa</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-gray-500 uppercase tracking-wider">Plato / Bebida</th>
                          <th className="px-4 py-3 text-center font-medium text-xs text-gray-500 uppercase tracking-wider">Cant.</th>
                          <th className="px-4 py-3 text-right font-medium text-xs text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y divide-gray-100`}>
                        {filteredHistoryOrders.map((pedido) => (
                          <tr key={pedido.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                              <span className="font-semibold block">{formatDate(pedido.fecha)}</span>
                              <span className="text-gray-400 block mt-0.5">{pedido.hora} hrs</span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-medium text-xs">{pedido.mozoNombre}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-semibold">{pedido.mesa}</td>
                            <td className="px-4 py-3.5 text-xs font-medium">
                              <span>{pedido.item}</span>
                              {pedido.notas && (
                                <span className="block text-[10px] text-gray-400 font-normal italic mt-0.5">Notas: {pedido.notas}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center text-xs font-semibold">{pedido.cantidad}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-xs whitespace-nowrap text-green-600 dark:text-green-500">
                              S/ {(Number(pedido.precio) * Number(pedido.cantidad)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden space-y-3">
                  {filteredHistoryOrders.map((pedido) => (
                    <div 
                      key={pedido.id} 
                      className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
                        'bg-white border-gray-200 text-gray-800 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 block">{formatDate(pedido.fecha)} • {pedido.hora} hrs</span>
                          <span className="text-sm font-semibold mt-0.5 block">{pedido.item}</span>
                          {pedido.notas && (
                            <span className="text-[11px] text-gray-400 font-normal italic mt-1 block">Nota: {pedido.notas}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-500">
                          S/ {(Number(pedido.precio) * Number(pedido.cantidad)).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className={`pt-2 border-t flex justify-between items-center text-xs ${
                        'border-gray-100 text-gray-500'
                      }`}>
                        <span>Mozo: <strong className="font-medium text-gray-700 dark:text-gray-300">{pedido.mozoNombre}</strong></span>
                        <span>Mesa: <strong className="font-semibold text-gray-700 dark:text-gray-300">{pedido.mesa}</strong></span>
                        <span>Cant: <strong className="font-bold text-gray-700 dark:text-gray-350">{pedido.cantidad}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={`border rounded-xl py-16 text-center ${
                'border-gray-200 bg-white'
              }`}>
                <ClipboardList size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-semibold text-gray-400">Sin datos de venta</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">No se registraron transacciones que coincidan con la búsqueda en el rango de fechas actual.</p>
                  </div>
                )}
              </div>

            </div>
      )}

      {/* Tab 3: Vendido por Mozo */}
      {activeTab === 'ventas_mozo' && (
        <div className="space-y-8">
          <div>
            <h2 className={`text-xl md:text-2xl font-medium text-gray-900`}>
              Rendimiento y Ventas por Mozo
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Análisis comparativo basado en el periodo: <span className="font-semibold text-blue-600">{getHistoryPeriodLabel()}</span></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full overflow-hidden">
            
            {/* Visual Charts / Performance rankings */}
            <div className={`lg:col-span-2 p-6 rounded-xl border ${
              'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-700 mb-6">Gráfico de Ventas Generadas (S/.)</h3>
              
              <div className="space-y-6">
                {waiterStats.map((stat, idx) => {
                  const maxSales = Math.max(...waiterStats.map(s => s.totalVendido), 1);
                  const percentage = (stat.totalVendido / maxSales) * 100;
                  
                  return (
                    <div key={stat.id} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-gray-900 text-sm">{stat.nombre}</span>
                          {idx === 0 && stat.totalVendido > 0 && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
                              <Award size={10} strokeWidth={2.5} />
                              Mejor Ventas
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-green-600 text-sm">S/ {stat.totalVendido.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      {/* Bar Container */}
                      <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            idx === 0 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                              : idx === 1 
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-600' 
                              : 'bg-gradient-to-r from-slate-400 to-slate-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>Comandas: <strong className="text-gray-900">{stat.numPedidos}</strong></span>
                        <span>Ticket Prom.: <strong className="text-gray-900">S/ {Number(stat.ticketProm).toFixed(1)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metrics cards & Top products */}
            <div className="space-y-6 lg:col-span-1">
              <div className={`p-6 rounded-xl border ${
                'bg-white border-gray-200 shadow-sm'
              }`}>
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400 mb-4">Métricas del Período</h3>
                <div className={`divide-y divide-gray-150`}>
                  {waiterStats.map(stat => (
                    <div key={stat.id} className="py-3.5 flex justify-between items-start last:pb-0">
                      <div>
                        <span className="text-xs font-semibold block text-gray-900 dark:text-white">{stat.nombre}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">Mesa más vendida: Barra 1</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold block text-gray-900 dark:text-white">Plato Estrella</span>
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 block truncate max-w-[140px] mt-0.5">{stat.platoEstrella}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Detailed Waiter Orders Section */}
          <div className={`p-4 sm:p-6 rounded-xl border ${
            'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className={`text-base sm:text-lg font-semibold text-gray-900`}>
                  Detalle de Comandas por Mozo
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lista pormenorizada de todos los pedidos atendidos en el rango seleccionado</p>
              </div>
              
              {/* Waiter Selection Tabs/Buttons */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {mozosList.map((mozo) => {
                  const isSelected = selectedWaiterId === mozo.id;
                  return (
                    <button
                      key={mozo.id}
                      onClick={() => setSelectedWaiterId(mozo.id)}
                      className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 text-center ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {mozo.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of orders for the selected waiter */}
            {selectedWaiterOrders.length > 0 ? (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b border-gray-150 text-gray-500 uppercase tracking-wider font-semibold text-[10px]`}>
                        <th className="pb-3 pt-1 pl-1">Fecha/Hora</th>
                        <th className="pb-3 pt-1">Mesa</th>
                        <th className="pb-3 pt-1">Producto</th>
                        <th className="pb-3 pt-1 text-center">Cant.</th>
                        <th className="pb-3 pt-1 text-right">Precio Unit.</th>
                        <th className="pb-3 pt-1 text-right">Total</th>
                        <th className="pb-3 pt-1 pl-4">Notas</th>
                        <th className="pb-3 pt-1 pr-1 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-gray-100/80`}>
                      {selectedWaiterOrders.map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                          <td className="py-3 pl-1 text-gray-500 dark:text-gray-400 font-medium">
                            {formatDate(pedido.fecha)} - {pedido.hora}
                          </td>
                          <td className="py-3 font-semibold text-gray-700 dark:text-gray-300">
                            {pedido.mesa}
                          </td>
                          <td className="py-3 font-medium text-gray-900 dark:text-white">
                            {pedido.item}
                          </td>
                          <td className="py-3 text-center font-bold text-gray-900 dark:text-white">
                            {pedido.cantidad}
                          </td>
                          <td className="py-3 text-right text-gray-500 dark:text-gray-400">
                            S/ {Number(pedido.precio).toFixed(2)}
                          </td>
                          <td className="py-3 text-right font-bold text-green-600 dark:text-green-500">
                            S/ {(Number(pedido.precio) * Number(pedido.cantidad)).toFixed(2)}
                          </td>
                          <td className="py-3 pl-4 text-gray-500 dark:text-gray-400 italic max-w-[200px] truncate" title={pedido.notas}>
                            {pedido.notas || '-'}
                          </td>
                          <td className="py-3 pr-1 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              pedido.estado === 'Listo'
                                ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30'
                                : pedido.estado === 'En preparación'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700/30'
                            }`}>
                              {pedido.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={`border-t font-semibold border-gray-200 text-gray-900`}>
                        <td colSpan={3} className="py-4 pl-1 text-[10px] uppercase tracking-wider">Total Acumulado</td>
                        <td className="py-4 text-center font-bold">{selectedWaiterOrders.reduce((sum, p) => sum + p.cantidad, 0)}</td>
                        <td></td>
                        <td className="py-4 text-right font-bold text-green-600 dark:text-green-500 text-sm">
                          S/ {selectedWaiterOrders.reduce((sum, p) => sum + (p.precio * p.cantidad), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden space-y-3">
                  {selectedWaiterOrders.map((pedido) => (
                    <div 
                      key={pedido.id} 
                      className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
                        'bg-gray-50 border-gray-150 text-gray-800 shadow-xs'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 block">{formatDate(pedido.fecha)} • {pedido.hora}</span>
                          <span className="text-sm font-semibold mt-0.5 block">{pedido.item}</span>
                          {pedido.notas && (
                            <span className="text-[11px] text-gray-400 font-normal italic mt-1 block">Nota: {pedido.notas}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-500">
                          S/ {(Number(pedido.precio) * Number(pedido.cantidad)).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className={`pt-2 border-t flex justify-between items-center text-xs ${
                        'border-gray-150 text-gray-500'
                      }`}>
                        <span>Mesa: <strong className="font-semibold text-gray-850 dark:text-gray-250">{pedido.mesa}</strong></span>
                        <span>Cant: <strong className="font-bold text-gray-850 dark:text-gray-255">{pedido.cantidad}</strong></span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          pedido.estado === 'Listo'
                            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400'
                            : pedido.estado === 'En preparación'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-750 border border-gray-200 dark:bg-gray-850 dark:text-gray-300'
                        }`}>
                          {pedido.estado}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Mobile Total */}
                  <div className={`p-4 rounded-xl border flex justify-between items-center text-xs font-semibold ${
                    'bg-gray-100 border-gray-150 text-gray-900'
                  }`}>
                    <span>Total Ventas Acumulado:</span>
                    <span className="text-base font-bold text-green-600 dark:text-green-500">
                      S/ {selectedWaiterOrders.reduce((sum, p) => sum + (p.precio * p.cantidad), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className={`text-center py-10 rounded-xl border border-dashed ${
                'border-gray-200'
              }`}>
                <ClipboardList size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-xs font-semibold text-gray-400">Sin comandas registradas</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Este mozo no ha atendido pedidos en el rango de fechas seleccionado.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 4: Reportes y Ganancias */}
      {activeTab === 'reportes' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className={`text-xl md:text-2xl font-medium text-gray-900`}>
              Reportes y Estado de Resultados
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Análisis financiero y pronósticos en tiempo real basados en el historial.</p>
          </div>

          {/* financial cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full overflow-hidden">
            <div className={`p-5 rounded-xl border bg-white border-gray-150 shadow-sm`}>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Ventas Brutas</span>
              <p className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-500">S/ {Number(totalVentas).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Basado en comandas registradas</p>
            </div>
            
            <div className={`p-5 rounded-xl border bg-white border-gray-150 shadow-sm`}>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Pérdida de Insumos</span>
              <p className="text-2xl font-bold mt-2 text-red-600 dark:text-red-500">S/ {Number(totalInsumosLoss).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Descartes/vencidos ya pagados</p>
            </div>

            <div className={`p-5 rounded-xl border bg-white border-gray-150 shadow-sm`}>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Pagos al Personal</span>
              <p className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-500">S/ {Number(totalStaffPayments).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Nóminas y comisiones de mozos</p>
            </div>

            <div className={`p-5 rounded-xl border bg-blue-50/50 border-blue-100 shadow-sm`}>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Ganancia Neta</span>
              <p className="text-2xl font-bold mt-2 text-green-600 dark:text-green-500">S/ {Number(netProfit).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Nueva ganancia tras deducciones</p>
            </div>
          </div>

          {/* Export tools */}
          <div className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${
            'bg-white border-gray-150 shadow-sm'
          }`}>
            <div>
              <h3 className="text-sm font-semibold">Exportar Documentos Administrativos</h3>
              <p className="text-xs text-gray-400 mt-0.5">Descarga copias de auditoría en formato Excel y reportes estadísticos.</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={exportToExcel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                <Download size={14} />
                Descargar Excel (.csv)
              </button>
              <button 
                onClick={exportStatisticalReport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                <Download size={14} />
                Informe Estadístico (.txt)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full overflow-hidden">
            
            {/* Deductions table & forms */}
            <div className="space-y-6">
              
              {/* Insumos wastes management */}
              <div className={`p-6 rounded-xl border bg-white border-gray-150 shadow-sm`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex justify-between items-center">
                  <span>Registro de Pérdida de Insumos</span>
                  <span className="text-xs text-red-500 font-normal">Resta de Ganancia</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <input 
                    type="text" 
                    placeholder="Descripción (ej. Tomates)"
                    value={wasteForm.descripcion}
                    onChange={e => setWasteForm({ ...wasteForm, descripcion: e.target.value })}
                    className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
                    }`}
                  />
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="Costo total (S/)"
                    value={wasteForm.costo}
                    onChange={e => setWasteForm({ ...wasteForm, costo: e.target.value })}
                    className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
                    }`}
                  />
                  <button 
                    onClick={handleAddWaste}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={12} />
                    Agregar
                  </button>
                </div>

                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {insumosWasted.map(w => (
                    <div key={w.id} className={`flex justify-between items-center p-3 rounded-lg border text-xs ${
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div>
                        <p className="font-semibold">{w.descripcion}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{w.fecha}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-500">S/ {Number(w.costo).toFixed(2)}</span>
                        <button onClick={() => handleDeleteWaste(String(w.id))} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {insumosWasted.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-4">No se han registrado mermas o pérdidas hoy.</p>
                  )}
                </div>
              </div>

              {/* Staff payments management */}
              <div className={`p-6 rounded-xl border bg-white border-gray-150 shadow-sm`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex justify-between items-center">
                  <span>Registro de Pagos al Personal</span>
                  <span className="text-xs text-amber-500 font-normal">Resta de Ganancia</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                  <select 
                    value={paymentForm.mozoNombre}
                    onChange={e => {
                      const nombre = e.target.value;
                      const staff = allStaffList.find(s => s.nombre === nombre);
                      setPaymentForm({ 
                        ...paymentForm, 
                        mozoNombre: nombre,
                        monto: staff?.rol === 'dev' ? '' : (staff?.salario_monto ? String(staff.salario_monto) : ''),
                        concepto: staff?.rol === 'dev' ? 'Pago contratista' : (staff?.salario_tipo ? `Pago ${staff.salario_tipo}` : 'Jornal')
                      });
                    }}
                    className={`px-2 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
                    }`}
                  >
                    {allStaffList.map(m => (
                      <option key={m.id} value={m.nombre}>{m.nombre}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Concepto (ej. Jornal)"
                    value={paymentForm.concepto}
                    onChange={e => setPaymentForm({ ...paymentForm, concepto: e.target.value })}
                    className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
                    }`}
                  />
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="Monto (S/)"
                    value={paymentForm.monto}
                    onChange={e => setPaymentForm({ ...paymentForm, monto: e.target.value })}
                    className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
                    }`}
                  />
                  <button 
                    onClick={handleAddPayment}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={12} />
                    Pagar
                  </button>
                </div>

                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {staffPayments.map(p => (
                    <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg border text-xs ${
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div>
                        <p className="font-semibold">{p.mozoNombre} <span className="font-normal text-gray-400">({p.concepto})</span></p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{p.fecha}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-500">S/ {Number(p.monto).toFixed(2)}</span>
                        <button onClick={() => handleDeletePayment(String(p.id))} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {staffPayments.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-4">No se han registrado pagos hoy.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Visual breakdown & forecasting */}
            <div className="space-y-6">
              
              {/* Platos más vendidos chart */}
              <div className={`p-6 rounded-xl border bg-white border-gray-150 shadow-sm`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Platos más Vendidos (Cantidad)</h3>
                <div className="space-y-4">
                  {getTopDishesData().slice(0, 5).map((d, idx) => {
                    const maxQty = Math.max(...getTopDishesData().map(x => x.qty), 1);
                    const percent = (d.qty / maxQty) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{d.name}</span>
                          <span className="text-gray-400">{d.qty} u. (S/ {Number(d.revenue).toFixed(2)})</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden bg-gray-100`}>
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {getTopDishesData().length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-4">No se han registrado comandas vendidas para procesar.</p>
                  )}
                </div>
              </div>

              {/* Margen de Ganancia Real */}
              <div className={`p-6 rounded-xl border bg-white border-gray-150 shadow-sm`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-500" />
                  Margen de Ganancia por Categoría
                </h3>

                {(() => {
                  const margenData = getMargenData();
                  const margenPorCategoria = getMargenPorCategoria();
                  return margenPorCategoria.length > 0 ? (
                  <div className="space-y-5">
                    {margenPorCategoria.map((cat, idx) => {
                      const maxVentas = Math.max(...margenPorCategoria.map(c => c.ventas), 1);
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-700">{cat.nombre}</span>
                            <span className={`text-xs font-bold ${cat.margen >= 40 ? 'text-green-600' : cat.margen >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                              {cat.margen.toFixed(1)}% margen
                            </span>
                          </div>
                          {/* Barra de ingresos vs costos */}
                          <div className="flex gap-1 h-4 w-full">
                            <div 
                              className="bg-emerald-500 rounded-l-full transition-all duration-700"
                              style={{ width: `${(cat.ventas / maxVentas) * 100}%` }}
                              title={`Ventas: S/ ${cat.ventas.toFixed(2)}`}
                            ></div>
                            <div 
                              className="bg-red-400 rounded-r-full transition-all duration-700"
                              style={{ width: `${(cat.costo / maxVentas) * 100}%` }}
                              title={`Costo: S/ ${cat.costo.toFixed(2)}`}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Ventas: S/ {cat.ventas.toFixed(2)}</span>
                            <span>Costo: S/ {cat.costo.toFixed(2)}</span>
                            <span className="font-semibold text-emerald-600">+ S/ {cat.ganancia.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Total general */}
                    <div className={`pt-4 mt-2 border-t border-gray-200`}>
                      {(() => {
                        const totalVentas = margenPorCategoria.reduce((s, c) => s + c.ventas, 0);
                        const totalCosto = margenPorCategoria.reduce((s, c) => s + c.costo, 0);
                        const totalGanancia = totalVentas - totalCosto;
                        const totalMargen = totalVentas > 0 ? (totalGanancia / totalVentas * 100) : 0;
                        return (
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-semibold text-gray-900">Margen Total</span>
                              <p className="text-[10px] text-gray-500">S/ {totalGanancia.toFixed(2)} ganancia {totalCosto === 0 && <span className="text-amber-500 font-semibold">*</span>}</p>
                            </div>
                            <span className={`text-lg font-bold ${totalMargen >= 40 ? 'text-green-600' : totalMargen >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                              {totalMargen.toFixed(1)}%{totalCosto === 0 ? <span className="text-[10px] text-amber-500 font-normal ml-1">*</span> : ''}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    {margenData.length > 0 && margenData.some(p => p.costo === 0) && (
                      <p className="text-[9px] text-amber-500 italic mt-2">* Margen estimado — algunos productos no tienen costo registrado en inventario.</p>
                    )}
                  </div>
                ) : (
                  <div className={`p-8 text-center rounded-lg border border-dashed bg-gray-50 border-gray-200 text-gray-400`}>
                    <DollarSign size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-semibold uppercase tracking-widest text-[10px]">Sin datos de costo</p>
                    <p className="mt-1 text-xs font-normal">Registra el costo de los productos en el inventario para ver el margen de ganancia real.</p>
                  </div>
                );})()}
              </div>

              {/* Margen por Producto - Top 5 */}
              <div className={`p-6 rounded-xl border bg-white border-gray-150 shadow-sm`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                  <Award size={14} className="text-amber-500" />
                  Top 5 Productos por Ganancia
                </h3>

                {(() => { const md = getMargenData(); return md.slice(0, 5).length > 0 ? (
                  <div className="space-y-3">
                    {md.slice(0, 5).map((p, idx) => {
                      const maxGanancia = Math.max(...md.map(x => x.ganancia), 1);
                      const percent = (p.ganancia / maxGanancia) * 100;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                              }`}>{idx + 1}</span>
                              <span className="text-xs font-medium truncate">{p.name}</span>
                            </div>
                            <span className={`text-[10px] font-bold shrink-0 ml-2 ${p.margen >= 40 ? 'text-green-600' : p.margen >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                              {p.margen.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${
                                idx === 0 
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                                  : idx === 1 
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                                  : 'bg-gradient-to-r from-slate-400 to-slate-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>S/ {p.costo.toFixed(2)} costo</span>
                            <span>S/ {p.ventas.toFixed(2)} venta</span>
                            <span className="text-emerald-600 font-semibold">+ S/ {p.ganancia.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`p-8 text-center rounded-lg border border-dashed bg-gray-50 border-gray-200 text-gray-400`}>
                    <Award size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-semibold uppercase tracking-widest text-[10px]">Sin datos</p>
                    <p className="mt-1 text-xs font-normal">Registra pedidos y asigna costos en el inventario para ver este análisis.</p>
                  </div>
                );})()}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Modal: Búsqueda de Cliente antes de imprimir Boleta */}
      {showClienteSearchForMesa && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden border bg-white border-gray-200 text-gray-800">
            <div className="p-6 border-b border-gray-150 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Seleccionar Cliente</h2>
                <p className="text-xs text-gray-500 mt-1">Busca el cliente para {showClienteSearchForMesa.mesa}</p>
              </div>
              <button
                onClick={() => setShowClienteSearchForMesa(null)}
                className="text-xs p-1 rounded-md hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, DNI o RUC..."
                  value={clienteSearchQuery}
                  onChange={(e) => setClienteSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black bg-white border-gray-200 text-gray-800 focus:border-black"
                  autoFocus
                />
              </div>

              {/* Resultados */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {loadingClientes && (
                  <div className="text-center py-4">
                    <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-400 mt-2">Buscando...</p>
                  </div>
                )}
                {!loadingClientes && clientesSearchResults.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        setClienteInfoForMesa({ nombre: "", documento: "" });
                        setSelectedMesaBoleta(showClienteSearchForMesa);
                        setShowClienteSearchForMesa(null);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-gray-500 flex items-center gap-2"
                    >
                      <span className="font-medium">Sin cliente (Consumo directo)</span>
                    </button>
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Clientes encontrados</p>
                    </div>
                    {clientesSearchResults.map((cli) => (
                      <button
                        key={cli.id}
                        onClick={() => {
                          setClienteInfoForMesa({ 
                            nombre: cli.nombre, 
                            documento: cli.ruc || cli.dni 
                          });
                          setSelectedMesaBoleta(showClienteSearchForMesa);
                          setShowClienteSearchForMesa(null);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <p className="font-medium text-sm text-gray-900">{cli.nombre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {cli.ruc ? "RUC: " + cli.ruc : cli.dni ? "DNI: " + cli.dni : "Sin documento"}
                        </p>
                      </button>
                    ))}
                  </>
                )}
                {!loadingClientes && clienteSearchQuery.length >= 2 && clientesSearchResults.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">No se encontraron clientes</p>
                    <p className="text-xs text-gray-400 mt-1">Puedes continuar sin seleccionar cliente</p>
                    <button
                      onClick={() => {
                        setClienteInfoForMesa({ nombre: "", documento: "" });
                        setSelectedMesaBoleta(showClienteSearchForMesa);
                        setShowClienteSearchForMesa(null);
                      }}
                      className="mt-3 px-4 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Continuar sin cliente
                    </button>
                  </div>
                )}
                {clienteSearchQuery.length < 2 && (
                  <div className="text-center py-8">
                    <Search size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Escribe al menos 2 caracteres</p>
                    <p className="text-xs text-gray-400 mt-1">También puedes continuar sin seleccionar cliente</p>
                    <button
                      onClick={() => {
                        setClienteInfoForMesa({ nombre: "", documento: "" });
                        setSelectedMesaBoleta(showClienteSearchForMesa);
                        setShowClienteSearchForMesa(null);
                      }}
                      className="mt-3 px-4 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Continuar sin cliente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Boleta de consumo por Mesa */}
      {selectedMesaBoleta && (
        <Boleta
          mesa={selectedMesaBoleta.mesa}
          mozoNombre={selectedMesaBoleta.mozoNombre}
          fecha={simulatedDate}
          hora={selectedMesaBoleta.hora}
          items={selectedMesaBoleta.items.map(p => ({
            item: p.item,
            cantidad: p.cantidad,
            precio: p.precio,
            notas: p.notas,
          }))}
          clienteNombre={clienteInfoForMesa?.nombre || undefined}
          clienteDocumento={clienteInfoForMesa?.documento || undefined}
          onClose={() => {
            setSelectedMesaBoleta(null);
            setClienteInfoForMesa(null);
          }}
        />
      )}

      {/* Modal: Create new Order */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border ${
            'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className={`p-6 border-b flex justify-between items-center border-gray-150`}>
              <h2 className="text-lg font-semibold tracking-tight">Registrar Nueva Comanda</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className={`text-xs p-1 rounded-md hover:bg-gray-100`}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              
              {/* Waiter Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mozo Asignado</label>
                <select
                  value={newOrder.mozoId}
                  onChange={(e) => setNewOrder({ ...newOrder, mozoId: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${
                    'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  {mozosList.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Table Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mesa</label>
                  <select
                    value={newOrder.mesa}
                    onChange={(e) => setNewOrder({ ...newOrder, mesa: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${
                      'bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <option key={`mesa-${n}`} value={`Mesa ${n}`}>Mesa {n}</option>
                    ))}
                    <option value="Barra 1">Barra 1</option>
                    <option value="Barra 2">Barra 2</option>
                  </select>
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cantidad</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newOrder.cantidad}
                    onChange={(e) => setNewOrder({ ...newOrder, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${
                      'bg-white border-gray-200 text-gray-800'
                    }`}
                  />
                </div>
              </div>

              {/* Dish/Drink Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Seleccionar Producto</label>
                <select
                  value={newOrder.platoIndex}
                  onChange={(e) => setNewOrder({ ...newOrder, platoIndex: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${
                    'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  {platosMenu.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.name} - S/ {Number(p.price).toFixed(2)} ({p.category === 'comida' ? 'Plato' : 'Bebida'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notas / Indicaciones</label>
                <textarea
                  placeholder="Ej. Sin picante, limón aparte, helada..."
                  value={newOrder.notas}
                  onChange={(e) => setNewOrder({ ...newOrder, notas: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${
                    'bg-white border-gray-200 text-gray-800'
                  }`}
                />
              </div>

              {/* Total Calculation */}
              <div className={`p-4 rounded-xl flex justify-between items-center ${
                'bg-gray-50'
              }`}>
                <span className="text-xs font-semibold text-gray-500">Monto total estimado:</span>
                <span className="text-base font-bold text-green-600 dark:text-green-500">
                  S/ {((platosMenuDynamic.length ? platosMenuDynamic : platosMenu)[newOrder.platoIndex].price * newOrder.cantidad).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateOrder}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors text-sm font-semibold shadow-sm hover:shadow"
                >
                  Crear Comanda
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-3 rounded-xl transition-colors text-sm font-semibold border ${
                    'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mozo History & SUNAT */}
      {mozoHistoryModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Historial: {mozoHistoryModal.nombre}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Comandas del día {formatDate(simulatedDate)}</p>
              </div>
              <button onClick={() => setMozoHistoryModal(null)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const mozoOrders = pedidos.filter(p => p.mozoId === mozoHistoryModal.id && p.fecha === simulatedDate);
                if (mozoOrders.length === 0) return <p className="text-center text-gray-400 py-8 text-sm">No hay comandas registradas hoy.</p>;

                // Group by mesa and status (Entregado vs Activo) to merge multiple comandas for the same table
                const comandasMap = new Map<string, Pedido[]>();
                mozoOrders.forEach(p => {
                  const statusGroup = p.estado === 'Entregado' ? 'Entregado' : 'Activo';
                  const key = `${p.mesa}-${statusGroup}`;
                  if (!comandasMap.has(key)) comandasMap.set(key, []);
                  comandasMap.get(key)!.push(p);
                });

                return Array.from(comandasMap.entries()).map(([key, items]) => {
                  const mesa = items[0].mesa;
                  const hora = items[0].hora;
                  const estado = items[0].estado;
                  const comandaId = items[0].comandaId;
                  const cTotal = items.reduce((sum, i) => sum + (Number(i.precio) * i.cantidad), 0);

                  return (
                    <div key={key} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-gray-900 text-sm">{mesa}</span>
                          <span className="text-xs text-gray-500 ml-2">🕒 {hora}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                            estado === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {estado}
                          </span>
                          <span className="font-bold text-green-600 text-sm">S/ {cTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <ul className="space-y-1 mb-4">
                          {items.map((i, idx) => (
                            <li key={idx} className="flex justify-between text-xs text-gray-700 border-b border-gray-50 pb-1 last:border-0">
                              <span>{i.cantidad}x {i.item}</span>
                              <span className="font-medium">S/ {(Number(i.precio) * i.cantidad).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        {/* Reusing CobrarBoleta to provide SUNAT / WhatsApp features to Admin */}
                        <div className="pt-3 border-t border-gray-100">
                          <CobrarBoleta
                            mesaLabel={mesa}
                            mozoNombre={mozoHistoryModal.nombre}
                            fecha={simulatedDate}
                            hora={hora}
                            comandaId={comandaId ? Number(comandaId) : undefined}
                            pedidos={items.map(i => ({
                              item: i.item,
                              cantidad: i.cantidad,
                              precio: Number(i.precio),
                              notas: i.notas
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
