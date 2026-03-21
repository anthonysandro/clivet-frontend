// src/components/PaymentModal.tsx
//
// Modal de cobro con soporte de pago mixto:
//   Efectivo + Tarjeta + Yape en cualquier combinación
// Valida que la suma de pagos = total de la orden

'use client';

import { useState } from 'react';
import { X, Save, Loader2, Plus, Trash2, CreditCard, Banknote, Smartphone, Receipt } from 'lucide-react';
import { saleOrderService, PaymentLine, PaymentMethod, SaleOrder } from '@/services/saleOrderService';

interface PaymentModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  onSuccess: (order: SaleOrder) => void;
  order:     SaleOrder;
}

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string }> = {
  EFECTIVO: { label: 'Efectivo',   icon: <Banknote   size={16} />, color: 'bg-green-100 text-green-700 border-green-200'  },
  TARJETA:  { label: 'Tarjeta',    icon: <CreditCard size={16} />, color: 'bg-blue-100 text-blue-700 border-blue-200'     },
  YAPE:     { label: 'Yape',       icon: <Smartphone size={16} />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export default function PaymentModal({ isOpen, onClose, onSuccess, order }: PaymentModalProps) {

  const [payments,    setPayments]    = useState<PaymentLine[]>([{ method: 'EFECTIVO', amount: order.total }]);
  const [submitting,  setSubmitting]  = useState(false);

  if (!isOpen) return null;

  const totalPaid  = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const difference = parseFloat((order.total - totalPaid).toFixed(2));
  const isValid    = Math.abs(difference) <= 0.01;

  const addPayment = () => {
    const used    = payments.map(p => p.method);
    const methods = (['EFECTIVO', 'TARJETA', 'YAPE'] as PaymentMethod[]).filter(m => !used.includes(m));
    if (methods.length === 0) return;
    setPayments(prev => [...prev, { method: methods[0], amount: parseFloat(difference.toFixed(2)) }]);
  };

  const removePayment = (idx: number) => {
    if (payments.length === 1) return;
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, field: 'method' | 'amount', value: any) => {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : p));
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const updated = await saleOrderService.pay(order.orderId, payments);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              <Receipt size={20} className="text-indigo-600" /> Registrar Pago
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{order.clientName} — {order.documentType}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* Total de la orden */}
          <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total a cobrar</span>
            <span className="text-2xl font-black text-gray-900">S/ {order.total.toFixed(2)}</span>
          </div>

          {/* Líneas de pago */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medios de pago</p>
            {payments.map((payment, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                {/* Selector de método */}
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold min-w-[110px] ${METHOD_CONFIG[payment.method].color}`}>
                  {METHOD_CONFIG[payment.method].icon}
                  <select
                    value={payment.method}
                    onChange={e => updatePayment(idx, 'method', e.target.value)}
                    className="bg-transparent outline-none cursor-pointer font-bold"
                  >
                    {(['EFECTIVO', 'TARJETA', 'YAPE'] as PaymentMethod[]).map(m => (
                      <option key={m} value={m}>{METHOD_CONFIG[m].label}</option>
                    ))}
                  </select>
                </div>

                {/* Monto */}
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payment.amount || ''}
                    onChange={e => updatePayment(idx, 'amount', e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {/* Eliminar */}
                {payments.length > 1 && (
                  <button
                    onClick={() => removePayment(idx)}
                    className="p-2 text-gray-300 hover:text-red-400 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            {/* Agregar método */}
            {payments.length < 3 && (
              <button
                onClick={addPayment}
                className="flex items-center gap-2 text-xs text-indigo-500 hover:text-indigo-700 font-bold transition"
              >
                <Plus size={14} /> Agregar otro medio de pago
              </button>
            )}
          </div>

          {/* Resumen de diferencia */}
          <div className={`rounded-2xl p-4 flex justify-between items-center ${isValid ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className={`text-sm font-bold ${isValid ? 'text-green-600' : 'text-red-500'}`}>
              {isValid ? '✅ Pago completo' : difference > 0 ? `⚠️ Faltan S/ ${difference.toFixed(2)}` : `⚠️ Exceso S/ ${Math.abs(difference).toFixed(2)}`}
            </span>
            <span className={`text-lg font-black ${isValid ? 'text-green-700' : 'text-red-600'}`}>
              S/ {totalPaid.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !isValid}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 disabled:bg-gray-300 transition shadow-lg shadow-indigo-100"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Confirmar Pago</>}
          </button>
        </div>
      </div>
    </div>
  );
}
