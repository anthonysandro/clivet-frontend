'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Plus, Search, Loader2, Receipt,
  CheckCircle2, XCircle, Banknote, CreditCard,
  Smartphone, MapPin, Clock, User, PawPrint, FilterX
} from 'lucide-react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { serviceRequestService } from '@/services/serviceRequestService';
import { saleOrderService, SaleOrder, OrderItem, CreateOrderDTO } from '@/services/saleOrderService';
import { BranchService, Branch } from '@/services/branchService';
import PaymentModal from '@/components/PaymentModal';

const METHOD_ICON: Record<string, React.ReactNode> = {
  EFECTIVO: <Banknote size={14} />,
  TARJETA: <CreditCard size={14} />,
  YAPE: <Smartphone size={14} />,
  TRANSFERENCIA: <Receipt size={14} />,
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-600 border-amber-100',
  PAGADO: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  ANULADO: 'bg-gray-50 text-gray-400 border-gray-100',
};

export default function CajaPage() {
  const [authData, setAuthData] = useState<{ tenantId: string; role: string; branchId: string } | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [tab, setTab] = useState<'pendientes' | 'ordenes'>('pendientes');

  const [completed, setCompleted] = useState<any[]>([]);
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [docType, setDocType] = useState<'BOLETA' | 'FACTURA' | 'NOTA_VENTA'>('NOTA_VENTA');

  const [payModal, setPayModal] = useState<{ open: boolean; order: SaleOrder | null }>({ open: false, order: null });

  const loadAuthAndSedes = useCallback(async () => {
    try {
      const attributes = await fetchUserAttributes();
      const role = ((attributes['custom:role'] as string) || 'counter').toLowerCase();
      const branchId = (attributes['custom:branchId'] as string) || '';
      
      setAuthData({ tenantId: attributes['custom:tenantId'] as string, role, branchId });
      setSelectedBranch(branchId);

      const branchList = await BranchService.getAll();
      setBranches(branchList.filter(b => b.isActive));
    } catch (e) { console.error(e); }
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const [completedData, ordersData] = await Promise.all([
        serviceRequestService.search({ branchId: selectedBranch, date: dateFilter, status: 'COMPLETED' }),
        saleOrderService.list({ branchId: selectedBranch, date: dateFilter })
      ]);
      setCompleted(completedData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, dateFilter]);

  useEffect(() => { loadAuthAndSedes(); }, [loadAuthAndSedes]);
  useEffect(() => { loadData(); }, [loadData]);

  const toggleSelect = (requestId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(requestId)) next.delete(requestId);
      else {
        const item = completed.find(r => r.requestId === requestId);
        const firstSelected = completed.find(r => prev.has(r.requestId));
        if (firstSelected && item.clientId !== firstSelected.clientId) {
          alert("Solo puedes agrupar servicios del mismo cliente.");
          return prev;
        }
        next.add(requestId);
      }
      return next;
    });
  };

  const handleCreateOrder = async () => {
    if (selected.size === 0 || !authData) return;
    const selectedRequests = completed.filter(r => selected.has(r.requestId));
    const first = selectedRequests[0];
    const branch = branches.find(b => b.branchId === selectedBranch);

    const items = selectedRequests.flatMap((r: any) =>
      (r.items || []).map((item: any) => ({
        requestId: r.requestId,
        description: item.description,
        memberName: item.petName,
        quantity: 1,
        unitPrice: item.price,
        discount: item.discount || 0,
      }))
    );

    try {
      const order = await saleOrderService.create({
        branchId: selectedBranch,
        branchName: branch?.name || '',
        clientId: first.clientId,
        clientName: first.clientName,
        clientPhone: first.clientPhone,
        documentType: docType as any,
        items
      });
      setSelected(new Set());
      setPayModal({ open: true, order });
      loadData();
    } catch (err) { alert("Error al crear la orden."); }
  };

  const dayTotals = orders.filter(o => o.status === 'PAGADO').reduce((acc, o) => {
    o.payments?.forEach(p => {
      const m = p.method.toLowerCase();
      if (acc[m] !== undefined) acc[m] += p.amount;
    });
    return acc;
  }, { efectivo: 0, tarjeta: 0, yape: 0, transferencia: 0 } as any);

  const totalDay = Object.values(dayTotals).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-left">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
            <ShoppingCart className="text-indigo-600" size={32} /> Terminal de Caja
          </h1>
          <p className="text-gray-500 font-medium italic">Liquida servicios y gestiona ventas por sede</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Caja Total del Día</p>
            <p className="text-2xl font-black text-indigo-600 tracking-tighter">S/ {totalDay.toFixed(2)}</p>
          </div>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sede Actual</label>
          <select 
            disabled={authData?.role !== 'admin'}
            value={selectedBranch} 
            onChange={e => setSelectedBranch(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl p-3 font-bold text-gray-700 outline-none"
          >
            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Operación</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl p-3 font-bold text-gray-700 outline-none" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl md:col-span-2">
           <button onClick={() => setTab('pendientes')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'pendientes' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Pendientes ({completed.length})</button>
           <button onClick={() => setTab('ordenes')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'ordenes' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Ventas ({orders.length})</button>
        </div>
      </div>

      {tab === 'pendientes' ? (
        <div className="space-y-4">
          {selected.size > 0 && (
            <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl shadow-indigo-100 flex items-center justify-between text-white animate-in slide-in-from-top-4">
              <div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Cobro Agrupado</p>
                <p className="text-xl font-black">{selected.size} Servicios seleccionados</p>
              </div>
              <div className="flex items-center gap-4">
                <select value={docType} onChange={e => setDocType(e.target.value as any)} className="bg-white/20 border-none rounded-xl px-4 py-3 text-sm font-black outline-none cursor-pointer">
                  <option value="NOTA_VENTA" className="text-gray-800">Nota de Venta</option>
                  <option value="BOLETA" className="text-gray-800">Boleta</option>
                  <option value="FACTURA" className="text-gray-800">Factura</option>
                </select>
                <button onClick={handleCreateOrder} className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-2">
                   <Receipt size={18}/> Generar Orden
                </button>
              </div>
            </div>
          )}

          {completed.length === 0 ? (
             <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
                <CheckCircle2 size={64} className="mx-auto text-gray-100 mb-4" />
                <p className="font-black text-gray-300 uppercase tracking-widest">No hay servicios pendientes</p>
             </div>
          ) : (
            completed.map((req) => (
              <div key={req.requestId} onClick={() => toggleSelect(req.requestId)} className={`bg-white p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex justify-between items-center ${selected.has(req.requestId) ? 'border-indigo-500 bg-indigo-50/30 shadow-lg shadow-indigo-100' : 'border-gray-100 hover:border-indigo-200'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-6 h-6 rounded-full border-4 transition-all ${selected.has(req.requestId) ? 'border-indigo-500 bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' : 'border-gray-200'}`} />
                  <div>
                    <p className="font-black text-gray-800 text-lg uppercase tracking-tight">{req.clientName}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Clock size={12}/> {req.timeSlot}</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest"><PawPrint size={12}/> {req.items[0]?.petName}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Por cobrar</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tighter">S/ {req.totalAmount?.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
              <tr>
                <th className="p-6">Documento</th>
                <th className="p-6">Cliente</th>
                <th className="p-6">Detalle</th>
                <th className="p-6 text-center">Total</th>
                <th className="p-6 text-center">Estado</th>
                <th className="p-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order.orderId} className="hover:bg-gray-50/50 transition-all group">
                  <td className="p-6">
                    <p className="font-black text-indigo-600 text-xs tracking-widest uppercase">{order.documentNumber || 'SIN NUM.'}</p>
                    <p className="text-[9px] font-bold text-gray-400">{order.documentType}</p>
                  </td>
                  <td className="p-6">
                    <p className="font-black text-gray-800 uppercase text-xs">{order.clientName}</p>
                    <p className="text-[10px] font-bold text-gray-400">{order.clientPhone}</p>
                  </td>
                  <td className="p-6">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">• {item.description}</p>
                    ))}
                  </td>
                  <td className="p-6 text-center font-black text-gray-900 text-base">S/ {order.total.toFixed(2)}</td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${ORDER_STATUS_STYLE[order.status]}`}>{order.status}</span>
                  </td>
                  <td className="p-6 text-right">
                    {order.status === 'PENDIENTE' && (
                      <button onClick={() => setPayModal({ open: true, order })} className="bg-emerald-500 text-white p-2.5 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-90"><Receipt size={18}/></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {payModal.order && (
        <PaymentModal
          isOpen={payModal.open}
          onClose={() => setPayModal({ open: false, order: null })}
          onSuccess={() => { setPayModal({ open: false, order: null }); loadData(); }}
          order={payModal.order}
        />
      )}
    </div>
  );
}