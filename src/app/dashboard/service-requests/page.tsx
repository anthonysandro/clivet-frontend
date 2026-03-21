"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, CheckCircle, Calendar, User, PawPrint, CheckCircle2, Loader2 } from "lucide-react";
import { serviceRequestService } from "@/services/serviceRequestService";
import NewServiceRequestModal from "@/components/NewServiceRequestModal";
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

export default function ServiceRequestsPage() {
  // --- Estados de Auth ---
  const [authData, setAuthData] = useState<{ tenantId: string; token: string } | null>(null);

  // --- Estados de los Filtros ---
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [petFilter, setPetFilter] = useState("");

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Cargar contexto de Auth dinámico
  const loadAuthContext = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const attributes = await fetchUserAttributes();
      
      const token = session.tokens?.idToken?.toString() || "";
      const tenantId = attributes['custom:tenantId'] as string || "";

      setAuthData({ tenantId, token });
      return { tenantId, token };
    } catch (error) {
      console.error("Error al obtener contexto de usuario:", error);
      return null;
    }
  }, []);

  // 2. Función única para buscar (Corregida sin duplicados)
  const fetchRequests = useCallback(async () => {
    let currentAuth = authData;
    
    if (!currentAuth) {
      currentAuth = await loadAuthContext();
    }

    if (!currentAuth?.tenantId) return;

    setLoading(true);
    try {
      // ✅ Llamada corregida: Pasamos los parámetros directos según el servicio
      const data = await serviceRequestService.search({
        date: dateFilter,
        status: statusFilter,
        searchName: clientFilter.toLowerCase(),
        searchPets: petFilter.toLowerCase()
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

  // 3. Función única para completar (Corregida sin duplicados)
  const handleComplete = async (requestId: string) => {
    if (!authData) return;
    if (!confirm("¿Confirmar que el servicio terminó? Se enviará un WhatsApp al cliente.")) return;
    
    try {
      // ✅ Llamada corregida: 2 argumentos separados (ID y Status)
      await serviceRequestService.updateStatus(requestId, "COMPLETADO");
      
      alert("✅ ¡Servicio completado y WhatsApp enviado!");
      fetchRequests(); 
    } catch (error) {
      console.error("Error al completar:", error);
      alert("Error al intentar completar el servicio.");
    }
  };

  if (!authData && loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6 text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Citas y Pedidos</h1>
          <p className="text-sm text-gray-500 italic">Contexto: {authData?.tenantId ? 'Tenant Activo' : 'Cargando sesión...'}</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95 font-bold"
        >
          <Plus size={20} />
          <span>Nueva Cita</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4 items-end text-left">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fecha</label>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full border border-gray-100 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Estado</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-100 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="AGENDADO">Agendado</option>
            <option value="COMPLETADO">Completado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cliente</label>
          <input 
            type="text" 
            placeholder="Anthony..."
            value={clientFilter} 
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full border border-gray-100 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Mascota</label>
          <input 
            type="text" 
            placeholder="King..."
            value={petFilter} 
            onChange={(e) => setPetFilter(e.target.value)}
            className="w-full border border-gray-100 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button 
          onClick={fetchRequests}
          className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl flex items-center gap-2 transition-all font-bold shadow-md"
        >
          <Search size={18} />
          <span>Filtrar</span>
        </button>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden text-left">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-3 italic text-gray-400">
             <Loader2 className="animate-spin" size={32} />
             Sincronizando datos...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-20 text-center text-gray-400 font-medium">No se encontraron citas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                  <th className="p-6">Hora</th>
                  <th className="p-6">Propietario</th>
                  <th className="p-6">Detalle Médico</th>
                  <th className="p-6 text-center">Inversión</th>
                  <th className="p-6 text-center">Estado</th>
                  <th className="p-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {requests.map((req) => (
                  <tr key={req.requestId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 font-bold text-blue-600">{req.timeSlot}</td>
                    <td className="p-6">
                      <div className="font-bold">{req.clientName}</div>
                      <div className="text-xs text-gray-400">{req.clientPhone}</div>
                    </td>
                    <td className="p-6">
                      {req.items?.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 font-medium tracking-tight">• {item.petName} ({item.description})</div>
                      ))}
                    </td>
                    <td className="p-6 text-center font-black text-gray-900">S/ {req.total?.toFixed(2)}</td>
                    <td className="p-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        req.requestStatus === 'COMPLETADO' ? 'bg-green-100 text-green-700' :
                        req.requestStatus === 'AGENDADO' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {req.requestStatus}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {req.requestStatus !== 'COMPLETADO' && (
                        <button 
                          onClick={() => handleComplete(req.requestId)}
                          className="bg-green-500 hover:bg-green-600 text-white h-10 w-10 rounded-xl flex items-center justify-center ml-auto active:scale-90 transition-all shadow-md shadow-green-100"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewServiceRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchRequests}
        tenantId={authData?.tenantId || ""}
        token={authData?.token || ""}
      />
    </div>
  );
}