'use client';
import { useEffect, useState } from 'react';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { useRouter, usePathname } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';
import Link from 'next/link';
import { 
  LayoutGrid, LogOut, Settings, ShieldCheck, 
  Loader2, ChevronRight, Menu as MenuIcon
} from 'lucide-react';
import { ConfigService, MenuOption } from '@/services/configService';
import { getIconByName } from '@/utils/iconHelper'; // ✅ Usamos tu nuevo helper

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [allowedMenus, setAllowedMenus] = useState<MenuOption[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const loadUserDataAndPermissions = async () => {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        
        if (mounted) {
          setUserEmail(attributes.email || user.username);
          setAuthStatus('authenticated');
          
          // ✅ CARGA DINÁMICA DE MENÚS DESDE DYNAMODB
          try {
            const menus = await ConfigService.getMenuOptions();
            // Filtramos activos y ordenamos por el campo 'order'
            const sortedMenus = menus
              .filter(m => m.isActive)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            setAllowedMenus(sortedMenus);
          } catch (menuError) {
            console.error("Error cargando menús dinámicos:", menuError);
          }
        }
      } catch (error) {
        if (mounted) {
          console.error("Auth error:", error);
          setAuthStatus('unauthenticated');
          router.push('/login');
        }
      } finally {
        if (mounted) setLoadingMenus(false);
      }
    };

    loadUserDataAndPermissions();

    const hubListenerCancel = Hub.listen('auth', ({ payload }) => {
      if (!mounted) return;
      if (payload.event === 'signedOut') {
        setAuthStatus('unauthenticated');
        router.push('/login');
      }
    });

    return () => {
      mounted = false;
      hubListenerCancel();
    };
  }, [router]);

  const handleSignOut = async () => {
    try { await signOut(); } catch (error) { console.error(error); }
  };

  if (authStatus === 'loading') {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white gap-4">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Cargando CliVet...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR DINÁMICO */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20">
        {/* LOGO AREA */}
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
            <PawPrintIcon className="text-white w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-800 tracking-tighter block leading-none">CliVet</span>
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Pet Software</span>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm mb-4 ${
              pathname === '/dashboard' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
            }`}
          >
            <LayoutGrid size={18} /> Inicio
          </Link>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">
              Módulos Activos
            </p>
            
            {loadingMenus ? (
              <div className="px-4 py-2"><Loader2 className="animate-spin text-gray-200" size={16} /></div>
            ) : (
              allowedMenus.map((menu) => {
                const isActive = pathname === menu.path;
                return (
                  <Link 
                    key={menu.menuId} 
                    href={menu.path} 
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* ✅ Renderizado Dinámico de Icono */}
                      <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>
                        {getIconByName(menu.icon || 'Layout', 18)}
                      </span>
                      {menu.title}
                    </div>
                    {isActive && <ChevronRight size={14} />}
                  </Link>
                );
              })
            )}
          </div>

        </nav>

        {/* PERFIL Y CIERRE DE SESIÓN */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Usuario</p>
              <p className="text-xs font-bold text-gray-700 truncate">{userEmail}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut} 
            className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 w-full py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-red-100"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative bg-white">
          {children}
      </main>
    </div>
  );
}

// Icono pequeño de apoyo
function PawPrintIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="20" cy="15" r="2" />
      <circle cx="8" cy="8" r="2" />
      <circle cx="4" cy="14" r="2" />
      <path d="M12 20c-2 0-4.5-1.5-4.5-4.5s2-4.5 4.5-4.5 4.5 1.5 4.5 4.5-2.5 4.5-4.5 4.5z" />
    </svg>
  );
}