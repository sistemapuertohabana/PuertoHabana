'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import Modal from '@/components/Modal';
import Boleta from '@/components/Boleta';

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
  AlertTriangle,
  Calendar,
  Clock,
  Plus,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCw,
  Sparkles,
  ClipboardList,
  ChevronDown,
  Download,
  Trash2
} from 'lucide-react';

type ColorMode = 'claro' | 'oscuro';
type TabType = 'activos' | 'historial' | 'ventas_mozo' | 'reportes';
type RangoHistorial = 'dia' | 'semana' | 'mes';

interface Pedido {
  id: number;
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
  const colorMode = 'claro' as any;
  const setColorMode = (mode: ColorMode) => {};
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('activos');
  const [mozosList, setMozosList] = useState<{ id: string; nombre: string }[]>([]);
  const [platosMenuDynamic, setPlatosMenuDynamic] = useState(platosMenu);
  
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedMozo, setSelectedMozo] = useState<{ id: string; nombre: string; pedidos: Pedido[] } | null>(null);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [showBoleta, setShowBoleta] = useState(false);
  
  // Date Simulation
  const [simulatedDate, setSimulatedDate] = useState('2026-05-19');
  const [isManualSim, setIsManualSim] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Reports State
  const [insumosWasted, setInsumosWasted] = useState([
    { id: 1, descripcion: 'Cervezas rotas en almacén', costo: 48.00, fecha: '2026-05-18' },
    { id: 2, descripcion: 'Pescado fresco descartado', costo: 150.00, fecha: '2026-05-15' },
    { id: 3, descripcion: 'Limones malogrados', costo: 30.00, fecha: '2026-05-12' },
  ]);
  
  const [staffPayments, setStaffPayments] = useState([
    { id: 1, mozoNombre: 'Juan Pérez', monto: 180.00, concepto: 'Pago Jornal Semanal', fecha: '2026-05-18' },
    { id: 2, mozoNombre: 'Carlos López', monto: 200.00, concepto: 'Pago Comisión Ventas', fecha: '2026-05-17' },
    { id: 3, mozoNombre: 'Sofía Castro', monto: 250.00, concepto: 'Pago Quincena', fecha: '2026-05-15' },
  ]);

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

  useEffect(() => {
    setMounted(true);
    const savedColorMode = localStorage.getItem('colorMode') as ColorMode;
    if (savedColorMode) setColorMode(savedColorMode);

    // Load active tab from localStorage (UI preference only)
    const savedActiveTab = localStorage.getItem('puerto_habana_active_tab') as TabType;
    if (savedActiveTab && ['activos', 'historial', 'ventas_mozo', 'reportes'].includes(savedActiveTab)) {
      setActiveTab(savedActiveTab);
    }

    // Fecha simulada (UI preference only)
    const savedSimDate = localStorage.getItem('puerto_habana_simulated_date');
    const manualSimFlag = localStorage.getItem('puerto_habana_is_manual_sim') === 'true';
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

    // ── Cargar datos desde MySQL API ──────────────────────────────────────
    const loadAll = async () => {
      // Personal (mozos)
      try {
        const res = await fetch('/api/personal');
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('ph_personal', JSON.stringify(data)); // sync para logins
          const mozos = data.filter((x: any) => x.rol === 'mozo').map((x: any) => ({ id: x.id, nombre: x.nombre }));
          if (mozos.length) {
            setMozosList(mozos);
            setSelectedWaiterId((prev: string) => prev || mozos[0].id);
            setNewOrder((n: any) => ({ ...n, mozoId: n.mozoId || mozos[0].id }));
            setPaymentForm((f: any) => ({ ...f, mozoNombre: mozos[0].nombre }));
          }
        }
      } catch {
        // Fallback localStorage
        try {
          const data = JSON.parse(localStorage.getItem('ph_personal') || '[]');
          const mozos = data.filter((x: any) => x.rol === 'mozo').map((x: any) => ({ id: x.id, nombre: x.nombre }));
          if (mozos.length) { setMozosList(mozos); setSelectedWaiterId(mozos[0].id); }
        } catch {}
      }

      // Mermas/Wastes
      try {
        const res = await fetch('/api/reportes/wastes');
        if (res.ok) { setInsumosWasted(await res.json()); }
      } catch {
        try { setInsumosWasted(JSON.parse(localStorage.getItem('puerto_habana_wastes') || '[]')); } catch {}
      }

      // Pagos personal
      try {
        const res = await fetch('/api/reportes/payments');
        if (res.ok) { setStaffPayments(await res.json()); }
      } catch {
        try { setStaffPayments(JSON.parse(localStorage.getItem('puerto_habana_payments') || '[]')); } catch {}
      }

      // Pedidos/Comandas
      try {
        const res = await fetch('/api/pedidos');
        if (res.ok) {
          const data = await res.json();
          // Normalizar formato para compatibilidad con el dashboard
          const normalized = data.flatMap((c: any) =>
            (c.items || []).map((item: any) => ({
              id: `${c.id}-${item.id}`,
              item: item.nombre,
              cantidad: item.cantidad,
              mesa: c.mesa,
              precio: item.precio,
              estado: c.estado,
              hora: c.hora,
              notas: item.notas,
              mozoId: c.mozo_id || '',
              mozoNombre: c.mozo_nombre || '',
              fecha: c.fecha,
              category: item.categoria || 'comida',
              comandaId: String(c.id),
            }))
          );
          setPedidos(normalized);
        }
      } catch {
        try { setPedidos(JSON.parse(localStorage.getItem('puerto_habana_pedidos') || '[]')); } catch {}
      }
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

  useEffect(() => {
    if (colorMode === 'oscuro') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [colorMode]);


  if (!mounted) {
    return null;
  }

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
    setInsumosWasted(prev => prev.filter((w: any) => String(w.id) !== String(id)));
  };

  const handleAddPayment = async () => {
    if (!paymentForm.concepto || !paymentForm.monto) return;
    try {
      const res = await fetch('/api/reportes/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: paymentForm.mozoNombre, monto: paymentForm.monto, concepto: paymentForm.concepto, fecha: simulatedDate }),
      });
      if (res.ok) {
        const { id } = await res.json();
        const newPayment = { id, mozoNombre: paymentForm.mozoNombre, monto: parseFloat(paymentForm.monto), concepto: paymentForm.concepto, fecha: simulatedDate };
        setStaffPayments(prev => [newPayment, ...prev]);
      }
    } catch {
      const newPayment = { id: Date.now(), mozoNombre: paymentForm.mozoNombre, monto: parseFloat(paymentForm.monto) || 0, concepto: paymentForm.concepto, fecha: simulatedDate };
      const updated = [newPayment, ...staffPayments];
      setStaffPayments(updated);
      localStorage.setItem('puerto_habana_payments', JSON.stringify(updated));
    }
    setPaymentForm({ mozoNombre: mozosList[0]?.nombre ?? '', monto: '', concepto: '', fecha: '' });
    setToastMessage('Pago a personal registrado y deducido de la ganancia.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await fetch(`/api/reportes/payments?id=${id}`, { method: 'DELETE' });
    } catch {}
    setStaffPayments(prev => prev.filter((p: any) => String(p.id) !== String(id)));
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
          const normalized = data.flatMap((c: any) =>
            (c.items || []).map((item: any) => ({
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
    const updated = pedidos.map((p: any) =>
      String(p.id) === String(orderId) ? { ...p, estado: nextStatus } : p
    );
    setPedidos(updated);
    if (selectedMozo) {
      setSelectedMozo({ ...selectedMozo, pedidos: updated.filter((p: any) => p.fecha === simulatedDate && p.mozoId === selectedMozo.id) });
    }
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
      const activeMozoIds = new Set(todayOrders.map(p => p.mozoId));

      return {
        comida: { title: 'Comida (Hoy)', value: `S/ ${comidaVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Utensils },
        bebidas: { title: 'Bebidas (Hoy)', value: `S/ ${bebidasVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wine },
        mozos: { title: 'Mozos en Turno', value: String(activeMozoIds.size), icon: Users },
      };
    } else if (activeTab === 'historial') {
      const totalRev = filteredHistoryOrders.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const comidaVal = filteredHistoryOrders.filter(p => p.category === 'comida').reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const bebidasVal = filteredHistoryOrders.filter(p => p.category === 'bebidas').reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const ticketPromedio = filteredHistoryOrders.length > 0 ? (totalRev / filteredHistoryOrders.length) : 0;

      return {
        ventasTotal: { title: 'Ventas Totales', value: `S/ ${totalRev.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: DollarSign },
        comidaHist: { title: 'Ventas Comida', value: `S/ ${comidaVal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: Utensils },
        bebidasHist: { title: 'Ventas Bebidas', value: `S/ ${bebidasVal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: Wine },
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
  const mozosPedidos = mozosList.map((mozo) => {
    const mozoOrders = activeOrdersForSimDate.filter(p => p.mozoId === mozo.id);
    return {
      id: mozo.id,
      nombre: mozo.nombre,
      pedidos: mozoOrders,
    };
  });

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
        colorMode === 'oscuro' 
          ? 'bg-gray-900 border-gray-800 text-white' 
          : 'bg-white border-gray-200 text-gray-900 shadow-sm'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-sm tracking-wide">
            {calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
              className={`p-2 rounded-lg border transition-colors ${
                colorMode === 'oscuro' 
                  ? 'border-gray-800 hover:bg-gray-800 hover:text-white text-gray-400' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
              className={`p-2 rounded-lg border transition-colors ${
                colorMode === 'oscuro' 
                  ? 'border-gray-800 hover:bg-gray-800 hover:text-white text-gray-400' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
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
                    ? colorMode === 'oscuro' 
                      ? 'bg-gray-800 text-blue-400 border border-blue-500/50' 
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : colorMode === 'oscuro' 
                      ? 'bg-gray-950 border border-gray-900 hover:border-gray-800 text-gray-300' 
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
    <div className={`animate-in fade-in duration-300 overflow-x-hidden w-full ${colorMode === 'oscuro' ? 'bg-black min-h-screen text-white' : 'text-gray-900'}`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`p-4 rounded-xl border shadow-xl max-w-sm flex items-start gap-3 ${
            colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800 text-white shadow-black/50' : 'bg-white border-gray-200 text-gray-800 shadow-gray-200/50'
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
          <h1 className={`text-3xl md:text-4xl font-medium tracking-tight ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
            Puerto Habana
          </h1>
          <p className={`text-sm mt-1.5 flex items-center gap-1.5 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>
            <Clock size={15} />
            Fecha de operación: <span className="font-semibold text-blue-600">{formatDate(simulatedDate)}</span>
          </p>
        </div>
        
        {/* Time Simulator Panel */}
        <div className={`p-3 rounded-xl border flex flex-col md:flex-row items-center gap-3 shrink-0 ${
          colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
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
                  colorMode === 'oscuro' ? 'border-gray-800 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                Restablecer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`flex border-b mb-8 overflow-x-auto gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 ${
        colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <button
          onClick={() => { setActiveTab('activos'); localStorage.setItem('puerto_habana_active_tab', 'activos'); }}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'activos'
              ? colorMode === 'oscuro' ? 'border-white text-white font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
              : colorMode === 'oscuro' ? 'border-transparent text-gray-400 hover:text-white' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Clock size={16} />
          Pedidos Activos
          {activeOrdersForSimDate.length > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              colorMode === 'oscuro' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
            }`}>
              {activeOrdersForSimDate.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('historial'); localStorage.setItem('puerto_habana_active_tab', 'historial'); }}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'historial'
              ? colorMode === 'oscuro' ? 'border-white text-white font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
              : colorMode === 'oscuro' ? 'border-transparent text-gray-400 hover:text-white' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar size={16} />
          Historial de Ventas
        </button>
        <button
          onClick={() => { setActiveTab('ventas_mozo'); localStorage.setItem('puerto_habana_active_tab', 'ventas_mozo'); }}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ventas_mozo'
              ? colorMode === 'oscuro' ? 'border-white text-white font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
              : colorMode === 'oscuro' ? 'border-transparent text-gray-400 hover:text-white' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users size={16} />
          Vendido por Mozo
        </button>
        <button
          onClick={() => { setActiveTab('reportes'); localStorage.setItem('puerto_habana_active_tab', 'reportes'); }}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reportes'
              ? colorMode === 'oscuro' ? 'border-white text-white font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
              : colorMode === 'oscuro' ? 'border-transparent text-gray-400 hover:text-white' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <TrendingUp size={16} />
          Reportes y Ganancias
        </button>
      </div>
      
      {/* Summary Cards Grid */}
      {activeTab !== 'reportes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10 w-full overflow-hidden">
          {Object.entries(getTabCards()).map(([key, data]) => {
            const Icon = data.icon;
            return (
              <DashboardCard
                key={key}
                title={data.title}
                value={data.value}
                icon={Icon}
                colorMode={colorMode}
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
              <h2 className={`text-xl md:text-2xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
                Pedidos por Mozo (En Vivo)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monitoreo de comandas activas del día.</p>
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
                key={mozo.id} 
                className={`border rounded-xl p-4 md:p-6 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
                onClick={() => setSelectedMozo(mozo)}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-base md:text-lg font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{mozo.nombre}</h3>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      mozo.pedidos.length > 0
                        ? colorMode === 'oscuro' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
                        : colorMode === 'oscuro' ? 'bg-gray-950 text-gray-500 border border-gray-900' : 'bg-gray-50 text-gray-400 border border-gray-100'
                    }`}>
                      {mozo.pedidos.length} {mozo.pedidos.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                  
                  {mozo.pedidos.length > 0 ? (
                    <div className="space-y-2">
                      {mozo.pedidos.slice(0, 3).map((pedido, idx) => (
                        <div key={idx} className={`flex justify-between items-center py-2.5 border-b last:border-0 ${
                          colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-100'
                        }`}>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{pedido.item}</p>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                pedido.estado === 'Listo' ? 'bg-green-500' : pedido.estado === 'En preparación' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`}></span>
                            </div>
                            <p className={`text-xs ${colorMode === 'oscuro' ? 'text-gray-500' : 'text-gray-500'}`}>{pedido.mesa} • {pedido.hora}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                            colorMode === 'oscuro' ? 'text-white bg-gray-800' : 'text-gray-800 bg-gray-100'
                          }`}>{pedido.cantidad}</span>
                        </div>
                      ))}
                      {mozo.pedidos.length > 3 && (
                        <p className="text-xs text-center text-blue-500 font-medium pt-3 hover:underline">
                          Ver {mozo.pedidos.length - 3} pedidos más...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className={`text-sm ${colorMode === 'oscuro' ? 'text-gray-600' : 'text-gray-400'}`}>Sin pedidos para hoy</p>
                    </div>
                  )}
                </div>
                
                {mozo.pedidos.length > 0 && (
                  <div className={`mt-4 pt-3 border-t flex justify-between items-center text-xs ${
                    colorMode === 'oscuro' ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500'
                  }`}>
                    <span>Total ventas:</span>
                    <span className="font-semibold text-inherit dark:text-white">
                      S/ {mozo.pedidos.reduce((total, p) => total + (p.precio * p.cantidad), 0).toFixed(2)}
                    </span>
                  </div>
                )}
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
              <h3 className={`text-lg font-medium mb-3 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>Navegar Fechas</h3>
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
              colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <button
                onClick={() => setRangoHistorial('dia')}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors ${
                  rangoHistorial === 'dia'
                    ? 'bg-blue-600 text-white'
                    : colorMode === 'oscuro' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setRangoHistorial('semana')}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors ${
                  rangoHistorial === 'semana'
                    ? 'bg-blue-600 text-white'
                    : colorMode === 'oscuro' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setRangoHistorial('mes')}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors ${
                  rangoHistorial === 'mes'
                    ? 'bg-blue-600 text-white'
                    : colorMode === 'oscuro' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:bg-gray-50'
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
                <h3 className={`text-lg font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
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
                    colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800 text-white focus:border-white' : 'border-gray-200 focus:border-black bg-white'
                  }`}
                />
              </div>
            </div>

            {/* List/Table */}
            {filteredHistoryOrders.length > 0 ? (
              <>
                {/* Desktop View Table */}
                <div className={`hidden md:block border rounded-xl overflow-hidden w-full ${
                  colorMode === 'oscuro' ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white shadow-sm'
                }`}>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm">
                      <thead className={`border-b ${colorMode === 'oscuro' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-xs text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-gray-500 uppercase tracking-wider">Mozo</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-gray-500 uppercase tracking-wider">Mesa</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-gray-500 uppercase tracking-wider">Plato / Bebida</th>
                          <th className="px-4 py-3 text-center font-medium text-xs text-gray-500 uppercase tracking-wider">Cant.</th>
                          <th className="px-4 py-3 text-right font-medium text-xs text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${colorMode === 'oscuro' ? 'divide-gray-900' : 'divide-gray-100'}`}>
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
                        colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800 shadow-sm'
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
                        colorMode === 'oscuro' ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500'
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
                colorMode === 'oscuro' ? 'border-gray-800 bg-gray-950/30' : 'border-gray-200 bg-white'
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
            <h2 className={`text-xl md:text-2xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
              Rendimiento y Ventas por Mozo
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Análisis comparativo basado en el periodo: <span className="font-semibold text-blue-600">{getHistoryPeriodLabel()}</span></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full overflow-hidden">
            
            {/* Visual Charts / Performance rankings */}
            <div className={`lg:col-span-2 p-6 rounded-xl border ${
              colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
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
                colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400 mb-4">Métricas del Período</h3>
                <div className={`divide-y ${colorMode === 'oscuro' ? 'divide-gray-800' : 'divide-gray-150'}`}>
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
            colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className={`text-base sm:text-lg font-semibold ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
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
                          : colorMode === 'oscuro'
                          ? 'bg-gray-850 text-gray-400 hover:bg-gray-800 hover:text-white'
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
                      <tr className={`border-b ${colorMode === 'oscuro' ? 'border-gray-800 text-gray-400' : 'border-gray-150 text-gray-500'} uppercase tracking-wider font-semibold text-[10px]`}>
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
                    <tbody className={`divide-y ${colorMode === 'oscuro' ? 'divide-gray-800/60' : 'divide-gray-100/80'}`}>
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
                      <tr className={`border-t font-semibold ${colorMode === 'oscuro' ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
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
                        colorMode === 'oscuro' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-150 text-gray-800 shadow-xs'
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
                        colorMode === 'oscuro' ? 'border-gray-800 text-gray-450' : 'border-gray-150 text-gray-500'
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
                    colorMode === 'oscuro' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-gray-100 border-gray-150 text-gray-900'
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
                colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-200'
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
            <h2 className={`text-xl md:text-2xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
              Reportes y Estado de Resultados
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Análisis financiero y pronósticos en tiempo real basados en el historial.</p>
          </div>

          {/* financial cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full overflow-hidden">
            <div className={`p-5 rounded-xl border ${colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm'}`}>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Ventas Brutas</span>
              <p className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-500">S/ {Number(totalVentas).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Basado en comandas registradas</p>
            </div>
            
            <div className={`p-5 rounded-xl border ${colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm'}`}>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Pérdida de Insumos</span>
              <p className="text-2xl font-bold mt-2 text-red-600 dark:text-red-500">S/ {Number(totalInsumosLoss).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Descartes/vencidos ya pagados</p>
            </div>

            <div className={`p-5 rounded-xl border ${colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm'}`}>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Pagos al Personal</span>
              <p className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-500">S/ {Number(totalStaffPayments).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Nóminas y comisiones de mozos</p>
            </div>

            <div className={`p-5 rounded-xl border ${colorMode === 'oscuro' ? 'bg-blue-950/20 border-blue-900/30' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Ganancia Neta</span>
              <p className="text-2xl font-bold mt-2 text-green-600 dark:text-green-500">S/ {Number(netProfit).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Nueva ganancia tras deducciones</p>
            </div>
          </div>

          {/* Export tools */}
          <div className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${
            colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm'
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
              <div className={`p-6 rounded-xl border ${colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm'}`}>
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
                      colorMode === 'oscuro' ? 'bg-gray-850 border-gray-750 text-white focus:border-white focus:ring-white' : 'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
                    }`}
                  />
                  <input 
                    type="number" 
                    placeholder="Costo total (S/)"
                    value={wasteForm.costo}
                    onChange={e => setWasteForm({ ...wasteForm, costo: e.target.value })}
                    className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      colorMode === 'oscuro' ? 'bg-gray-850 border-gray-750 text-white focus:border-white focus:ring-white' : 'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
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
                      colorMode === 'oscuro' ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
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
              <div className={`p-6 rounded-xl border ${colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm'}`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex justify-between items-center">
                  <span>Registro de Pagos al Personal</span>
                  <span className="text-xs text-amber-500 font-normal">Resta de Ganancia</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                  <select 
                    value={paymentForm.mozoNombre}
                    onChange={e => setPaymentForm({ ...paymentForm, mozoNombre: e.target.value })}
                    className={`px-2 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      colorMode === 'oscuro' ? 'bg-gray-850 border-gray-750 text-white focus:border-white focus:ring-white' : 'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
                    }`}
                  >
                    {mozosList.map(m => (
                      <option key={m.id} value={m.nombre}>{m.nombre}</option>
                    ))}
                    <option value="Administración">Administración</option>
                    <option value="Cocina">Cocina</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Concepto (ej. Jornal)"
                    value={paymentForm.concepto}
                    onChange={e => setPaymentForm({ ...paymentForm, concepto: e.target.value })}
                    className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      colorMode === 'oscuro' ? 'bg-gray-850 border-gray-750 text-white focus:border-white focus:ring-white' : 'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
                    }`}
                  />
                  <input 
                    type="number" 
                    placeholder="Monto (S/)"
                    value={paymentForm.monto}
                    onChange={e => setPaymentForm({ ...paymentForm, monto: e.target.value })}
                    className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
                      colorMode === 'oscuro' ? 'bg-gray-850 border-gray-750 text-white focus:border-white focus:ring-white' : 'bg-white border-gray-200 text-gray-800 focus:border-black focus:ring-black'
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
                      colorMode === 'oscuro' ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
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
              <div className={`p-6 rounded-xl border ${colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm'}`}>
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
                        <div className={`w-full h-2 rounded-full overflow-hidden ${colorMode === 'oscuro' ? 'bg-gray-950' : 'bg-gray-100'}`}>
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

              {/* Pronósticos y Inteligencia de Negocio */}
              <div className={`p-6 rounded-xl border ${colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm'}`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Pronósticos y Proyección de Demanda
                </h3>

                <div className="space-y-4 text-xs font-medium">
                  
                  {/* Empty Data State */}
                  <div className={`p-8 text-center rounded-lg border border-dashed ${colorMode === 'oscuro' ? 'bg-gray-950 border-gray-800 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-semibold uppercase tracking-widest text-[10px]">Recopilando Datos Reales</p>
                    <p className="mt-1 text-xs font-normal">Las proyecciones de volumen y participación se generarán automáticamente a medida que el sistema procese más ventas históricas.</p>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Modal: View active orders of a Waiter */}
      {selectedMozo && (
        <Modal
          isOpen={!!selectedMozo}
          onClose={() => setSelectedMozo(null)}
          title={`Pedidos de ${selectedMozo.nombre}`}
          colorMode={colorMode}
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {selectedMozo.pedidos.length > 0 ? (
              selectedMozo.pedidos.map((pedido) => (
                <div key={pedido.id} className={`rounded-xl p-4 border transition-all ${
                  colorMode === 'oscuro' ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className={`text-base font-semibold ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{pedido.item}</h4>
                      <p className={`text-xs ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>{pedido.mesa}</p>
                    </div>
                    <span className={`text-base font-bold ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
                      S/ {(Number(pedido.precio) * Number(pedido.cantidad)).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
                    <div>
                      <p className="text-gray-400">Cantidad</p>
                      <p className={`font-semibold mt-0.5 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{pedido.cantidad}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Precio Unit.</p>
                      <p className={`font-semibold mt-0.5 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>S/ {Number(pedido.precio).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Hora</p>
                      <p className={`font-semibold mt-0.5 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{pedido.hora} hrs</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Estado</p>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full mt-1 ${
                        pedido.estado === 'Listo' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' 
                          : pedido.estado === 'En preparación'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {pedido.estado}
                      </span>
                    </div>
                  </div>

                  {pedido.notas && (
                    <div className={`pt-3 border-t mb-4 ${colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-200'}`}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notas Especiales</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug">{pedido.notas}</p>
                    </div>
                  )}

                  {/* Order Actions */}
                  <div className="flex gap-2 justify-end">
                    {pedido.estado === 'Pendiente' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(String(pedido.id), 'En preparación')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Iniciar Preparación
                      </button>
                    )}
                    {pedido.estado === 'En preparación' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(String(pedido.id), 'Listo')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check size={12} />
                        Marcar Listo
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400 font-semibold">Sin pedidos pendientes</p>
                <p className="text-xs text-gray-500 mt-1">Este mozo no cuenta con comandas ingresadas hoy.</p>
              </div>
            )}
            
            {selectedMozo.pedidos.length > 0 && (
              <div className={`border-t pt-4 mt-6 space-y-3 ${
                colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-500">Monto Acumulado Hoy</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-500">
                    S/ {selectedMozo.pedidos.reduce((total, p) => total + (p.precio * p.cantidad), 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setShowBoleta(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  🧾 Imprimir Boleta
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Boleta de consumo */}
      {showBoleta && selectedMozo && selectedMozo.pedidos.length > 0 && (
        <Boleta
          mesa={selectedMozo.pedidos[0].mesa}
          mozoNombre={selectedMozo.nombre}
          fecha={simulatedDate}
          hora={new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          items={selectedMozo.pedidos.map(p => ({
            item: p.item,
            cantidad: p.cantidad,
            precio: p.precio,
            notas: p.notas,
          }))}
          onClose={() => setShowBoleta(false)}
        />
      )}

      {/* Modal: Create new Order */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border ${
            colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-150'}`}>
              <h2 className="text-lg font-semibold tracking-tight">Registrar Nueva Comanda</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className={`text-xs p-1 rounded-md ${colorMode === 'oscuro' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
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
                    colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
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
                      colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
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
                    type="number"
                    min={1}
                    max={20}
                    value={newOrder.cantidad}
                    onChange={(e) => setNewOrder({ ...newOrder, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-colors ${
                      colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
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
                    colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
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
                    colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
                  }`}
                />
              </div>

              {/* Total Calculation */}
              <div className={`p-4 rounded-xl flex justify-between items-center ${
                colorMode === 'oscuro' ? 'bg-gray-950' : 'bg-gray-50'
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
                    colorMode === 'oscuro' ? 'border-gray-800 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
