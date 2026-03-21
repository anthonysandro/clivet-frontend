'use client';
import React, { useEffect, useState } from 'react';
import { CatalogService, Species, Breed } from '@/services/catalogService';
import { Trash2, Plus, ChevronRight, PawPrint, Tag } from 'lucide-react';

export default function SpeciesPage() {
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);

  const [breedsList, setBreedsList] = useState<Breed[]>([]);
  const [newBreedName, setNewBreedName] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadSpecies(); }, []);

  useEffect(() => {
    if (selectedSpecies) {
      loadBreeds(selectedSpecies.speciesId);
    } else {
      setBreedsList([]);
    }
  }, [selectedSpecies]);

  const formatName = (text: string) => {
    if (!text) return '';
    return text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase();
  };

  // --- FUNCIONES DE CARGA ---
  const loadSpecies = async () => {
    try {
      // El service ahora trae solo las especies de TU Tenant
      const data = await CatalogService.getSpecies();
      setSpeciesList(data);
    } catch (e) { console.error("Error loading species:", e); }
  };

  const loadBreeds = async (speciesId: string) => {
    try {
      const data = await CatalogService.getBreeds(speciesId);
      setBreedsList(data);
    } catch (e) { console.error("Error loading breeds:", e); }
  };

  // --- HANDLERS CREAR ---
  const handleAddSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeciesName.trim()) return;
    try {
      setLoading(true);
      const formattedName = formatName(newSpeciesName); 
      await CatalogService.createSpecies(formattedName);
      setNewSpeciesName('');
      await loadSpecies(); // Recarga la lista filtrada por tenant
    } catch (e: any) {
      console.error(e);
      if (e.response && e.response.status === 409) {
          alert("Esta especie ya está registrada en tu clínica.");
      } else {
          alert('Error al crear la especie.'); 
      }
    } finally { setLoading(false); }
  };

  const handleAddBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBreedName.trim() || !selectedSpecies) return;
    try {
      setLoading(true);
      const formattedName = formatName(newBreedName);
      // Enviamos el ID en mayúsculas para coincidir con la SK: CONFIG#BREED#ESPECIE#
      await CatalogService.createBreed(selectedSpecies.speciesId, formattedName);
      setNewBreedName('');
      await loadBreeds(selectedSpecies.speciesId);
    } catch (e: any) {
      console.error(e);
      if (e.response && e.response.status === 409) {
          alert("Esta raza ya existe para esta especie en tu catálogo.");
      } else {
          alert('Error al crear la raza.'); 
      }
    } finally { setLoading(false); }
  };

  // --- HANDLERS BORRAR ---
  const handleDeleteSpecies = async (id: string) => {
    if (!confirm('¿Borrar especie? Solo se borrará de tu catálogo personal.')) return;
    try {
      await CatalogService.deleteSpecies(id);
      if (selectedSpecies?.speciesId === id) setSelectedSpecies(null);
      await loadSpecies();
    } catch (e) { alert('No se pudo borrar la especie.'); }
  };

  const handleDeleteBreed = async (breedId: string) => {
    if (!selectedSpecies) return;
    try {
      await CatalogService.deleteBreed(selectedSpecies.speciesId, breedId);
      await loadBreeds(selectedSpecies.speciesId);
    } catch (e) { alert('No se pudo borrar la raza.'); }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <PawPrint className="text-indigo-600" size={32}/> 
          Catálogo Veterinario
        </h1>
        <p className="text-gray-500 mt-2">Gestiona las especies y razas disponibles para tus pacientes.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PANEL: ESPECIES */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-[75vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Tag className="text-indigo-500" size={20}/> 1. Listado de Especies
            </h2>
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase">
              Tenant Scope
            </span>
          </div>
          
          <form onSubmit={handleAddSpecies} className="flex gap-2 mb-6">
            <input 
              className={`flex-1 border rounded-xl px-4 py-2.5 transition-all outline-none focus:ring-2 
                ${loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:bg-white focus:ring-indigo-500/20'}`}
              placeholder={loading ? "Guardando..." : "Escribe aquí: Ej. Perro..."}
              value={newSpeciesName}
              disabled={loading} // 👈 Evita doble clic
              onChange={(e) => setNewSpeciesName(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading || !newSpeciesName.trim()} // 👈 Se deshabilita si está vacío
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 rounded-xl transition-all shadow-md active:scale-95"
            >
              {loading ? '...' : <Plus size={20}/>}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {speciesList.map(s => (
              <div 
                key={s.speciesId}
                onClick={() => setSelectedSpecies(s)}
                className={`group p-4 rounded-xl cursor-pointer flex justify-between items-center transition-all border
                  ${selectedSpecies?.speciesId === s.speciesId 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <span className={`font-semibold ${selectedSpecies?.speciesId === s.speciesId ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {s.name}
                </span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteSpecies(s.speciesId); }}
                    className="text-gray-400 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16}/>
                  </button>
                  <ChevronRight size={18} className={selectedSpecies?.speciesId === s.speciesId ? 'text-indigo-500' : 'text-gray-300'}/>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL: RAZAS */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-[75vh]">
          <h2 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
            <PawPrint className="text-green-500" size={20}/> 
            2. Razas: {selectedSpecies ? selectedSpecies.name : 'Seleccione una especie'}
          </h2>

          {!selectedSpecies ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Tag size={48} className="mb-4 opacity-10"/>
              <p className="font-medium">Selecciona una especie a la izquierda</p>
              <p className="text-sm">para ver y gestionar sus razas</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleAddBreed} className="flex gap-2 mb-6">
                <input 
                  className="flex-1 border rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-green-500/20 border-gray-200"
                  placeholder={`Nueva raza para ${selectedSpecies.name}...`}
                  value={newBreedName}
                  onChange={(e) => setNewBreedName(e.target.value)}
                />
                <button disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-xl transition-all shadow-md active:scale-95">
                  <Plus size={20}/>
                </button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {breedsList.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 italic">No hay razas registradas.</p>
                  </div>
                ) : (
                  breedsList.map(b => (
                    <div key={b.breedId} className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center group hover:border-green-200 hover:bg-green-50/30 transition-all">
                      <span className="text-gray-700 font-medium">{b.name}</span>
                      <button 
                        onClick={() => handleDeleteBreed(b.breedId)}
                        className="text-gray-300 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
}