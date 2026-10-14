'use client';
import { Printer } from 'lucide-react';

export default function PrintButton({ className = 'btn-primary', label = 'Cetak Tiket' }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
