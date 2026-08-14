import axios from "axios";

// 1. Instancia para conectar con tu Backend (NestJS)
export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_NESTJS_API_URL || "http://localhost:4000/api", //url de ejemplo
  withCredentials: true,
});

// 2. Instancia para conectar con los Route Handlers de Next.js
export const nextApi = axios.create({
  baseURL: "",
  withCredentials: true,
});

//3. Instancia para conectar con los Route Handlers de Next.js para peticiones privadas (que requieren refreshToken y accessToken)
export const apiPrivate = axios.create({
  baseURL: "/api/proxy", // apunta al route handler, no al backend directo
  withCredentials: true,
});

// 3. Variables de control para la cola de peticiones concurrentes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = []; //libera memoria de la cola
};

// 4. Interceptor de respuestas adjuntado a la instancia principal (api)
apiPrivate.interceptors.response.use(
  (response) => response,
  // Interceptor de errores
  async (error) => {
    // Guardamos la petición original para reintentos
    const originalRequest = error.config;

    // Si no hay config (error raro de red) o no es 401, no hacemos nada
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Si es 401 y NO ha sido reintentada todavía
    if (!originalRequest._retry) {
      originalRequest._retry = true;

      // Si otra petición ya está refrescando el token, nos unimos a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiPrivate(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      // Marcamos que estamos refrescando el token
      isRefreshing = true;

      try {
        // Llamamos al Endpoint de Next.js para refrescar las cookies
        await nextApi.post("/api/auth/refresh");

        processQueue(null); // Desbloqueamos las peticiones en espera
        return apiPrivate(originalRequest); // Reintentamos la petición actual
      } catch (err) {
        processQueue(err); // Cancelamos las peticiones en espera

        // Redirigimos al login de Next.js de forma segura
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Si ya tenía _retry = true y volvió a dar 401, rompemos el bucle aquí
    return Promise.reject(error);
  },
);
