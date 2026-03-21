'use client';

import React, { useState, useEffect } from 'react';
import { ConfigService, UserProfile, MenuOption } from '@/services/configService';
import { 
  Plus, Edit2, ShieldCheck, X, Save, UserCog, 
  CheckSquare, Square, BrainCircuit, Scissors, 
  LayoutPanelLeft, User, Info 
} from 'lucide-react';

// Opciones fijas para la base de la IA
const AI_ROLES = [
  { id: 'admin', label: 'Administrador', desc: 'Gestión y Reportes', icon: ShieldCheck },
  { id: 'groomer', label: 'Groomer', desc: 'Peluquería y Baños', icon: Scissors },
  { id: 'counter', label: 'Mostrador', desc: 'Recepción y Citas', icon: LayoutPanelLeft },
  { id: 'customer', label: 'Cliente', desc: 'Ventas y Consultas', icon: User },
];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado del Formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [aiRoleBase, setAiRoleBase] = useState<'admin' | 'groomer' | 'counter' | 'customer'>('customer');
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [profilesData, menusData] = await Promise.all([
        ConfigService.getProfiles(),
        ConfigService.getMenuOptions()
      ]);
      setProfiles(profilesData);
      setMenus(menusData.filter(m => m.isActive));
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (profile: UserProfile) => {
    setEditingId(profile.profileId || null);
    setName(profile.name);
    setDescription(profile.description || '');
    setIsActive(profile.isActive ?? true);
    setAiRoleBase(profile.aiRoleBase || 'customer');
    setSelectedMenus(profile.menuOptions || []);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setIsActive(true);
    setAiRoleBase('customer');
    setSelectedMenus([]);
    setEditingId(null);
  };

  const toggleMenuSelection = (menuId: string) => {
    setSelectedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId) 
        : [...prev, menuId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const payload = { 
        name, 
        description,
        isActive, 
        aiRoleBase,
        menuOptions: selectedMenus,
        // Si es nuevo, generamos un ID basado en el nombre
        profileId: editingId || name.toLowerCase().trim().replace(/\s+/g, '-')
      };

      if (editingId) {
        await ConfigService.updateProfile(editingId, payload);
      } else {
        await ConfigService.createProfile(payload);
      }
      await loadInitialData();
      handleCloseModal();
    } catch (e) {
      alert("Error al guardar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-left">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <ShieldCheck className="text-purple-600 w-10 h-10" /> Perfiles y Seguridad
          </h1>
          <p className="text-gray-500">Configura accesos y el comportamiento del asistente IA.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-purple-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-purple-700 transition shadow-xl shadow-purple-100 font-bold"
        >
          <Plus size={20} /> Nuevo Perfil
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400 animate-pulse">Cargando configuración...</div>
        ) : profiles.map((profile) => (
          <div key={profile.profileId} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <UserCog size={24} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profile.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profile.isActive ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <span className="text-[9px] font-black text-purple-500 uppercase tracking-tighter flex items-center gap-1">
                  <BrainCircuit size={10} /> IA: {profile.aiRoleBase}
                </span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-1">{profile.name}</h3>
            <p className="text-xs text-gray-400 mb-6 line-clamp-2">{profile.description || 'Sin descripción.'}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <span className="text-xs font-bold text-gray-500">{profile.menuOptions?.length || 0} Módulos</span>
              <button onClick={() => handleOpenEdit(profile)} className="bg-gray-50 hover:bg-purple-100 text-purple-600 p-2.5 rounded-xl transition">
                <Edit2 size={16}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EXPANDIDO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-800">
                  {editingId ? 'Editar Perfil' : 'Nuevo Perfil'}
                </h3>
                <p className="text-sm text-gray-500">Configura los límites y la identidad del rol.</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-200 rounded-full transition">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* COLUMNA IZQUIERDA: DATOS */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Nombre del Rol</label>
                    <input 
                      autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-600 outline-none transition-all font-medium"
                      placeholder="Ej: Administrador" required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Descripción</label>
                    <textarea 
                      value={description} onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-600 outline-none transition-all text-sm h-24 resize-none"
                      placeholder="¿Qué funciones tiene este perfil?"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="text-sm font-bold text-purple-700">Perfil Activo</span>
                    <button
                      type="button" onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* COLUMNA DERECHA: IA BASE */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <BrainCircuit size={14} className="text-purple-600"/> Comportamiento IA
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {AI_ROLES.map((role) => (
                      <button
                        key={role.id} type="button"
                        onClick={() => setAiRoleBase(role.id as any)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          aiRoleBase === role.id 
                            ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-100' 
                            : 'border-gray-100 bg-white text-gray-600 hover:border-purple-200'
                        }`}
                      >
                        <role.icon size={18} />
                        <div>
                          <p className="text-xs font-bold leading-none">{role.label}</p>
                          <p className={`text-[9px] mt-0.5 ${aiRoleBase === role.id ? 'text-purple-100' : 'text-gray-400'}`}>{role.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl flex gap-2">
                    <Info size={14} className="text-blue-500 shrink-0" />
                    <p className="text-[9px] text-blue-600 leading-tight italic">Esto define cómo responderá el Bot cuando este usuario le escriba por WhatsApp.</p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN MÓDULOS */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Módulos de Acceso</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {menus.map((menu) => (
                    <button
                      key={menu.menuId} type="button"
                      onClick={() => toggleMenuSelection(menu.menuId!)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        selectedMenus.includes(menu.menuId!) 
                          ? 'border-purple-600 bg-purple-50 text-purple-700' 
                          : 'border-gray-100 text-gray-500 hover:border-purple-200'
                      }`}
                    >
                      {selectedMenus.includes(menu.menuId!) ? <CheckSquare size={16} className="text-purple-600" /> : <Square size={16} />}
                      <span className="text-[11px] font-bold truncate">{menu.title}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-4 text-gray-400 font-bold hover:text-gray-600 transition">
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-[2] px-4 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-xl shadow-purple-100"
                >
                  {isSubmitting ? 'Guardando...' : <><Save size={20} /> Guardar Perfil</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}