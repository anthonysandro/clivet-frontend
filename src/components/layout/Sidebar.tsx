'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConfigService, MenuOption } from '@/services/configService';
import { getIconByName } from '@/utils/iconHelper'; // ✅ Tu nuevo helper
import { Loader2, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      // ✅ Cargamos los menús registrados en DynamoDB
      const data = await ConfigService.getMenuOptions();
      // Ordenamos por el campo 'order' y filtramos solo los activos
      const activeMenus = data
        .filter(m => m.isActive)
        .sort((a, b) => a.order - b.order);
      setMenus(activeMenus);
    } catch (error) {
      console.error("Error cargando el menú dinámico:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen sticky top-0 flex flex-col p-4">
      <div className="mb-10 px-4">
        <h2 className="text-2xl font-black text-indigo-600 tracking-tight">CliVet</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">SaaS Management</p>
      </div>

      <nav className="flex-1 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-gray-200" size={24} />
          </div>
        ) : (
          menus.map((menu) => {
            const isActive = pathname === menu.path;
            return (
              <Link key={menu.menuId} href={menu.path}>
                <div className={`
                  group flex items-center justify-between p-3 rounded-2xl transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'}
                `}>
                  <div className="flex items-center gap-3">
                    <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'}`}>
                      {/* ✅ USAMOS EL HELPER AQUÍ */}
                      {getIconByName(menu.icon, 20)}
                    </div>
                    <span className="font-bold text-sm">{menu.title}</span>
                  </div>
                  {isActive && <ChevronRight size={14} />}
                </div>
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer del Sidebar */}
      <div className="pt-4 border-t border-gray-50">
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Soporte IA activo</p>
        </div>
      </div>
    </aside>
  );
}