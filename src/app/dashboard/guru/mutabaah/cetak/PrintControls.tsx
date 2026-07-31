"use client";

import React from 'react';

export default function PrintControls() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-700">Pastikan data sudah sesuai sebelum mencetak.</span>
      <button
        onClick={handlePrint}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition shadow-sm"
      >
        🖨️ Cetak / Simpan PDF
      </button>
    </div>
  );
}
