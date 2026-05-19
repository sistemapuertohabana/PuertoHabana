'use client';

import { X } from 'lucide-react';

type ColorMode = 'claro' | 'oscuro';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  colorMode?: ColorMode;
}

export default function Modal({ isOpen, onClose, title, children, colorMode = 'claro' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-lg ${
        colorMode === 'oscuro' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          colorMode === 'oscuro' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-medium ${
            colorMode === 'oscuro' ? 'text-white' : 'text-gray-900'
          }`}>{title}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              colorMode === 'oscuro' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} className={colorMode === 'oscuro' ? 'text-gray-400' : 'text-gray-500'} strokeWidth={2} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
