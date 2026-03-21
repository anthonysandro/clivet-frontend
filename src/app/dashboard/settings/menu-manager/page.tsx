'use client';

import React, { useState, useEffect } from 'react';
import { ConfigService, MenuOption } from '@/services/configService';
import { getIconByName } from '@/utils/iconHelper';
import { 
  Plus, Edit2, ListTree, X, Save, 
  Layout, Link as LinkIcon, Hash, 
  Search, ExternalLink, Loader2,
  Trash2 // ✅ Importado
} from 'lucide-react';

export default function MenuManagerPage() {
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    icon: 'Layout',
    path: '/dashboard/',
    order: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { loadMenus(); }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const data = await ConfigService.getMenuOptions();
      setMenus(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (e) {
      console.error("Error al cargar menús:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (menu: MenuOption) => {
    setEditingId(menu.menuId || null);
    setFormData({
      title: menu.title,
      icon: menu.icon || 'Layout',
      path: menu.path,
      order: menu.order || 0
    });
    setIsModalOpen(true);
  };

  // ✅ FUNCIÓN DE ELIMINACIÓN IMPLEMENTADA
  const handleDelete = async (menu: MenuOption) => {
    if (!window.confirm(`¿Estás seguro de eliminar el módulo "${menu.title}"? Esta acción no se puede deshacer y afectará la visibilidad en el Sidebar.`)) {
      return;
    }

    try {
      await ConfigService.deleteMenuOption(menu.menuId!);
      await loadMenus(); // Recargamos la lista después de borrar
    } catch (e) {
      alert("Error al eliminar el módulo. Verifique si tiene permisos en el servidor.");
      console.error(e);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ title: '', icon: 'Layout', path: '/dashboard/', order: 0 });
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        const currentMenu = menus.find(m => m.menuId === editingId);
        await ConfigService.updateMenuOption(editingId, { 
          ...formData, 
          isActive: currentMenu?.isActive ?? true 
        });
      } else {
        const menuId = formData.title.toLowerCase().trim().replace(/\s+/g, '-');
        await ConfigService.createMenuOption({ ...formData, menuId, isActive: true });
      }
      await loadMenus();
      handleCloseModal();
    } catch (e) {
      alert("Error al guardar el módulo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (menu: MenuOption) => {
    try {
      await ConfigService.updateMenuOption(menu.menuId!, {
        ...menu,
        isActive: !menu.isActive
      });
      await loadMenus();
    } catch (e) {
      alert("Error al cambiar estado");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-left">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter uppercase">
            <ListTree className="text-indigo-600 w-10 h-10" /> Módulos del Sistema
          </h1>
          <p className="text-gray-500 font-medium italic">Configura la navegación dinámica y el orden del Sidebar.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 font-bold uppercase text-xs tracking-widest"
        >
          <Plus size={20} /> Nuevo Módulo
        </button>
      </header>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Orden</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo / Icono</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ruta (Path)</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
            ) : menus.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-gray-400 italic font-medium">No hay módulos registrados aún.</td></tr>
            ) : (
              menus.map((menu) => (
                <tr key={menu.menuId} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-gray-300 group-hover:text-indigo-600 transition-colors">#{menu.order}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        {getIconByName(menu.icon || 'Layout', 20)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 leading-none">{menu.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase">{menu.icon}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                      {menu.path}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleStatus(menu)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                        menu.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {menu.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEdit(menu)}
                        className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(menu)}
                        className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE MENÚ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
                  {editingId ? 'Editar Módulo' : 'Nuevo Módulo'}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Navegación Dinámica</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Título Visual</label>
                <input 
                  autoFocus type="text" value={formData.title} required
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ej: Inventario"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Ruta (Path)</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" value={formData.path} required
                    onChange={(e) => setFormData({...formData, path: e.target.value})}
                    placeholder="/dashboard/inventory"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all font-mono text-xs text-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Orden</label>
                  <input 
                    type="number" value={formData.order} required
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Icono</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" value={formData.icon} required
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      placeholder="Ej: Package"
                      className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-sm"
                    />
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
                      {getIconByName(formData.icon || 'Layout', 24)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                <Search size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] text-blue-700 font-bold leading-tight">Usa nombres de Lucide React (PascalCase).</p>
                  <a href="https://lucide.dev/icons/" target="_blank" className="text-[10px] text-blue-500 underline flex items-center gap-1 font-bold">
                    Explorar iconos <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-4 text-gray-400 font-bold hover:text-gray-600 transition uppercase text-[10px] tracking-widest">
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-[2] px-4 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 uppercase text-[10px] tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}