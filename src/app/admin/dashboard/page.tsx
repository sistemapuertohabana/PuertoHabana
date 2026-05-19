'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import Modal from '@/components/Modal';
import { Utensils, Wine, Users, DollarSign, AlertTriangle } from 'lucide-react';

type ColorMode = 'claro' | 'oscuro';

export default function DashboardPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedMozo, setSelectedMozo] = useState<typeof mozosPedidos[0] | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('claro');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedColorMode = localStorage.getItem('colorMode') as ColorMode;
    if (savedColorMode) setColorMode(savedColorMode);
  }, []);

  if (!mounted) {
    return null;
  }
  

  const cards = {
    comida: {
      title: 'Comida',
      value: '$12,450',
      icon: Utensils,
    },
    bebidas: {
      title: 'Bebidas',
      value: '$8,320',
      icon: Wine,
    },
    insumos: {
      title: 'Insumos Perdidos',
      value: '$1,250',
      icon: AlertTriangle,
    },
    personal: {
      title: 'Personal',
      value: '12',
      icon: Users,
    },
    gastos: {
      title: 'Gastos Totales',
      value: '$5,890',
      icon: DollarSign,
    },
  };

  const mozosPedidos = [
    {
      id: 1,
      nombre: 'Mozo 1',
      pedidos: [
        { 
          id: 1,
          item: 'Ceviche Mixto', 
          cantidad: 2, 
          mesa: 'Mesa 1', 
          precio: 45.00,
          estado: 'En preparación',
          hora: '12:30',
          notas: 'Sin cebolla'
        },
        { 
          id: 2,
          item: 'Cerveza Pilsner', 
          cantidad: 4, 
          mesa: 'Mesa 1', 
          precio: 12.00,
          estado: 'Listo',
          hora: '12:35',
          notas: ''
        },
      ],
    },
    {
      id: 2,
      nombre: 'Mozo 2',
      pedidos: [
        { 
          id: 3,
          item: 'Arroz con Mariscos', 
          cantidad: 1, 
          mesa: 'Mesa 3', 
          precio: 38.00,
          estado: 'En preparación',
          hora: '12:40',
          notas: 'Poco picante'
        },
        { 
          id: 4,
          item: 'Jugo de Naranja', 
          cantidad: 2, 
          mesa: 'Mesa 3', 
          precio: 8.00,
          estado: 'Listo',
          hora: '12:42',
          notas: ''
        },
        { 
          id: 5,
          item: 'Lomo Saltado', 
          cantidad: 1, 
          mesa: 'Mesa 4', 
          precio: 32.00,
          estado: 'Pendiente',
          hora: '12:45',
          notas: 'Bien cocido'
        },
      ],
    },
    {
      id: 3,
      nombre: 'Mozo 3',
      pedidos: [
        { 
          id: 6,
          item: 'Ceviche de Pescado', 
          cantidad: 3, 
          mesa: 'Mesa 5', 
          precio: 42.00,
          estado: 'En preparación',
          hora: '12:50',
          notas: ''
        },
        { 
          id: 7,
          item: 'Inca Kola', 
          cantidad: 3, 
          mesa: 'Mesa 5', 
          precio: 5.00,
          estado: 'Listo',
          hora: '12:52',
          notas: ''
        },
      ],
    },
  ];

  const modalContent: Record<string, React.ReactNode> = {
    comida: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Ceviches</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$4,500</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Platos Fuertes</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$5,200</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Entradas</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$2,750</p>
        </div>
      </div>
    ),
    bebidas: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Refrescos</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$2,100</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Cervezas</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$3,800</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Cócteles</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$2,420</p>
        </div>
      </div>
    ),
    insumos: (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Pescado</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$450</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Verduras</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$320</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Condimentos</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$180</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Otros</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$300</p>
        </div>
      </div>
    ),
    personal: (
      <div className= "grid grid-cols-1 md:grid-cols-4 gap-4 ">
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Mozos</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>4</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Cocineros</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>3</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Ayudantes</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>3</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Lavaderos</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>2</p>
        </div>
      </div>
    ),
    gastos: (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Nómina</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$3,200</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Servicios</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$890</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Mantenimiento</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$650</p>
        </div>
        <div className={`p-4 rounded-lg ${colorMode === 'oscuro' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Otros</p>
          <p className={`text-xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>$1,150</p>
        </div>
      </div>
    ),
  };

  return (
    <div className={`animate-in fade-in duration-300 ${colorMode === 'oscuro' ? 'bg-black min-h-screen' : ''}`}>
      <div className="mb-10">
        <h1 className={`text-3xl md:text-4xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
        {Object.entries(cards).map(([key, data]) => {
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

      <div className="mb-8">
        <h2 className={`text-xl md:text-2xl font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>Pedidos por Mozo</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-4">
        {mozosPedidos.map((mozo) => (
          <div 
            key={mozo.id} 
            className={`border rounded-lg p-4 md:p-6 hover:border-gray-300 transition-colors cursor-pointer ${
              colorMode === 'oscuro' ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200'
            }`}
            onClick={() => setSelectedMozo(mozo)}
          >
            <h3 className={`text-base md:text-lg font-medium mb-4 ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{mozo.nombre}</h3>
            <div className="space-y-2">
              {mozo.pedidos.slice(0, 3).map((pedido, idx) => (
                <div key={idx} className={`flex justify-between items-center py-2.5 border-b last:border-0 ${
                  colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-100'
                }`}>
                  <div>
                    <p className={`text-sm font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{pedido.item}</p>
                    <p className={`text-xs ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>{pedido.mesa}</p>
                  </div>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                    colorMode === 'oscuro' ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-50'
                  }`}>{pedido.cantidad}</span>
                </div>
              ))}
              {mozo.pedidos.length > 3 && (
                <p className={`text-xs text-center pt-2 ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>
                  +{mozo.pedidos.length - 3} más pedidos
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeModal && (
        <Modal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={cards[activeModal as keyof typeof cards].title}
          colorMode={colorMode}
        >
          {modalContent[activeModal]}
        </Modal>
      )}

      {selectedMozo && (
        <Modal
          isOpen={!!selectedMozo}
          onClose={() => setSelectedMozo(null)}
          title={`Pedidos de ${selectedMozo.nombre}`}
          colorMode={colorMode}
        >
          <div className="space-y-4">
            {selectedMozo.pedidos.map((pedido) => (
              <div key={pedido.id} className={`rounded-lg p-4 border ${
                colorMode === 'oscuro' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className={`text-base font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{pedido.item}</h4>
                    <p className={`text-sm ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>{pedido.mesa}</p>
                  </div>
                  <span className={`text-lg font-semibold ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>
                    S/ {(pedido.precio * pedido.cantidad).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className={`text-xs ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Cantidad</p>
                    <p className={`font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{pedido.cantidad}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Precio unit.</p>
                    <p className={`font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>S/ {pedido.precio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Hora</p>
                    <p className={`font-medium ${colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'}`}>{pedido.hora}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'}`}>Estado</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                      pedido.estado === 'Listo' 
                        ? colorMode === 'oscuro' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800' 
                        : pedido.estado === 'En preparación'
                        ? colorMode === 'oscuro' ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                        : colorMode === 'oscuro' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pedido.estado}
                    </span>
                  </div>
                </div>
                {pedido.notas && (
                  <div className={`mt-3 pt-3 border-t ${colorMode === 'oscuro' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className="text-xs text-gray-500">Notas:</p>
                    <p className="text-sm text-gray-700">{pedido.notas}</p>
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-medium text-gray-900">Total</span>
                <span className="text-xl font-semibold text-gray-900">
                  S/ {selectedMozo.pedidos.reduce((total, p) => total + (p.precio * p.cantidad), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
