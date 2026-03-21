'use client';

import React, { useState, useEffect } from 'react';
import { ConfigService, ServiceType, ServiceCategory } from '@/services/configService';
import { 
  Plus, Edit2, ChevronRight, Settings2, FolderPlus, 
  X, Save, Power, AlertTriangle, CheckCircle2, PackageSearch
} from 'lucide-react';

export default function ServicesSettingsPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Modales
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<ServiceType | ServiceCategory | null>(null);

  useEffect(() => { loadServiceTypes(); }, []);

  useEffect(() => {
    if (selectedType?.serviceTypeId) {
      loadCategories(selectedType.serviceTypeId);
    } else {
      setCategories([]);
    }
    setErrorMessage(null);
  }, [selectedType]);

  const loadServiceTypes = async () => {
    try {
      setLoading(true);
      const data = await ConfigService.getServiceTypes();
      setServiceTypes(data);
    } catch (error) {
      console.error("Error cargando tipos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (typeId: string) => {
    try {
      const data = await ConfigService.getCategories(typeId);
      setCategories(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  // --- 🛡️ Lógica de Validación de Duplicidad ---
  const checkDuplicity = (name: string, list: any[], currentId?: string) => {
    return list.some(item => 
      item.name.toLowerCase().trim() === name.toLowerCase().trim() && 
      (item.serviceTypeId !== currentId && item.categoryId !== currentId)
    );
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    // Validación de duplicados local antes de ir al servidor
    if (checkDuplicity(newItemName, serviceTypes, (editingItem as ServiceType)?.serviceTypeId)) {
      setErrorMessage(`El tipo "${newItemName}" ya existe en el catálogo.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem && 'serviceTypeId' in editingItem && !('categoryId' in editingItem)) {
        await ConfigService.updateServiceType(editingItem.serviceTypeId!, { ...editingItem, name: newItemName });
      } else {
        await ConfigService.createServiceType({ name: newItemName, isActive: true });
      }
      await loadServiceTypes();
      closeModals();
    } catch (error) {
      setErrorMessage("Error de conexión con el servicio.");
    } finally { setIsSubmitting(false); }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !selectedType) return;

    // Validación de duplicados dentro del mismo tipo de servicio
    if (checkDuplicity(newItemName, categories, (editingItem as ServiceCategory)?.categoryId)) {
      setErrorMessage(`La categoría "${newItemName}" ya existe para ${selectedType.name}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem && 'categoryId' in editingItem) {
        await ConfigService.updateCategory(editingItem.categoryId!, { ...editingItem, name: newItemName });
      } else {
        await ConfigService.createCategory({ name: newItemName, serviceTypeId: selectedType.serviceTypeId });
      }
      await loadCategories(selectedType.serviceTypeId!);
      closeModals();
    } catch (error) {
      setErrorMessage("Error al guardar la categoría.");
    } finally { setIsSubmitting(false); }
  };

  const closeModals = () => {
    setIsTypeModalOpen(false);
    setIsCategoryModalOpen(false);
    setEditingItem(null);
    setNewItemName('');
    setErrorMessage(null);
  };

  const handleOpenEditType = (type: ServiceType) => {
    setEditingItem(type);
    setNewItemName(type.name);
    setIsTypeModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ServiceCategory) => {
    setEditingItem(cat);
    setNewItemName(cat.name);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-left">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-blue-600" />
            Configuración Maestra
          </h1>
          <p className="text-gray-500 font-medium">Define la jerarquía de Tipos, Categorías y Productos.</p>
        </div>
        
        {/* INDICADOR DE PASOS / BREADCRUMBS */}
        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${selectedType ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-400 border'}`}>
            1. Tipo
          </div>
          <ChevronRight size={14} className="text-gray-300" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${selectedType && categories.length > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 border'}`}>
            2. Categoría
          </div>
          <ChevronRight size={14} className="text-gray-300" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-white text-gray-300 border">
            3. Productos
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA 1: TIPOS DE SERVICIO */}
        <section className="lg:col-span-5 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 bg-gray-50/50 border-b flex justify-between items-center">
            <div>
              <h2 className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Nivel 1</h2>
              <p className="text-xs font-bold text-gray-700">Tipos de Servicio</p>
            </div>
            <button 
              onClick={() => { setEditingItem(null); setIsTypeModalOpen(true); }}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="p-10 text-center text-gray-400 font-medium animate-pulse uppercase text-xs">Cargando tipos...</div>
            ) : serviceTypes.map((type) => (
              <div 
                key={type.serviceTypeId}
                onClick={() => setSelectedType(type)}
                className={`p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all ${
                  selectedType?.serviceTypeId === type.serviceTypeId 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                  : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div>
                  <p className="font-bold text-sm leading-none mb-1">{type.name}</p>
                  <p className={`text-[10px] font-bold uppercase ${selectedType?.serviceTypeId === type.serviceTypeId ? 'text-blue-100' : 'text-gray-400'}`}>
                    {type.isActive ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEditType(type); }}
                    className={`p-2 rounded-lg transition-colors ${selectedType?.serviceTypeId === type.serviceTypeId ? 'hover:bg-white/20' : 'hover:bg-gray-100 text-gray-400'}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <ChevronRight size={16} className={selectedType?.serviceTypeId === type.serviceTypeId ? 'text-white' : 'text-gray-200'} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COLUMNA 2: CATEGORÍAS DEPENDIENTES */}
        <section className="lg:col-span-7 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-6 bg-gray-50/50 border-b flex justify-between items-center">
            <div>
              <h2 className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Nivel 2</h2>
              <p className="text-xs font-bold text-gray-700">
                {selectedType ? `Categorías de ${selectedType.name}` : 'Seleccione un tipo'}
              </p>
            </div>
            {selectedType?.isActive && (
              <button 
                onClick={() => { setEditingItem(null); setIsCategoryModalOpen(true); }}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
              >
                <FolderPlus size={20} />
              </button>
            )}
          </div>

          <div className="p-8">
            {!selectedType ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                <div className="p-6 bg-gray-100 rounded-full">
                  <PackageSearch size={48} className="text-gray-400" />
                </div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Esperando selección del Nivel 1</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-gray-50 rounded-[2rem]">
                <p className="text-gray-400 font-bold text-sm italic">No hay categorías registradas aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat.categoryId} className="p-5 border-2 border-gray-50 rounded-[1.5rem] flex justify-between items-center group hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                    <span className="font-bold text-gray-700">{cat.name}</span>
                    <button 
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedType && (
            <div className="p-6 mt-auto bg-gray-50/30 border-t border-gray-50">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                Siguiente paso: Los productos creados heredarán la categoría y el tipo seleccionados.
               </p>
            </div>
          )}
        </section>
      </div>

      {/* MODAL UNIFICADO PARA TIPO Y CATEGORÍA */}
      {(isTypeModalOpen || isCategoryModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-800">
                  {editingItem ? 'Actualizar' : 'Registrar'}
                </h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                  {isTypeModalOpen ? 'Mantenimiento de Tipos' : 'Mantenimiento de Categorías'}
                </p>
              </div>
              <button onClick={closeModals} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={isTypeModalOpen ? handleSaveType : handleSaveCategory} className="p-8">
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold animate-shake">
                  <AlertTriangle size={16} /> {errorMessage}
                </div>
              )}
              
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Descriptivo</label>
              <input 
                autoFocus type="text" value={newItemName} 
                onChange={(e) => { setNewItemName(e.target.value); setErrorMessage(null); }}
                className={`w-full p-4 rounded-2xl border-2 outline-none transition-all font-bold ${
                  errorMessage 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-blue-600'
                }`}
                placeholder={isTypeModalOpen ? "Ej: Servicios Médicos" : "Ej: Vacunación"} 
                required 
              />
              
              <div className="mt-10 flex gap-4">
                <button type="button" onClick={closeModals} className="flex-1 py-4 font-black text-gray-400 hover:text-gray-600 uppercase text-[10px] tracking-widest">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-[2] py-4 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-gray-200 flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
                >
                  {isSubmitting ? 'Procesando...' : <><Save size={18} /> Confirmar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}