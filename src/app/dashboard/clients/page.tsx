'use client';
import React, { useEffect, useState } from 'react';
import { Client, Pet, ClientService } from '@/services/clientService';
import { CatalogService, Species, Breed } from '@/services/catalogService';
import { 
  Users, Search, Plus, Phone, Mail, 
  PawPrint, X, Edit, Calendar 
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
      
      if (selectedClient) {
        const updated = data.find(c => c.clientId === selectedClient.clientId);
        if (updated) setSelectedClient(updated);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadCatalog = async () => {
    try {
      const s = await CatalogService.getSpecies();
      setSpeciesList(s);
    } catch(e) {}
  };

  // --- BÚSQUEDA ---
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

  // ==========================================
  //  LOGICA DE CLIENTES (CREAR / EDITAR)
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
          alert('Cliente actualizado');
      } else {
          await ClientService.create(clientForm);
          alert('Cliente registrado');
      }
      
      setIsClientModalOpen(false);
      loadClients(); 
    } catch (e: any) {
      if (e.response?.status === 409) alert(e.response.data.message);
      else alert('Error al guardar cliente');
    }
  };

  const openClientDetails = async (client: Client) => {
    setSelectedClient(client);
    try {
      const pets = await ClientService.getPets(client.clientId);
      setClientPets(pets);
    } catch (e) { console.error(e); }
  };

  // ==========================================
  //  LOGICA DE MASCOTAS (CREAR / EDITAR)
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
    const bName = breedsList.find(b => b.breedId === bId)?.name || 'Mestizo';
    setPetForm(prev => ({ ...prev, breedId: bId, breedName: bName }));
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    
    try {
      if (selectedPet && selectedPet.petId) {
          await ClientService.updatePet(selectedClient.clientId, selectedPet.petId, petForm);
          alert('Mascota actualizada');
      } else {
          await ClientService.createPet(selectedClient.clientId, petForm);
          alert('Mascota creada');
      }
      
      setIsPetModalOpen(false);
      const pets = await ClientService.getPets(selectedClient.clientId);
      setClientPets(pets);
    } catch (e: any) {
      alert('Error al guardar mascota');
    }
  };

  // Helper visual
  const getBehaviorColor = (b?: string) => {
    switch(b) {
        case 'AGRESIVO': return 'bg-red-100 text-red-700 border-red-200';
        case 'MIEDOSO': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'INQUIETO': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="h-full p-8 bg-gray-50 overflow-y-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-indigo-600"/> Clientes
          </h1>
          <p className="text-gray-500 text-sm">Gestiona dueños y sus mascotas</p>
        </div>
        <button onClick={handleOpenCreateClient} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition">
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      {/* BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-3 border border-gray-200">
        <Search className="text-gray-400" size={20} />
        <input 
            type="text" 
            placeholder="Buscar por nombre, apellido o teléfono..." 
            className="w-full outline-none text-gray-700"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* COLUMNA IZQUIERDA: LISTA DE CLIENTES */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 border-b font-semibold text-gray-600">Listado</div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {loading ? <p className="text-center p-4 text-gray-400">Cargando...</p> : clients.map(c => (
                    <div 
                        key={c.clientId}
                        onClick={() => openClientDetails(c)}
                        className={`p-3 rounded-xl cursor-pointer transition border ${selectedClient?.clientId === c.clientId ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                    >
                        <div className="font-bold text-gray-800">{c.name} {c.lastName}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Phone size={14}/> {c.phone}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMNA DERECHA: DETALLE Y MASCOTAS */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            {!selectedClient ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Users size={48} className="mb-4 opacity-20"/>
                    <p>Selecciona un cliente para ver detalles</p>
                </div>
            ) : (
                <>
                    {/* CABECERA CLIENTE */}
                    <div className="p-6 border-b bg-gray-50/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedClient.name} {selectedClient.lastName}</h2>
                                    <button onClick={() => handleOpenEditClient(selectedClient)} className="text-gray-400 hover:text-indigo-600 transition">
                                        <Edit size={18} />
                                    </button>
                                </div>
                                <div className="flex gap-4 mt-2 text-gray-600">
                                    <span className="flex items-center gap-1"><Phone size={16}/> {selectedClient.phone}</span>
                                    {selectedClient.email && <span className="flex items-center gap-1"><Mail size={16}/> {selectedClient.email}</span>}
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedClient.source === 'WHATSAPP' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {selectedClient.source || 'WEB'}
                            </span>
                        </div>
                    </div>

                    {/* LISTA MASCOTAS */}
                    <div className="flex-1 p-6 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><PawPrint/> Mascotas</h3>
                            <button onClick={handleOpenCreatePet} className="text-sm bg-white border hover:bg-gray-50 px-3 py-1 rounded-lg shadow-sm transition">
                                + Agregar Mascota
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clientPets.length === 0 && <p className="text-gray-400 col-span-2 text-center py-8">No hay mascotas registradas.</p>}
                            {clientPets.map(pet => (
                                <div key={pet.petId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition relative group">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenEditPet(pet); }}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Edit size={16} />
                                    </button>

                                    <div className="flex justify-between items-start mb-2 pr-6">
                                        <h4 className="font-bold text-lg text-indigo-900">{pet.name}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${getBehaviorColor(pet.behavior)}`}>
                                            {pet.behavior || 'N/A'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-medium">Especie:</span> {pet.speciesName} ({pet.breedName})
                                    </p>
                                    <div className="flex gap-3 text-xs text-gray-500 mt-2">
                                        {pet.gender && <span>Sexo: {pet.gender === 'M' ? 'Macho' : 'Hembra'}</span>}
                                        {pet.birthDate && <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(pet.birthDate).toLocaleDateString()}</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 italic border-t pt-2">
                                        {pet.notes || 'Sin notas adicionales.'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* --- MODAL CLIENTE (CREAR / EDITAR) --- */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{isEditingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                    <button onClick={() => setIsClientModalOpen(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                
                <form onSubmit={handleSaveClient} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <input required placeholder="Nombre" className="border p-2 rounded-lg w-full" 
                            value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} />
                        <input required placeholder="Apellido" className="border p-2 rounded-lg w-full" 
                            value={clientForm.lastName} onChange={e => setClientForm({...clientForm, lastName: e.target.value})} />
                    </div>
                    
                    {/* 👇 INPUT DE TELÉFONO CON PREFIJO +51 FIJO 👇 */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Teléfono (WhatsApp)</label>
                        <div className="flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                            <div className="bg-gray-100 px-3 py-2 text-gray-600 border-r flex items-center gap-2 select-none font-medium text-sm">
                                <span>🇵🇪</span> +51
                            </div>
                            <input 
                                required 
                                type="tel"
                                placeholder="999 888 777" 
                                className="w-full px-3 py-2 outline-none text-gray-700" 
                                // Eliminamos el +51 si viene del backend para mostrar solo el número local
                                value={clientForm.phone ? clientForm.phone.replace('+51', '') : ''} 
                                // Al guardar, le agregamos el +51 automáticamente
                                onChange={e => {
                                    // Permitimos solo números
                                    const numericValue = e.target.value.replace(/\D/g, ''); 
                                    setClientForm({...clientForm, phone: '+51' + numericValue});
                                }} 
                            />
                        </div>
                    </div>
                    {/* 👆 FIN INPUT DE TELÉFONO 👆 */}

                    <input type="email" placeholder="Email (Opcional)" className="border p-2 rounded-lg w-full" 
                        value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} />
                    
                    <div className="flex gap-2 justify-end mt-4">
                        <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                            {isEditingClient ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL MASCOTA (CREAR / EDITAR) --- */}
      {isPetModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {selectedPet ? `Editar a ${selectedPet.name}` : `Nueva Mascota para ${selectedClient.name}`}
                    </h2>
                    <button onClick={() => setIsPetModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <form onSubmit={handleSavePet} className="space-y-4">
                    <input required placeholder="Nombre de la mascota" className="border p-2 rounded-lg w-full" value={petForm.name} onChange={e => setPetForm({...petForm, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                        <select required className="border p-2 rounded-lg bg-white" value={petForm.speciesId || ''} onChange={handleSpeciesChange}>
                            <option value="">Especie...</option>
                            {speciesList.map(s => <option key={s.speciesId} value={s.speciesId}>{s.name}</option>)}
                        </select>
                        <select required className="border p-2 rounded-lg bg-white" value={petForm.breedId || ''} onChange={handleBreedChange} disabled={!petForm.speciesId}>
                            <option value="">Raza...</option>
                            {breedsList.map(b => <option key={b.breedId} value={b.breedId}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sexo</label>
                            <select className="border p-2 rounded-lg bg-white w-full text-sm" value={petForm.gender || ''} onChange={e => { const val = e.target.value; setPetForm({...petForm, gender: val === '' ? undefined : (val as 'M' | 'F') }); }}>
                                <option value="">Seleccione...</option>
                                <option value="M">Macho</option>
                                <option value="F">Hembra</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nacimiento</label>
                            <input type="date" className="border p-2 rounded-lg w-full text-sm" value={petForm.birthDate || ''} onChange={e => setPetForm({...petForm, birthDate: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Comportamiento</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {['TRANQUILO', 'INQUIETO', 'MIEDOSO', 'AGRESIVO'].map((b: any) => (
                                <button type="button" key={b} onClick={() => setPetForm({...petForm, behavior: b})} className={`text-xs py-2 rounded border ${petForm.behavior === b ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'text-gray-500'}`}>{b}</button>
                            ))}
                        </div>
                    </div>
                    <textarea placeholder="Notas (Alergias, observaciones...)" className="border p-2 rounded-lg w-full h-20 text-sm" value={petForm.notes || ''} onChange={e => setPetForm({...petForm, notes: e.target.value})} />
                    <div className="flex gap-2 justify-end mt-4">
                        <button type="button" onClick={() => setIsPetModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">{selectedPet ? 'Actualizar Mascota' : 'Guardar Mascota'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}