'use client';
import Link from 'next/link';
import { Layers, ShieldCheck, PawPrint, ListTree, Settings, Globe, MapPin } from 'lucide-react';

const settingOptions = [
  {
    title: 'Servicios y Categorías',
    description: 'Configura las líneas de negocio (Estética, Clínica) y sub-categorías.',
    icon: <Layers size={24} />,
    href: '/dashboard/settings/services',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    title: 'Perfiles y Roles',
    description: 'Define quién es Admin, Veterinario o Recepcionista.',
    icon: <ShieldCheck size={24} />,
    href: '/dashboard/settings/profiles',
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  {
    title: 'Especies y Razas',
    description: 'Catálogo maestro para el registro de pacientes.',
    icon: <PawPrint size={24} />,
    href: '/dashboard/species',
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  {
    title: 'Canales de Reserva',
    description: 'Gestiona los medios por los que tus clientes agendan (Web, WhatsApp, etc.).',
    icon: <Globe size={24} />,
    href: '/dashboard/settings/channels',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  },
  {
    title: 'Sedes',
    description: 'Registra y gestiona las sucursales y locales de la clínica.',
    icon: <MapPin size={24} />,
    href: '/dashboard/settings/branches',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    title: 'Opciones de Menú',
    description: 'Administra los módulos y accesos del sistema.',
    icon: <ListTree size={24} />,
    href: '/dashboard/settings/menu-manager',
    color: 'text-green-600',
    bg: 'bg-green-50'
  }
];

export default function SettingsHubPage() {
  return (
    <div className="p-8 bg-gray-50 h-full overflow-y-auto text-left">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-7 h-7 text-gray-600" />
            Panel de Configuración
          </h1>
          <p className="text-gray-500">Administra los parámetros maestros de tu clínica.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingOptions.map((opt, idx) => (
            <Link key={idx} href={opt.href} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group">
              <div className={`${opt.bg} ${opt.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                {opt.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{opt.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{opt.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}