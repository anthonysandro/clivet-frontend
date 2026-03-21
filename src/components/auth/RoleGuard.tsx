'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { ConfigService } from '@/services/configService';
import { Loader2 } from 'lucide-react';

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      // 1. La raíz del dashboard siempre es accesible para usuarios logueados
      if (pathname === '/dashboard') {
        setIsAuthorized(true);
        return;
      }

      try {
        const attributes = await fetchUserAttributes();
        // Obtenemos el profileId (asegúrate de que este nombre coincida con tu atributo en Cognito)
        const profileId = attributes['custom:profileId'];

        if (!profileId) {
          console.warn("⚠️ Usuario sin custom:profileId. Permitido acceso temporal por desarrollo.");
          setIsAuthorized(true); // 👈 Cambia temporalmente a true para poder entrar y configurar
          return;
        }

        // 2. Cargamos el perfil y las opciones de menú en paralelo
        const [profile, allMenus] = await Promise.all([
          ConfigService.getProfileById(profileId),
          ConfigService.getMenuOptions()
        ]);

        // 3. Verificamos si la ruta actual coincide con algún menú permitido
        // Buscamos si el path actual comienza con la ruta definida en algún menú
        const currentMenu = allMenus.find(m => pathname.startsWith(m.path));

        if (currentMenu) {
          const hasPermission = profile.menuOptions?.includes(currentMenu.menuId!);
          if (hasPermission) {
            setIsAuthorized(true);
          } else {
            console.error("Acceso denegado: No tienes permiso para este módulo.");
            router.push('/dashboard');
          }
        } else {
          // Si es una ruta que no está registrada en el gestor de menús (ej: sub-páginas internas)
          // podrías elegir permitirla o bloquearla. Aquí la permitimos:
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Error en RoleGuard:", error);
        router.push('/dashboard');
      }
    };

    setIsAuthorized(null); // Reset en cada cambio de ruta
    checkAccess();
  }, [pathname, router]);

  // Mientras verifica, mostramos un estado de carga sutil
  if (isAuthorized === null) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/50 backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}