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

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = url;
  });
}

export default function CarnetPDF({ empleado, onClose }: { empleado: Empleado; onClose?: () => void }) {
  const [generando, setGenerando] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generar QR con los datos del empleado
  const generarQR = async (): Promise<string> => {
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
        format: [85, 125],
      });

      // ── Fondo blanco ──
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 85, 125, 'F');

      // ── Borde sutil gris ──
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.rect(2, 2, 81, 121, 'S');

      // ── Header minimalista ──
      doc.setFillColor(249, 250, 251); // gray-50
      doc.rect(0, 0, 85, 20, 'F');

      doc.setTextColor(17, 24, 39); // gray-900
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PUERTO HABANA', 42.5, 9, { align: 'center' });

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175); // gray-400
      doc.text('C E V I C H E R I A', 42.5, 13.5, { align: 'center' });

      // ── Línea divisoria ──
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(10, 18, 75, 18);

      // ── Foto (círculo) ──
      const fotoX = 42.5;
      const fotoY = 38;
      const fotoR = 10;

      if (empleado.foto_url) {
        try {
          const imgData = await loadImage(empleado.foto_url);
          // jsPDF no soporta recortes circulares nativamente.
          // Estrategia: crear el círculo blanco de fondo, luego poner la imagen cuadrada encima
          // como no podemos recortar, usamos la imagen directamente
          doc.setFillColor(255, 255, 255);
          doc.circle(fotoX, fotoY, fotoR, 'F');
          // Agregar imagen cuadrada, con clip solo logramos con addImage
          doc.addImage(imgData, 'JPEG', fotoX - fotoR, fotoY - fotoR, fotoR * 2, fotoR * 2);
          // Círculo blanco alrededor para simular borde
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.5);
          doc.circle(fotoX, fotoY, fotoR, 'S');
        } catch {
          // Si falla la carga de la foto, dibujar círculo vacío
          drawEmptyPhoto(doc, fotoX, fotoY, fotoR);
        }
      } else {
        drawEmptyPhoto(doc, fotoX, fotoY, fotoR);
      }

      // ── Nombre ──
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const nombreParts = doc.splitTextToSize(empleado.nombre.toUpperCase(), 65);
      doc.text(nombreParts, 42.5, 55, { align: 'center' });

      // ── Rol ──
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text((ROL_LABELS[empleado.rol] || empleado.rol).toUpperCase(), 42.5, 60.5, { align: 'center' });

      // ── Línea separadora ──
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(12, 64, 73, 64);

      // ── Datos ──
      const datos = [
        { label: 'DNI',    value: empleado.dni || '—' },
        { label: 'TURNO',  value: empleado.turno ? empleado.turno.charAt(0).toUpperCase() + empleado.turno.slice(1) : '—' },
        { label: 'EMAIL',  value: empleado.email || '—' },
      ];

      let yPos = 67.5;
      datos.forEach(d => {
        doc.setTextColor(156, 163, 175); // gray-400
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(d.label, 12, yPos);

        doc.setTextColor(75, 85, 99); // gray-600
        doc.setFont('helvetica', 'normal');
        const valParts = doc.splitTextToSize(d.value, 50);
        doc.text(valParts, 42, yPos, { align: 'left' });
        yPos += 5.5;
      });

      // ── QR Code ──
      if (qrUrl) {
        const qrSize = 24;
        const qrX = (85 - qrSize) / 2;
        const qrY = 83;
        doc.addImage(qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      // ── Footer ──
      doc.setFontSize(4);
      doc.setTextColor(209, 213, 219);
      doc.setFont('helvetica', 'normal');
      doc.text('CODEOl SOFTWARE', 42.5, 121.5, { align: 'center' });

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
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-semibold disabled:opacity-60"
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

/* Helper: dibujar círculo de foto vacío */
function drawEmptyPhoto(doc: jsPDF, x: number, y: number, r: number) {
  doc.setFillColor(249, 250, 251);
  doc.circle(x, y, r, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.circle(x, y, r, 'S');
}

// Nota: jsPDF no soporta clipping circular, así que la foto se renderiza
// como imagen cuadrada dentro del área del círculo.
