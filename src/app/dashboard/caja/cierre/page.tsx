'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Send, Loader2, Banknote, CreditCard, Smartphone, CheckCircle2, MapPin, Calendar, FileText, AlertTriangle, Receipt } from 'lucide-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { dayCloseService, DayClose } from '@/services/dayCloseService';
import { BranchService, Branch } from '@/services/branchService';

export default function CierrePage() {
  const [authData, setAuthData] = useState<{ role: string; branchId: string } | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [dayClose, setDayClose] = useState<DayClose | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const init = async () => {
      const attrs = await fetchUserAttributes();
      const bId = (attrs['custom:branchId'] as string) || '';
      const role = ((attrs['custom:role'] as string) || '').toLowerCase();
      setAuthData({ role, branchId: bId });
      setSelectedBranch(bId);

      const list = await BranchService.getAll();
      setBranches(list.filter(b => b.isActive));
    };
    init();
  }, []);

  const loadClose = useCallback(async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const result = await dayCloseService.getOrPreview(selectedBranch, dateFilter);
      setDayClose(result.dayClose);
      setIsClosed(result.isClosed);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [selectedBranch, dateFilter]);

  useEffect(() => { loadClose(); }, [loadClose]);

  const handleClose = async () => {
    if (!confirm(`¿Cerrar caja definitivamente para ${dayClose?.branchName}?`)) return;
    setClosing(true);
    try {
      const closed = await dayCloseService.closeDay(selectedBranch, dateFilter);
      setDayClose(closed);
      setIsClosed(true);
      alert("✅ Caja cerrada con éxito.");
    } catch (err) { alert("Error al cerrar."); } finally { setClosing(false); }
  };

  const handleSendWhatsApp = async () => {
    setSending(true);
    try {
      await dayCloseService.sendWhatsApp(selectedBranch, dateFilter);
      alert('✅ Resumen enviado al administrador');
    } catch (e) { alert('Error al enviar WhatsApp'); } finally { setSending(false); }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-left">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
            <Lock size={32} className="text-indigo-600" strokeWidth={3} /> Cierre Contable
          </h1>
          <p className="text-gray-500 font-medium italic mt-1">Liquidación final de ingresos por sede</p>
        </div>
        {isClosed && (
          <div className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 animate-in zoom-in">
            <CheckCircle2 size={16} /> Caja Liquidada
          </div>
        )}
      </header>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seleccionar Sede</label>
          <select 
            disabled={authData?.role !== 'admin'}
            value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
            className="border-none bg-gray-50 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 min-w-[240px]"
          >
            {branches.map(b => <option key={b.branchId} value={b.branchId!}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Auditoría</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border-none bg-gray-50 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {loading ? (
        <div className="p-32 text-center flex flex-col items-center gap-4">
           <Loader2 className="animate-spin text-indigo-200" size={64} />
           <p className="font-black text-gray-300 uppercase tracking-widest text-xs">Audidando Ventas...</p>
        </div>
      ) : dayClose ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Efectivo', value: dayClose.totals.efectivo, icon: <Banknote size={24} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { label: 'Tarjeta', value: dayClose.totals.tarjeta, icon: <CreditCard size={24} />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'Yape', value: dayClose.totals.yape, icon: <Smartphone size={24} />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
              { label: 'Transferencia', value: dayClose.totals.transferencia || 0, icon: <Receipt size={24} />, color: 'bg-orange-50 text-orange-600 border-orange-100' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className={`rounded-[2rem] border-2 p-6 transition-all hover:scale-105 ${color}`}>
                <div className="flex items-center gap-2 mb-3 opacity-60 font-black uppercase text-[10px] tracking-[0.2em]">{icon} {label}</div>
                <p className="text-3xl font-black tracking-tighter">S/ {value.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 text-white rounded-[3rem] p-10 flex flex-col md:flex-row justify-between items-center shadow-2xl">
             <div className="text-center md:text-left mb-6 md:mb-0">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Ingreso Total Consolidado</p>
                <p className="text-6xl font-black tracking-tighter italic">S/ {dayClose.totalGeneral.toFixed(2)}</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 px-6 py-4 rounded-2xl text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{dayClose.ordersCount}</p>
                   <p className="text-xs font-bold">Ventas</p>
                </div>
                <button onClick={handleSendWhatsApp} disabled={sending} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all active:scale-95 disabled:bg-gray-700">
                   {sending ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Reportar
                </button>
             </div>
          </div>

          {!isClosed ? (
            <div className="flex items-center justify-between p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 border-dashed">
               <div className="flex gap-4 items-center text-amber-700">
                  <AlertTriangle size={32} />
                  <div>
                    <p className="font-black uppercase text-sm">Caja abierta (Preview)</p>
                    <p className="text-xs font-medium">Los montos pueden cambiar si se realizan nuevas ventas.</p>
                  </div>
               </div>
               <button onClick={handleClose} disabled={closing} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 flex items-center gap-3 hover:bg-indigo-700 active:scale-95 disabled:bg-gray-400">
                  {closing ? <Loader2 className="animate-spin" size={20}/> : <Lock size={20}/>} Realizar Cierre Final
               </button>
            </div>
          ) : (
            <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100">
               <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-widest mb-6">Auditoría de Cierre</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-bold text-gray-600">
                  <div className="flex flex-col"><span className="text-[9px] text-gray-400 font-black uppercase">Responsable</span> {dayClose.closedBy}</div>
                  <div className="flex flex-col"><span className="text-[9px] text-gray-400 font-black uppercase">Fecha Hora</span> {new Date(dayClose.closedAt).toLocaleString()}</div>
                  <div className="flex flex-col"><span className="text-[9px] text-gray-400 font-black uppercase">Sede</span> {dayClose.branchName}</div>
                  <div className="flex flex-col"><span className="text-[9px] text-gray-400 font-black uppercase">Modo</span> {dayClose.isAutomatic ? 'Automático (Cron)' : 'Manual (Web)'}</div>
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-300">
          <FileText size={64} className="mx-auto mb-4 opacity-10" />
          <p className="font-black uppercase tracking-widest text-sm italic text-gray-400">No hay datos de facturación para la selección actual</p>
        </div>
      )}
    </div>
  );
}