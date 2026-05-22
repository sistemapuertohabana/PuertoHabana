import { useEffect, useState } from 'react';

export type Payment = {
  id: number | string;
  mozoNombre: string;
  monto: number;
  concepto: string;
  fecha: string;
};

/**
 * Hook to provide real‑time access to staff payments stored in localStorage.
 * It reads the 'puerto_habana_payments' key and listens for storage events
 * so that any change performed in another tab (e.g., admin adding a payment)
 * is instantly reflected.
 */
export function usePayments(): Payment[] {
  const [payments, setPayments] = useState<Payment[]>([]);

  // Load payments from localStorage
  const loadPayments = () => {
    const raw = localStorage.getItem('puerto_habana_payments');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Payment[];
        setPayments(parsed);
      } catch {
        setPayments([]);
      }
    } else {
      setPayments([]);
    }
  };

  useEffect(() => {
    loadPayments();
    // Listen for storage changes from other tabs/windows
    const handler = (e: StorageEvent) => {
      if (e.key === 'puerto_habana_payments') {
        loadPayments();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return payments;
}
