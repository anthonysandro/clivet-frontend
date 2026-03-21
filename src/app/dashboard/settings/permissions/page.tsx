'use client';

import React, { useState, useEffect } from 'react';
import { ConfigService, UserProfile, MenuOption } from '@/services/configService';
import { ShieldCheck, Save, Loader2, Info } from 'lucide-react';

export default function PermissionsMatrixPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargamos los datos maestros
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [profilesData, menusData] = await Promise.all([
          ConfigService.getProfiles(),
          ConfigService.getMenuOptions()
        ]);
        setProfiles(profilesData.filter(p => p.isActive));
        setMenus(menusData.filter(m => m.isActive).sort((a, b) => a.order - b.order));
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleToggleMenu = async (profileId: string, menuId: string) => {
    const profile = profiles.find(p => p.profileId === profileId);
    if (!profile) return;

    // Lógica para agregar o quitar el ID del menú de la lista de menuOptions del perfil
    const currentMenus = profile.menuOptions || [];
    const newMenus = currentMenus.includes(menuId)
      ? currentMenus.filter(id => id !== menuId)
      : [...currentMenus, menuId];

    // Actualizamos localmente para feedback inmediato
    setProfiles(prev => prev.map(p => 
      p.profileId === profileId ? { ...p, menuOptions: newMenus } : p
    ));
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      // Guardamos los cambios de todos los perfiles modificados
      await Promise.all(profiles.map(p => 
        ConfigService.updateProfile(p.profileId!, { 
          name: p.name, 
          menuOptions: p.menuOptions,
          isActive: p.isActive 
        })
      ));
      alert("Permisos actualizados con éxito 🚀");
    } catch (error) {
      alert("Error al guardar los permisos");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-indigo-600" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto text-left">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600 w-8 h-8" /> Matriz de Permisos
          </h1>
          <p className="text-gray-500">Asigna qué módulos puede ver cada perfil de usuario.</p>
        </div>
        <button 
          onClick={savePermissions}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 font-bold"
        >
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={20} />}
          Guardar Cambios
        </button>
      </header>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 flex gap-3 items-start">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-blue-700">
          Marca los módulos que aparecerán en el menú lateral para cada rol. 
          Los cambios se aplicarán la próxima vez que los usuarios inicien sesión.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 sticky left-0 bg-gray-50 z-10">
                Módulos del Sistema
              </th>
              {profiles.map(profile => (
                <th key={profile.profileId} className="px-6 py-5 text-center text-xs font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100 min-w-[120px]">
                  {profile.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {menus.map(menu => (
              <tr key={menu.menuId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5 font-semibold text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50">
                  <div className="flex flex-col">
                    <span>{menu.title}</span>
                    <span className="text-[10px] text-gray-400 font-mono font-normal tracking-tighter">{menu.path}</span>
                  </div>
                </td>
                {profiles.map(profile => {
                  const hasAccess = profile.menuOptions?.includes(menu.menuId!);
                  return (
                    <td key={`${profile.profileId}-${menu.menuId}`} className="px-6 py-5 text-center">
                      <label className="relative inline-flex items-center cursor-pointer justify-center">
                        <input 
                          type="checkbox" 
                          checked={hasAccess} 
                          onChange={() => handleToggleMenu(profile.profileId!, menu.menuId!)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}