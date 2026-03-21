import axios from 'axios';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

console.log('[FRONTEND] API Base URL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
});

/**
 * INTERCEPTOR DE PETICIONES (REQUEST)
 * Se encarga de adjuntar el token de Cognito a cada llamada.
 */
api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;

    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken.toString()}`;
      
      const tenantId = idToken.payload['custom:tenantId'];
      
      // 💡 AÑADE ESTO PARA DEPURAR:
      //console.log('[DEBUG API] TenantID en Token:', tenantId);
      //console.log('[DEBUG API] Payload Completo:', idToken.payload);

      if (tenantId) {
        config.headers['x-tenant-id'] = tenantId as string;
      }
    }
    return config;
  } catch (e) {
    console.error('API Interceptor [Request]: Error al obtener la sesión.', e);
    return config;
  }
});

/**
 * INTERCEPTOR DE RESPUESTAS (RESPONSE)
 * Maneja errores globales, especialmente la revocación de sesiones (401).
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el servidor responde 401 (Unauthorized), el token no es válido
    // Esto ocurre tras un Global Sign Out o cuando el usuario es bloqueado
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      console.warn('API Interceptor [Response]: Sesión no autorizada o revocada.');

      try {
        // 1. Forzamos el cierre de sesión en Amplify para limpiar caché local
        await signOut();
        
        // 2. Redirigimos al login con un parámetro para informar al usuario
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session_expired';
        }
      } catch (signOutError) {
        console.error('Error al cerrar sesión tras 401:', signOutError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;