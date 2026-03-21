'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Package, Users, PawPrint, Settings, CalendarDays, Loader2 } from 'lucide-react';
import { ConfigService, MenuOption } from '@/services/configService';
import { fetchUserAttributes } from 'aws-amplify/auth';

// Mapeo de colores para las tarjetas dinámicas
const COLOR_MAP: Record<string, string> = {
  '/dashboard/service-requests': 'bg-purple-500',
  '/dashboard/chat': 'bg-green-500',
  '/dashboard/products': 'bg-indigo-500',
  '/dashboard/users': 'bg-blue-500',
  '/dashboard/clients': 'bg-orange-500',
  '/dashboard/species': 'bg-gray-600',
  '/dashboard/settings': 'bg-slate-700',
};

export default function DashboardMenu() {
  const [allowedMenus, setAllowedMenus] = useState<MenuOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const profileId = attributes['custom:profileId'] || 'admin-default'; // Ajustar según tu lógica

        const [profile, allMenus] = await Promise.all([
          ConfigService.getProfileById(profileId),
          ConfigService.getMenuOptions()
        ]);

        const filtered = allMenus.filter(m => 
          m.isActive && profile.menuOptions?.includes(m.menuId!)
        ).sort((a, b) => a.order - b.order);

        setAllowedMenus(filtered);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPermissions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto text-left">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
          <p className="text-gray-600 mt-2 text-lg">Bienvenido al sistema de gestión CliVet.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allowedMenus.map((menu) => (
            <Link 
              key={menu.menuId} 
              href={menu.path} 
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-start gap-5 cursor-pointer"
            >
              <div className={`${COLOR_MAP[menu.path] || 'bg-gray-400'} p-4 rounded-xl shadow-md shrink-0 transition-transform group-hover:rotate-3`}>
                {/* Aquí puedes usar un mapeo de iconos similar al del layout */}
                <Settings size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                  {menu.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">Acceder al módulo de {menu.title}.</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}