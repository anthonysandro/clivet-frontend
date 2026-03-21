// src/app/dashboard/caja/cierre/page.tsx
//
// Página de cierre del día — solo Admin
// Muestra resumen por sede y medio de pago
// Permite cerrar manualmente y enviar por WhatsApp

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Lock, Send, Loader2, Banknote, CreditCard,
  Smartphone, CheckCircle2, MapPin, Calendar,
  FileText, AlertTriangle,
} from 'lucide-react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { dayCloseService, DayClose } from '@/services/dayCloseService';

import { BranchService, Branch } from '@/services/branchService';

export default function CierrePage() {

  const [authData,    setAuthData]    = useState<{ tenantId: string; role: string } | null>(null);
  const [branches,    setBranches]    = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateFilter,  setDateFilter]  = useState(() => new Date().toISOString().split('T')[0]);
  const [dayClose,    setDayClose]    = useState<DayClose | null>(null);
  const [isClosed,    setIsClosed]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [closing,     setClosing]     = useState(false);
  const [sending,     setSending]     = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────
  const loadAuth = useCallback(async () => {
    try {
      const session    = await fetchAuthSession();
      const attributes = await fetchUserAttributes();
      const tenantId   = (attributes['custom:tenantId'] as string) || '';
      const role       = ((attributes['custom:role'] as string) || '').toLowerCase();
      setAuthData({ tenantId, role });
      return { tenantId, role };
    } catch { return null; }
  }, []);

  // ── Cargar sedes ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const auth = await loadAuth();
      if (!auth) return;
      try {
        const data = await BranchService.getAll();
        setBranches(data);
        if (data.length > 0) setSelectedBranch(data[0].branchId!);
      } catch (err) {
        console.error('Error al cargar sedes:', err);
      }
    };
    load();
  }, [loadAuth]);

  // ── Cargar resumen del día ────────────────────────────────────────
  const loadClose = useCallback(async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const result = await dayCloseService.getOrPreview(selectedBranch, dateFilter);
      setDayClose(result.dayClose);
      setIsClosed(result.isClosed);
    } catch (err) {
      console.error('Error al cargar cierre:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, dateFilter]);

  useEffect(() => { loadClose(); }, [loadClose]);

  // ── Cerrar día manualmente ────────────────────────────────────────
  const handleClose = async () => {
    if (!confirm(`¿Confirmar cierre del día ${dateFilter} para ${dayClose?.branchName}?`)) return;
    setClosing(true);
    try {
      const closed = await dayCloseService.closeDay(selectedBranch, dateFilter);
      setDayClose(closed);
      setIsClosed(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cerrar el día');
    } finally {
      setClosing(false);
    }
  };

  // ── Enviar por WhatsApp ───────────────────────────────────────────
  const handleSendWhatsApp = async () => {
    if (!confirm('¿Enviar resumen del día al administrador por WhatsApp?')) return;
    setSending(true);
    try {
      await dayCloseService.sendWhatsApp(selectedBranch, dateFilter);
      alert('✅ Resumen enviado por WhatsApp');
      loadClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al enviar WhatsApp');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Lock size={24} className="text-indigo-600" /> Cierre del Día
          </h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de caja por sede y medio de pago</p>
        </div>
        {isClosed && dayClose && (
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm">
            <CheckCircle2 size={16} /> Día cerrado
            {dayClose.isAutomatic && <span className="text-xs font-normal ml-1">(automático)</span>}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-4 items-end text-left">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Sede</label>
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium min-w-[200px]"
          >
            {branches.map(b => (
              <option key={b.branchId} value={b.branchId!}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Fecha</label>
          <input
            type="date" value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-100 bg-gray-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : dayClose ? (
        <div className="space-y-6">

          {/* Totales por método */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Efectivo', value: dayClose.totals.efectivo, icon: <Banknote size={20} />, color: 'bg-green-50 text-green-700 border-green-100' },
              { label: 'Tarjeta',  value: dayClose.totals.tarjeta,  icon: <CreditCard size={20} />, color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { label: 'Yape',     value: dayClose.totals.yape,     icon: <Smartphone size={20} />, color: 'bg-purple-50 text-purple-700 border-purple-100' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className={`rounded-2xl border p-5 ${color}`}>
                <div className="flex items-center gap-2 mb-2 opacity-70">{icon}<span className="text-xs font-black uppercase tracking-wider">{label}</span></div>
                <p className="text-2xl font-black">S/ {value.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Total general */}
          <div className="bg-gray-900 text-white rounded-2xl p-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Total General</p>
              <p className="text-3xl font-black">S/ {dayClose.totalGeneral.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">{dayClose.ordersCount} órdenes pagadas</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin size={12} /> {dayClose.branchName}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <Calendar size={12} /> {dayClose.date}
              </div>
            </div>
          </div>

          {/* Detalle de órdenes */}
          {dayClose.ordersDetail.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b">
                <h3 className="font-black text-gray-700 uppercase text-sm tracking-tight flex items-center gap-2">
                  <FileText size={16} /> Detalle de órdenes
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {dayClose.ordersDetail.map((order, i) => (
                  <div key={i} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{order.clientName}</p>
                      <p className="text-xs text-gray-400 font-mono">{order.documentNumber} · {order.documentType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">S/ {order.total.toFixed(2)}</p>
                      <div className="flex gap-2 justify-end mt-1">
                        {order.payments.map((p, j) => (
                          <span key={j} className="text-[10px] text-gray-400 font-bold">
                            {p.method} S/{p.amount.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advertencia si no está cerrado */}
          {!isClosed && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 font-medium">
                Este es un <strong>preview en tiempo real</strong>. El cierre formal se realiza a las 8:00 PM automáticamente o puedes hacerlo manualmente.
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleSendWhatsApp}
              disabled={sending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-green-100 disabled:bg-gray-300"
            >
              {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Enviar por WhatsApp
            </button>

            {!isClosed && (
              <button
                onClick={handleClose}
                disabled={closing}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-100 disabled:bg-gray-300"
              >
                {closing ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
                Cerrar día manualmente
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Lock size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Selecciona una sede y fecha para ver el resumen.</p>
        </div>
      )}
    </div>
  );
}
