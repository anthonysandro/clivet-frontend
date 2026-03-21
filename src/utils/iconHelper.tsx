import React from 'react';
import * as Icons from 'lucide-react';

/**
 * Convierte un nombre de string (ej: 'Dog') en un componente de Lucide React.
 * @param name Nombre del icono en PascalCase
 * @param size Tamaño en píxeles
 */
export const getIconByName = (name: string, size = 20) => {
  // Buscamos el componente dentro del objeto Icons de lucide-react
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Si el nombre no existe o está mal escrito, devuelve un icono de ayuda por defecto
    return <Icons.HelpCircle size={size} className="opacity-50" />;
  }

  return <IconComponent size={size} />;
};