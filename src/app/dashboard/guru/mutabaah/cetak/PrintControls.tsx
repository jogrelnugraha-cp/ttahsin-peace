"use client";

import React from 'react';

export default function PrintControls() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="mb-6 flex justify-between items-center print:hidden bg-slate-100 p-4 rounded-lg">
      <span className="text-sm text-slate-700">Pastikan data sudah sesuai sebelum mencetak.</span>
      <button
        onClick={handlePrint}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
      >
        🖨️ Cetak / Simpan PDF
      </button>
    </div>
  );
}
