"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, Plus, Calendar, User, Loader2, 
  CheckCircle2, MapPin, Receipt, Clock, FilterX 
} from "lucide-react";
import { serviceRequestService, ServiceRequest } from "@/services/serviceRequestService";
import NewServiceRequestModal from "@/components/NewServiceRequestModal";
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

export default function ServiceRequestsPage() {
  // --- Estados de Auth y Sede ---
  const [authData, setAuthData] = useState<{ tenantId: string; branchId: string; token: string } | null>(null);

  // --- Estados de los Filtros ---
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [petFilter, setPetFilter] = useState("");

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Cargar contexto de Auth y Sede asignada
  const loadAuthContext = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const attributes = await fetchUserAttributes();
      
      const token = session.tokens?.idToken?.toString() || "";
      const tenantId = attributes['custom:tenantId'] as string || "";
      const branchId = attributes['custom:branchId'] as string || ""; // ✅ Sede del usuario

      const data = { tenantId, branchId, token };
      setAuthData(data);
      return data;
    } catch (error) {
      console.error("Error al obtener contexto de usuario:", error);
      return null;
    }
  }, []);

  // 2. Fetch de solicitudes segmentado por Sede
  const fetchRequests = useCallback(async () => {
    let currentAuth = authData;
    if (!currentAuth) currentAuth = await loadAuthContext();
    if (!currentAuth?.tenantId) return;

    setLoading(true);
    try {
      const data = await serviceRequestService.search({
        date: dateFilter,
        status: statusFilter,
        searchName: clientFilter,
        searchPets: petFilter,
        branchId: currentAuth.branchId // ✅ Filtro automático por sede
      });
      setRequests(data);
    } catch (error) {
      console.error("Error al cargar citas:", error);
    } finally {
      setLoading(false);
    }
  }, [authData, dateFilter, statusFilter, clientFilter, petFilter, loadAuthContext]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 3. Marcar como completado (Listo para cobro)
  const handleComplete = async (requestId: string) => {
    if (!confirm("¿Confirmar que el servicio terminó? Esto habilitará el cobro en caja.")) return;
    
    try {
      await serviceRequestService.updateStatus(requestId, "COMPLETED");
      alert("✅ ¡Servicio marcado como completado!");
      fetchRequests(); 
    } catch (error) {
      console.error("Error al completar:", error);
      alert("Error al intentar actualizar el estado.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'PAID':      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default:          return 'bg-blue-100 text-blue-700 border-blue-200'; // PENDING
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-left">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
             <Receipt className="text-indigo-600" size={32} /> Citas y Servicios
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <MapPin size={14} className="text-orange-500" />
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                Sede: {authData?.branchId || 'Cargando...'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-indigo-100 font-black uppercase text-[10px] tracking-[0.2em] active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Nueva Cita
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl p-3 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl p-3 font-bold text-gray-700 outline-none cursor-pointer">
            <option value="">TODOS</option>
            <option value="PENDING">PENDIENTE</option>
            <option value="COMPLETED">POR COBRAR</option>
            <option value="PAID">PAGADO</option>
            <option value="CANCELLED">CANCELADO</option>
          </select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Buscar (Cliente / Mascota)</label>
          <div className="flex gap-2">
            <input type="text" placeholder="Anthony o King..." value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-xl p-3 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <button onClick={fetchRequests} className="bg-gray-900 hover:bg-black text-white p-3.5 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg">
          <Search size={18} /> Filtrar
        </button>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-32 text-center flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-indigo-200" size={64} />
             <p className="font-black text-gray-300 uppercase tracking-[0.3em] text-xs">Sincronizando Agenda...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-32 text-center space-y-4">
             <FilterX className="mx-auto text-gray-100" size={80} />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No se encontraron registros en esta sede.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                  <th className="p-8">Horario</th>
                  <th className="p-8">Propietario</th>
                  <th className="p-8">Detalle del Servicio</th>
                  <th className="p-8 text-center">Inversión</th>
                  <th className="p-8 text-center">Estado</th>
                  <th className="p-8 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((req) => (
                  <tr key={req.requestId} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="p-8">
                      <div className="flex items-center gap-2 text-indigo-600 font-black">
                        <Clock size={14} strokeWidth={3} />
                        {req.timeSlot}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="font-black text-gray-800 text-base">{req.clientName}</div>
                      <div className="text-[10px] font-bold text-gray-400 tracking-tight">{req.clientPhone}</div>
                    </td>
                    <td className="p-8">
                      <div className="space-y-1">
                        {req.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                            <span className="text-indigo-600 uppercase text-[10px]">{item.petName}:</span> {item.description}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-8 text-center font-black text-gray-900 text-lg tracking-tighter">
                      S/ {req.totalAmount?.toFixed(2)}
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase border ${getStatusBadge(req.status)}`}>
                        {req.status === 'COMPLETED' ? 'TERMINADO' : 
                         req.status === 'PAID' ? 'PAGADO' : 
                         req.status === 'CANCELLED' ? 'ANULADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="p-8 text-right">
                      {req.status === 'PENDING' && (
                        <button 
                          onClick={() => handleComplete(req.requestId)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white h-12 w-12 rounded-2xl flex items-center justify-center ml-auto active:scale-90 transition-all shadow-lg shadow-emerald-100"
                          title="Marcar como Terminado"
                        >
                          <CheckCircle2 size={24} />
                        </button>
                      )}
                      {req.status === 'COMPLETED' && (
                         <div className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Esperando Cobro</div>
                      )}
                      {req.status === 'PAID' && (
                         <CheckCircle2 size={24} className="text-emerald-500 ml-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PARA AGENDAR */}
      <NewServiceRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchRequests}
        tenantId={authData?.tenantId || ""}
        branchId={authData?.branchId} // ✅ Pasamos la sede actual al modal
      />
    </div>
  );
}