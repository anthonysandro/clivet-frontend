'use client';

import { useState, useEffect, useMemo } from "react";
import { X, Save, Search, User, Check, Tag, Loader2, ChevronRight, LayoutGrid } from "lucide-react";
import { serviceRequestService } from "@/services/serviceRequestService";
import { ClientService, Pet } from "@/services/clientService"; // ✅ Importamos Pet
import { ConfigService, ServiceType, ServiceCategory } from "@/services/configService";
import { Product } from "@/services/productService";
import api from "@/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string; 
  token: string;    
}

const TIME_SLOTS = ["09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM", "04:00 PM - 05:00 PM"];

export default function NewServiceRequestModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  // Estados Clientes/Mascotas
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [pets, setPets] = useState<Pet[]>([]); // ✅ Usando interfaz Pet
  const [selectedPetId, setSelectedPetId] = useState("");

  // Estados Jerarquía de Producto
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [price, setPrice] = useState<number>(0);

  // Estados Cita
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);

  // 1. Carga Inicial: Filtramos solo productos WEB
  useEffect(() => {
    if (!isOpen) return;
    const loadInitial = async () => {
      try {
        const [prodRes, typeRes] = await Promise.all([
          api.get("/products"),
          ConfigService.getServiceTypes()
        ]);
        const prods = prodRes.data.items || prodRes.data;
        // ✅ REGLA: Solo productos Activos y con canal WEB
        setAllProducts(prods.filter((p: Product) => p.isActive && p.bookingChannels?.includes('WEB')));
        setServiceTypes(typeRes.filter(t => t.isActive));
      } catch (error) { console.error(error); }
    };
    loadInitial();
  }, [isOpen]);

  // 2. REGLA: Al cambiar Tipo, cargar Categorías
  useEffect(() => {
    if (!selectedTypeId) { setCategories([]); return; }
    ConfigService.getCategories(selectedTypeId).then(res => {
      setCategories(res.filter(c => c.isActive));
      setSelectedCategoryId(""); 
      setSelectedProductId("");
    });
  }, [selectedTypeId]);

  // 3. REGLA: Filtrar productos por Categoría
  const filteredProducts = useMemo(() => 
    allProducts.filter(p => p.categoryId === selectedCategoryId),
  [allProducts, selectedCategoryId]);

  const handleSearchClient = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await ClientService.search(searchQuery);
      setSearchResults(res);
    } catch (e) { console.error(e); } finally { setIsSearching(false); }
  };

  const handleSelectClient = async (client: any) => {
    setSelectedClient(client);
    setSearchResults([]); 
    try {
      const clientPets = await ClientService.getPets(client.clientId);
      setPets(clientPets);
      // ✅ Solución al error de memberId
      if (clientPets.length > 0) setSelectedPetId(clientPets[0].memberId); 
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 1. Buscamos las entidades seleccionadas
  const pet = pets.find(p => p.memberId === selectedPetId);
  const prod = allProducts.find(p => p.productId === selectedProductId);

  // 2. Validación de seguridad (Type Guard)
  // Esto asegura que TypeScript sepa que nada es 'undefined' antes de crear el payload
  if (!selectedClient || !pet || !prod) {
    return alert("Por favor, asegúrate de seleccionar un cliente, un paciente y un servicio válido.");
  }

  setLoading(true);

  // 3. Construcción del Payload con datos garantizados
  const payload = {
    clientId: selectedClient.clientId,
    clientName: `${selectedClient.name} ${selectedClient.lastName || ''}`.trim(),
    clientPhone: selectedClient.phone,
    scheduledDate,
    timeSlot,
    items: [{
      petId: pet.memberId,    // Ahora TS sabe que pet existe
      petName: pet.name,      // Ahora TS sabe que pet existe
      itemId: prod.productId!, 
      description: prod.name,
      serviceTypeId: prod.serviceTypeId, // Añadido para cumplir con la entidad del Core
      categoryId: prod.categoryId,       // Añadido para cumplir con la entidad del Core
      price: Number(price),
      discount: 0
    }]
  };

  try {
    // Ya no debería marcar error porque el payload cumple estrictamente con la interfaz
    await serviceRequestService.create(payload as any); 
    // Nota: Usamos 'as any' solo si el DTO del servicio tiene campos de cálculo 
    // que el backend genera (como total o tax) y no quieres definirlos manualmente aquí.
    
    onSuccess();
    onClose();
  } catch (e) {
    console.error("Error al agendar:", e);
    alert("Error al guardar la cita.");
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in duration-200 text-left">
        
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Agendar Cita Web</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Catálogo filtrado por canal de reserva</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* 1. CLIENTE */}
          {!selectedClient ? (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Buscar Cliente</label>
              <div className="flex gap-2">
                <input 
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSearchClient()}
                  placeholder="Nombre o teléfono..."
                  className="flex-1 p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={handleSearchClient} className="bg-gray-900 text-white px-6 rounded-2xl font-bold uppercase text-xs">
                  {isSearching ? <Loader2 className="animate-spin" size={18}/> : "Buscar"}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                  {searchResults.map(c => (
                    <div key={c.clientId} onClick={() => handleSelectClient(c)} className="p-4 border-b hover:bg-indigo-50 cursor-pointer flex justify-between items-center group font-bold text-sm">
                      {c.name} {c.lastName} <ChevronRight size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-indigo-600 p-5 rounded-3xl flex justify-between items-center text-white shadow-lg">
              <div className="flex items-center gap-4">
                <User size={24} />
                <div>
                  <p className="font-black uppercase">{selectedClient.name} {selectedClient.lastName}</p>
                  <p className="text-xs opacity-70">{selectedClient.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-[9px] font-black bg-white/20 px-3 py-2 rounded-xl">CAMBIAR</button>
            </div>
          )}

          {/* 2. JERARQUÍA */}
          {selectedClient && (
            <div className="animate-in fade-in slide-in-from-top-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Paciente</label>
                  <select value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-700 outline-none appearance-none">
                    {pets.map(p => <option key={p.memberId} value={p.memberId}>{p.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Línea de Negocio</label>
                  <select value={selectedTypeId} onChange={e => setSelectedTypeId(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-700 outline-none appearance-none">
                    <option value="">Seleccionar...</option>
                    {serviceTypes.map(t => <option key={t.serviceTypeId} value={t.serviceTypeId}>{t.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Categoría</label>
                  <select disabled={!selectedTypeId} value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-700 outline-none appearance-none disabled:opacity-30">
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Servicio / Producto</label>
                  <select disabled={!selectedCategoryId} value={selectedProductId} onChange={e => {
                    const prd = allProducts.find(p => p.productId === e.target.value);
                    setSelectedProductId(e.target.value);
                    if (prd) setPrice(prd.price);
                  }} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-700 outline-none appearance-none disabled:opacity-30">
                    <option value="">Seleccionar...</option>
                    {filteredProducts.map(p => <option key={p.productId} value={p.productId}>{p.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 grid grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-[9px] font-black text-indigo-400 uppercase">Fecha</label>
                  <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full bg-transparent font-black text-indigo-600 outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-indigo-400 uppercase">Hora</label>
                  <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full bg-transparent font-black text-indigo-600 outline-none appearance-none">
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="text-right">
                  <label className="text-[9px] font-black text-indigo-400 uppercase">Total</label>
                  <p className="text-xl font-black text-indigo-600 tracking-tighter">S/ {price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t bg-gray-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Cancelar</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !selectedProductId}
            className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${loading || !selectedProductId ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Confirmar Cita"}
          </button>
        </div>
      </div>
    </div>
  );
}