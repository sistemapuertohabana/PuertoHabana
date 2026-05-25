'use client';

import { useState } from 'react';
import { Download, QrCode, X, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface Empleado {
  id: string;
  nombre: string;
  dni?: string;
  email?: string;
  rol: string;
  telefono?: string;
  turno?: string;
  foto_url?: string;
}

const ROL_LABELS: Record<string, string> = {
  admin:           'Administrador',
  mozo:            'Mozo',
  cocina:          'Cocinero',
  ayudante_cocina: 'Ayudante de Cocina',
  lavaplato:       'Lavaplatos',
  dev:             'Desarrollador',
};

export default function CarnetPDF({ empleado, onClose }: { empleado: Empleado; onClose?: () => void }) {
  const [generando, setGenerando] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generar QR con los datos del empleado
  const generarQR = async (): Promise<string> => {
    // El QR codifica la URL de asistencia + ID del empleado
    const data = JSON.stringify({
      id: empleado.id,
      nombre: empleado.nombre,
      dni: empleado.dni || '',
      rol: empleado.rol,
    });

    try {
      const url = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      });
      return url;
    } catch {
      // Fallback: generar QR simple con solo el ID
      return await QRCode.toDataURL(empleado.id, {
        width: 300,
        margin: 2,
      });
    }
  };

  const handleDescargarPDF = async () => {
    setGenerando(true);
    try {
      const qrUrl = await generarQR();
      setQrDataUrl(qrUrl);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [85, 125], // Tamaño carnet: 85mm x 125mm
      });

      // Fondo principal
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 85, 125, 'F');

      // Borde decorativo
      doc.setDrawColor(56, 189, 248); // cyan-400
      doc.setLineWidth(0.5);
      doc.rect(2, 2, 81, 121, 'S');

      // Header con nombre del restaurante
      doc.setFillColor(56, 189, 248);
      doc.rect(0, 0, 85, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PUERTO HABANA', 42.5, 10, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('C E V I C H E R I A', 42.5, 15.5, { align: 'center' });
      doc.setFontSize(6);
      doc.text('IDENTIFICACION DEL PERSONAL', 42.5, 19.5, { align: 'center' });

      // Espacio para foto (círculo)
      doc.setFillColor(255, 255, 255);
      doc.circle(42.5, 45, 11, 'F');
      doc.setDrawColor(56, 189, 248);
      doc.setLineWidth(0.8);
      doc.circle(42.5, 45, 11, 'S');

      // Nombre
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const nombreParts = doc.splitTextToSize(empleado.nombre.toUpperCase(), 70);
      doc.text(nombreParts, 42.5, 62, { align: 'center' });

      // Rol
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(56, 189, 248);
      doc.text((ROL_LABELS[empleado.rol] || empleado.rol).toUpperCase(), 42.5, 69, { align: 'center' });

      // Línea separadora
      doc.setDrawColor(56, 189, 248);
      doc.setLineWidth(0.3);
      doc.line(10, 74, 75, 74);

      // Datos
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');

      const datos = [
        { label: 'DNI', value: empleado.dni || '—' },
        { label: 'TURNO', value: empleado.turno ? empleado.turno.charAt(0).toUpperCase() + empleado.turno.slice(1) : '—' },
        { label: 'EMAIL', value: empleado.email || '—' },
      ];

      let yPos = 78;
      datos.forEach(d => {
        doc.setTextColor(100, 116, 139);
        doc.text(d.label, 12, yPos);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        const valParts = doc.splitTextToSize(d.value, 55);
        doc.text(valParts, 42, yPos, { align: 'left' });
        doc.setFont('helvetica', 'bold');
        yPos += 6.5;
      });

      // QR Code
      if (qrUrl) {
        const qrSize = 28;
        const qrX = (85 - qrSize) / 2;
        const qrY = 93;
        doc.addImage(qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      // Footer
      doc.setFontSize(4.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text('CODEOl SOFTWARE PERU', 42.5, 122, { align: 'center' });

      doc.save(`carnet-${empleado.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
    }
    setGenerando(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Vista previa del QR */}
      <div className="w-full flex justify-center">
        {qrDataUrl ? (
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR del empleado" className="w-32 h-32" />
            <p className="text-[10px] text-center text-gray-400 mt-1.5 font-mono">
              {empleado.nombre} · {empleado.dni || '—'}
            </p>
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
            <QrCode size={32} className="text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full">
        <button
          onClick={handleDescargarPDF}
          disabled={generando}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors text-sm font-semibold disabled:opacity-60"
        >
          {generando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {generando ? 'Generando...' : 'Descargar PDF'}
        </button>
        {onClose && (
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
