// src/app/dashboard/caja/page.tsx
//
// Pantalla de caja — solo Counter y Admin
// Muestra servicios completados pendientes de cobro
// Permite agrupar en una orden y cobrar con pago mixto

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Plus, Search, Loader2, Receipt,
  CheckCircle2, XCircle, Banknote, CreditCard,
  Smartphone, MapPin, Clock, User, PawPrint,
} from 'lucide-react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { serviceRequestService } from '@/services/serviceRequestService';
import { saleOrderService, SaleOrder, OrderItem, CreateOrderDTO } from '@/services/saleOrderService';
import PaymentModal from '@/components/PaymentModal';

// ── Config de método de pago ──────────────────────────────────────────
const METHOD_ICON: Record<string, React.ReactNode> = {
  EFECTIVO: <Banknote   size={14} />,
  TARJETA:  <CreditCard size={14} />,
  YAPE:     <Smartphone size={14} />,
};

// ── Estado → color ────────────────────────────────────────────────────
const ORDER_STATUS_STYLE: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  PAGADO:    'bg-green-100 text-green-700',
  ANULADO:   'bg-gray-100 text-gray-500',
};

export default function CajaPage() {

  const [authData,    setAuthData]    = useState<{ tenantId: string; token: string; role: string; branchId: string } | null>(null);
  const [dateFilter,  setDateFilter]  = useState(() => new Date().toISOString().split('T')[0]);
  const [tab,         setTab]         = useState<'pendientes' | 'ordenes'>('pendientes');

  // Servicios completados sin cobrar
  const [completed,   setCompleted]   = useState<any[]>([]);
  // Órdenes del día
  const [orders,      setOrders]      = useState<SaleOrder[]>([]);
  const [loading,     setLoading]     = useState(false);

  // Selección para nueva orden
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [docType,     setDocType]     = useState<'BOLETA' | 'FACTURA'>('BOLETA');

  // Modal de pago
  const [payModal,    setPayModal]    = useState<{ open: boolean; order: SaleOrder | null }>({ open: false, order: null });

  // ── Auth ──────────────────────────────────────────────────────────
  const loadAuth = useCallback(async () => {
    try {
      const session    = await fetchAuthSession();
      const attributes = await fetchUserAttributes();
      const token      = session.tokens?.idToken?.toString() || '';
      const tenantId   = (attributes['custom:tenantId'] as string) || '';
      const role       = ((attributes['custom:role'] as string) || 'counter').toLowerCase();
      const branchId   = (attributes['custom:branchId'] as string) || '';
      setAuthData({ tenantId, token, role, branchId });
      return { tenantId, token, role, branchId };
    } catch { return null; }
  }, []);

  // ── Cargar datos ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    let auth = authData;
    if (!auth) auth = await loadAuth();
    if (!auth) return;

    setLoading(true);
    try {
      const [completedData, ordersData] = await Promise.all([
        // Servicios completados del día sin orden asignada
        serviceRequestService.search({ date: dateFilter, status: 'COMPLETADO' }),
        // Órdenes del día
        auth.branchId ? saleOrderService.list(auth.branchId, dateFilter) : Promise.resolve([]),
      ]);

      // Filtrar completados que no tienen orden aún
      const orderedRequestIds = new Set(
        ordersData.flatMap((o: SaleOrder) => o.items.map(i => i.requestId).filter(Boolean))
      );
      setCompleted(completedData.filter((r: any) => !orderedRequestIds.has(r.requestId)));
      setOrders(ordersData);
    } catch (err) {
      console.error('Error al cargar datos de caja:', err);
    } finally {
      setLoading(false);
    }
  }, [authData, dateFilter, loadAuth]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Selección de servicios ────────────────────────────────────────
  const toggleSelect = (requestId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(requestId) ? next.delete(requestId) : next.add(requestId);
      return next;
    });
  };

  // ── Crear orden con servicios seleccionados ───────────────────────
  const handleCreateOrder = async () => {
    if (selected.size === 0 || !authData) return;

    const selectedRequests = completed.filter(r => selected.has(r.requestId));
    if (selectedRequests.length === 0) return;

    // Todos deben ser del mismo cliente
    const clientIds = new Set(selectedRequests.map((r: any) => r.clientId));
    if (clientIds.size > 1) {
      alert('Solo puedes agrupar servicios del mismo cliente en una orden.');
      return;
    }

    const first = selectedRequests[0];
    const items: Omit<OrderItem, 'subtotal'>[] = selectedRequests.flatMap((r: any) =>
      (r.items || []).map((item: any) => ({
        requestId:   r.requestId,
        description: item.productName || item.description || 'Servicio',
        memberName:  item.memberName || item.petName,
        quantity:    1,
        unitPrice:   item.price || r.total || 0,
        discount:    item.discount || 0,
      }))
    );

    try {
      const dto: CreateOrderDTO = {
        branchId:     authData.branchId || first.branchId || '',
        branchName:   first.branchName || '',
        clientId:     first.clientId,
        clientName:   first.clientName,
        clientPhone:  first.clientPhone || '',
        documentType: docType,
        items,
      };
      const order = await saleOrderService.create(dto);
      setSelected(new Set());
      setPayModal({ open: true, order });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear la orden');
    }
  };

  // ── Resumen del día ───────────────────────────────────────────────
  const dayTotals = orders
    .filter(o => o.status === 'PAGADO')
    .reduce((acc, o) => {
      o.payments.forEach(p => {
        if (p.method === 'EFECTIVO') acc.efectivo += p.amount;
        if (p.method === 'TARJETA')  acc.tarjeta  += p.amount;
        if (p.method === 'YAPE')     acc.yape     += p.amount;
      });
      return acc;
    }, { efectivo: 0, tarjeta: 0, yape: 0 });

  const totalDay = dayTotals.efectivo + dayTotals.tarjeta + dayTotals.yape;

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={26} className="text-indigo-600" /> Caja
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cobros y órdenes de venta del día</p>
        </div>

        {/* Resumen rápido del día */}
        <div className="flex gap-3">
          {[
            { label: 'Efectivo', value: dayTotals.efectivo, icon: <Banknote size={14} />, color: 'text-green-600 bg-green-50' },
            { label: 'Tarjeta',  value: dayTotals.tarjeta,  icon: <CreditCard size={14} />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Yape',     value: dayTotals.yape,     icon: <Smartphone size={14} />, color: 'text-purple-600 bg-purple-50' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${color} font-bold text-sm`}>
              {icon} {label}: S/ {value.toFixed(2)}
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white font-black text-sm">
            Total: S/ {totalDay.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filtro de fecha */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Fecha</label>
          <input
            type="date" value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-100 bg-gray-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
        </div>
        <button onClick={loadData} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black transition">
          <Search size={16} /> Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        {[
          { key: 'pendientes', label: `Pendientes de cobro (${completed.length})` },
          { key: 'ordenes',    label: `Órdenes del día (${orders.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${tab === t.key ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
      ) : tab === 'pendientes' ? (

        // ── TAB: Servicios pendientes de cobro ──────────────────────
        <div className="space-y-4">
          {/* Barra de acción cuando hay selección */}
          {selected.size > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-sm font-bold text-indigo-700">
                {selected.size} servicio(s) seleccionado(s)
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value as any)}
                  className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-700 outline-none"
                >
                  <option value="BOLETA">Boleta</option>
                  <option value="FACTURA">Factura</option>
                </select>
                <button
                  onClick={handleCreateOrder}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                  <Receipt size={16} /> Crear orden y cobrar
                </button>
              </div>
            </div>
          )}

          {completed.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No hay servicios completados pendientes de cobro.</p>
            </div>
          ) : (
            completed.map((req: any) => (
              <div
                key={req.requestId}
                onClick={() => toggleSelect(req.requestId)}
                className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${
                  selected.has(req.requestId)
                    ? 'border-indigo-400 shadow-md shadow-indigo-50 bg-indigo-50/30'
                    : 'border-gray-100 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Checkbox visual */}
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected.has(req.requestId) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}>
                      {selected.has(req.requestId) && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{req.clientName}</span>
                        {req.branchName && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={10} /> {req.branchName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Clock size={11} /> {req.timeSlot}
                        <span className="mx-1">·</span>
                        <span>{req.clientPhone}</span>
                      </div>
                      {req.items?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-1 text-sm text-gray-600">
                          <PawPrint size={12} className="text-gray-400" />
                          <span className="font-medium">{item.memberName || item.petName}</span>
                          <span className="text-gray-400">—</span>
                          <span>{item.productName || item.description}</span>
                          <span className="text-gray-400 ml-1">S/ {item.price?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className="font-black text-gray-900 text-lg">S/ {req.total?.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

      ) : (

        // ── TAB: Órdenes del día ──────────────────────────────────────
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Receipt size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No hay órdenes para esta fecha.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="p-5">Documento</th>
                    <th className="p-5">Cliente</th>
                    <th className="p-5">Servicios</th>
                    <th className="p-5 text-center">Pagos</th>
                    <th className="p-5 text-center">Total</th>
                    <th className="p-5 text-center">Estado</th>
                    <th className="p-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <tr key={order.orderId} className="hover:bg-gray-50/30 transition">
                      <td className="p-5">
                        <p className="font-mono text-xs text-indigo-600 font-bold">{order.documentNumber}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{order.documentType}</p>
                      </td>
                      <td className="p-5">
                        <p className="font-bold text-gray-800">{order.clientName}</p>
                        <p className="text-xs text-gray-400">{order.clientPhone}</p>
                      </td>
                      <td className="p-5">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            {item.memberName && <span className="text-gray-400">🐾 {item.memberName} — </span>}
                            {item.description}
                          </p>
                        ))}
                      </td>
                      <td className="p-5 text-center">
                        {order.payments.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {order.payments.map((p, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs font-bold text-gray-600">
                                {METHOD_ICON[p.method]} S/ {p.amount.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="p-5 text-center font-black text-gray-900">
                        S/ {order.total.toFixed(2)}
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ORDER_STATUS_STYLE[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          {order.status === 'PENDIENTE' && (
                            <>
                              <button
                                onClick={() => setPayModal({ open: true, order })}
                                className="bg-green-500 hover:bg-green-600 text-white h-9 w-9 rounded-xl flex items-center justify-center transition shadow-md shadow-green-100"
                                title="Cobrar"
                              >
                                <Receipt size={16} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('¿Anular esta orden?')) return;
                                  await saleOrderService.cancel(order.orderId, 'Anulado por operador');
                                  loadData();
                                }}
                                className="bg-red-100 hover:bg-red-200 text-red-500 h-9 w-9 rounded-xl flex items-center justify-center transition"
                                title="Anular"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de pago */}
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
