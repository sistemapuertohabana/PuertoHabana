'use client';

import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-lg bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" strokeWidth={2} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
