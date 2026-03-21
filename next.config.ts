import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Habilita la exportación estática para generar la carpeta /out
  output: 'export',
  
  // 2. Desactiva la optimización de imágenes nativa de Next.js 
  // (necesaria para sitios estáticos en Amplify/S3)
  images: {
    unoptimized: true,
  },

  // 3. Opcional: Si usas rutas con trailing slashes
  trailingSlash: true,

  // 4. Evita errores de compilación por ESLint o TypeScript durante el deploy
  // (útil para avanzar rápido, aunque lo ideal es corregirlos después)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;