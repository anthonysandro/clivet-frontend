'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Client, Pet, ClientService } from '@/services/clientService';
import { CatalogService, Species, Breed } from '@/services/catalogService';
import { 
  Users, Search, Plus, Phone, Mail, 
  PawPrint, X, Edit, Calendar, Loader2, Info
} from 'lucide-react';

// Helper para formatear fecha para input type="date" (YYYY-MM-DD)
const formatDateForInput = (isoString?: string) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADOS DE SELECCIÓN Y MODALES ---
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Modal Cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false); 
  
  // Modal Mascota
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null); 

  // Datos auxiliares
  const [clientPets, setClientPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [breedsList, setBreedsList] = useState<Breed[]>([]);

  // Formularios
  const [clientForm, setClientForm] = useState<Partial<Client>>({ name: '', lastName: '', phone: '', email: '' });
  const [petForm, setPetForm] = useState<Partial<Pet>>({ name: '', behavior: 'TRANQUILO' });

  // --- CARGA INICIAL ---
  useEffect(() => {
    loadClients();
    loadCatalog();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await ClientService.getAll();
      setClients(data);
    } catch (e) { 
      console.error("Error al cargar clientes:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const loadCatalog = async () => {
    try {
      const s = await CatalogService.getSpecies();
      setSpeciesList(s);
    } catch(e) {}
  };

  // --- BÚSQUEDA CON DEBOUNCE ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        const results = await ClientService.search(searchTerm);
        setClients(results);
        setLoading(false);
      } else if (searchTerm.length === 0) {
        loadClients();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const openClientDetails = useCallback(async (client: Client) => {
    setSelectedClient(client);
    setClientPets([]); // Reset visual
    try {
      const pets = await ClientService.getPets(client.clientId);
      setClientPets(pets);
    } catch (e) { 
      console.error("Error al cargar mascotas:", e); 
    }
  }, []);

  // ==========================================
  //  LOGICA DE CLIENTES
  // ==========================================
  
  const handleOpenCreateClient = () => {
      setIsEditingClient(false);
      setClientForm({ name: '', lastName: '', phone: '', email: '' });
      setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (client: Client) => {
      setIsEditingClient(true);
      setClientForm({ ...client });
      setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingClient && clientForm.clientId) {
          await ClientService.update(clientForm.clientId, clientForm);
      } else {
          await ClientService.create(clientForm);
      }
      setIsClientModalOpen(false);
      loadClients(); 
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al guardar cliente');
    }
  };

  // ==========================================
  //  LOGICA DE MASCOTAS
  // ==========================================

  const handleOpenCreatePet = () => {
      setSelectedPet(null); 
      setPetForm({ name: '', behavior: 'TRANQUILO', gender: undefined, birthDate: '', notes: '' });
      setIsPetModalOpen(true);
  };

  const handleOpenEditPet = async (pet: Pet) => {
      setSelectedPet(pet);
      setPetForm({
          ...pet,
          birthDate: formatDateForInput(pet.birthDate) 
      });
      
      if (pet.speciesId) {
          const b = await CatalogService.getBreeds(pet.speciesId);
          setBreedsList(b);
      }
      setIsPetModalOpen(true);
  };

  const handleSpeciesChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    const sName = speciesList.find(s => s.speciesId === sId)?.name || '';
    setPetForm(prev => ({ ...prev, speciesId: sId, speciesName: sName, breedId: '', breedName: '' }));
    
    if (sId) {
      const b = await CatalogService.getBreeds(sId);
      setBreedsList(b);
    } else {
        setBreedsList([]);
    }
  };

  const handleBreedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    const bName = breedsList.find(b => b.breedId === bId)?.name || '';
    setPetForm(prev => ({ ...prev, breedId: bId, breedName: bName }));
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    
    try {
      if (selectedPet && selectedPet.memberId) {
          await ClientService.updatePet(selectedClient.clientId, selectedPet.memberId, petForm);
      } else {
          await ClientService.createPet(selectedClient.clientId, petForm);
      }
      setIsPetModalOpen(false);
      openClientDetails(selectedClient);
    } catch (e: any) {
      alert('Error al guardar mascota');
    }
  };

  const getBehaviorColor = (b?: string) => {
    switch(b) {
        case 'AGRESIVO': return 'bg-red-100 text-red-700 border-red-200';
        case 'MIEDOSO': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'INQUIETO': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="h-full p-8 bg-gray-50 overflow-y-auto text-left">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase flex items-center gap-2">
            <Users className="text-indigo-600" size={32}/> Clientes
          </h1>
          <p className="text-gray-500 font-medium italic">Base de datos de propietarios y pacientes</p>
        </div>
        <button onClick={handleOpenCreateClient} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all font-black uppercase text-[10px] tracking-widest active:scale-95">
          <Plus size={20} strokeWidth={3} /> Nuevo Cliente
        </button>
      </div>

      {/* BÚSQUEDA */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm mb-8 flex items-center gap-3 border border-gray-100">
        <Search className="text-gray-300" size={24} />
        <input 
            type="text" 
            placeholder="Buscar por nombre, apellido o teléfono (WhatsApp)..." 
            className="w-full outline-none text-gray-700 font-bold bg-transparent placeholder:text-gray-300"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
        {/* COLUMNA IZQUIERDA: LISTA DE CLIENTES */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 bg-gray-50/50 border-b font-black text-[10px] text-gray-400 uppercase tracking-widest">Listado de Propietarios</div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-200" size={40}/></div>
                ) : clients.length === 0 ? (
                    <p className="text-center p-8 text-gray-400 font-bold italic">No hay resultados</p>
                ) : clients.map(c => (
                    <div 
                        key={c.clientId}
                        onClick={() => openClientDetails(c)}
                        className={`p-4 rounded-[1.5rem] cursor-pointer transition-all border-2 ${selectedClient?.clientId === c.clientId ? 'bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-100' : 'bg-white border-transparent hover:bg-gray-50'}`}
                    >
                        <div className="font-black text-gray-800 text-base tracking-tight">{c.name} {c.lastName}</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1">
                            <Phone size={12}/> {c.phone}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMNA DERECHA: DETALLE Y MASCOTAS */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden">
            {!selectedClient ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-20 text-center">
                    <Users size={80} className="mb-6 opacity-10" strokeWidth={1}/>
                    <p className="font-black uppercase tracking-[0.2em] text-sm">Selecciona un cliente para ver su historial y mascotas</p>
                </div>
            ) : (
                <>
                    {/* CABECERA CLIENTE */}
                    <div className="p-8 border-b bg-gray-50/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{selectedClient.name} {selectedClient.lastName}</h2>
                                    <button onClick={() => handleOpenEditClient(selectedClient)} className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all">
                                        <Edit size={20} />
                                    </button>
                                </div>
                                <div className="flex gap-6 mt-3">
                                    <span className="flex items-center gap-2 text-sm font-bold text-gray-500"><Phone size={16} className="text-indigo-400"/> {selectedClient.phone}</span>
                                    {selectedClient.email && <span className="flex items-center gap-2 text-sm font-bold text-gray-500"><Mail size={16} className="text-indigo-400"/> {selectedClient.email}</span>}
                                </div>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border ${selectedClient.source === 'WHATSAPP' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                Origen: {selectedClient.source || 'WEB'}
                            </span>
                        </div>
                    </div>

                    {/* LISTA MASCOTAS */}
                    <div className="flex-1 p-8 bg-gray-50/30 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-gray-800 uppercase tracking-tighter text-xl flex items-center gap-2"><PawPrint className="text-indigo-600"/> Pacientes Registrados</h3>
                            <button onClick={handleOpenCreatePet} className="text-[10px] font-black uppercase tracking-widest bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm">
                                + Agregar Mascota
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {clientPets.length === 0 ? (
                                <div className="col-span-2 py-20 text-center border-2 border-dashed border-gray-200 rounded-[2rem]">
                                    <Info className="mx-auto text-gray-200 mb-2" size={32}/>
                                    <p className="text-gray-400 font-bold italic">No hay mascotas vinculadas a este propietario.</p>
                                </div>
                            ) : clientPets.map(pet => (
                                <div key={pet.memberId} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenEditPet(pet); }}
                                        className="absolute top-4 right-4 p-3 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Edit size={18} />
                                    </button>

                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-black text-2xl text-gray-900 tracking-tighter italic uppercase">{pet.name}</h4>
                                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border tracking-widest uppercase ${getBehaviorColor(pet.behavior)}`}>
                                            {pet.behavior || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">
                                            {pet.speciesName} <span className="text-indigo-300 mx-1">/</span> {pet.breedName}
                                        </p>
                                        <div className="flex gap-4">
                                            <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg">Sexo: {pet.gender === 'M' ? 'Macho' : 'Hembra'}</span>
                                            {pet.birthDate && <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg flex items-center gap-1"><Calendar size={12}/> {new Date(pet.birthDate).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-2xl text-xs font-medium text-gray-500 italic border border-gray-100 line-clamp-2">
                                        {pet.notes || 'Sin observaciones clínicas registradas.'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* --- MODALES --- */}

      {/* MODAL CLIENTE */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl text-left overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">{isEditingClient ? 'Actualizar Ficha' : 'Nuevo Propietario'}</h2>
                    <button onClick={() => setIsClientModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
                </div>
                
                <form onSubmit={handleSaveClient} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                            <input required className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600" 
                                value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Apellido</label>
                            <input required className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600" 
                                value={clientForm.lastName} onChange={e => setClientForm({...clientForm, lastName: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp (9 dígitos)</label>
                        <div className="flex rounded-2xl bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-600">
                            <div className="bg-gray-200 px-4 py-4 text-gray-500 font-black text-sm border-r border-gray-300 flex items-center">+51</div>
                            <input 
                                required 
                                type="tel"
                                maxLength={9}
                                placeholder="999888777" 
                                className="w-full px-4 py-4 bg-transparent outline-none font-bold text-gray-700" 
                                value={clientForm.phone ? clientForm.phone.replace('+51', '') : ''} 
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, ''); 
                                    setClientForm({...clientForm, phone: '+51' + val});
                                }} 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                        <input type="email" placeholder="cliente@ejemplo.com" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600" 
                            value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} />
                    </div>
                    
                    <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-95 mt-4">
                        {isEditingClient ? 'Guardar Cambios' : 'Crear Ficha Propietario'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* MODAL MASCOTA */}
      {isPetModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar text-left">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
                        {selectedPet ? `Editar a ${selectedPet.name}` : `Nuevo Paciente`}
                    </h2>
                    <button onClick={() => setIsPetModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-400" /></button>
                </div>
                <form onSubmit={handleSavePet} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de la Mascota</label>
                        <input required className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-green-600" 
                               value={petForm.name} onChange={e => setPetForm({...petForm, name: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Especie</label>
                            <select required className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none appearance-none cursor-pointer" value={petForm.speciesId || ''} onChange={handleSpeciesChange}>
                                <option value="">Especie...</option>
                                {speciesList.map(s => <option key={s.speciesId} value={s.speciesId}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Raza</label>
                            <select required className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none appearance-none cursor-pointer disabled:opacity-30" value={petForm.breedId || ''} onChange={handleBreedChange} disabled={!petForm.speciesId}>
                                <option value="">Raza...</option>
                                {breedsList.map(b => <option key={b.breedId} value={b.breedId}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">Sexo</label>
                            <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                                {['M', 'F'].map(g => (
                                    <button 
                                        type="button" 
                                        key={g} 
                                        onClick={() => setPetForm({...petForm, gender: g as any})}
                                        className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${petForm.gender === g ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-300'}`}
                                    >
                                        {g === 'M' ? 'MACHO' : 'HEMBRA'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nacimiento</label>
                            <input type="date" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none" value={petForm.birthDate || ''} onChange={e => setPetForm({...petForm, birthDate: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comportamiento</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {['TRANQUILO', 'INQUIETO', 'MIEDOSO', 'AGRESIVO'].map((b: any) => (
                                <button type="button" key={b} onClick={() => setPetForm({...petForm, behavior: b})} className={`text-[10px] py-3 rounded-xl border-2 transition-all font-black uppercase ${petForm.behavior === b ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-gray-100 text-gray-400'}`}>{b}</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas Clínicas</label>
                        <textarea placeholder="Alergias, conducta especial, antecedentes..." className="w-full bg-gray-50 border-none rounded-[1.5rem] p-4 font-bold outline-none h-24 text-sm" value={petForm.notes || ''} onChange={e => setPetForm({...petForm, notes: e.target.value})} />
                    </div>

                    <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-emerald-100 transition-all active:scale-95 mt-4">
                        {selectedPet ? 'Actualizar Ficha Paciente' : 'Crear Ficha Paciente'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}