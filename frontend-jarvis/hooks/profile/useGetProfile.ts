"use client";
import { ProfileService } from "@/services/profile/profile.service";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { parseISO, addMinutes } from "date-fns";

async function fetchProfile() {
  try {
    const res = await ProfileService.me();
    const profile = res.data;

    if (profile && profile.birthDate) {
      // 1. Parseamos el string de forma segura con date-fns (evita problemas entre navegadores)
      const parsedDate =
        typeof profile.birthDate === "string"
          ? parseISO(profile.birthDate)
          : profile.birthDate;

      // 2. Neutralizamos el desfase sumando los minutos locales de forma explícita
      const timezoneOffset = parsedDate.getTimezoneOffset();

      // 3. Devolvemos el objeto Date perfectamente corregido
      profile.birthDate = addMinutes(parsedDate, timezoneOffset);
    }

    return profile;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    // Mensaje específico que devuelve tu backend (ej: ConflictException)
    const error = new Error(
      axios.isAxiosError(err) && err.response
        ? err.response.data?.message || "Error al obtener el perfil."
        : "Error de conexión. Intenta nuevamente.",
    ) as Error & { status?: number };
    error.status = status;
    throw error;
  }
}

// 2. Tu Custom Hook ahora consume React Query
export function useGetProfile() {
  const { data, isPending, isError, error, isSuccess } = useQuery({
    queryKey: ["profile"], // Identificador para la caché
    queryFn: fetchProfile, // Tu función que llama a Axios
  });

  // Retornamos la misma estructura que ya usabas en tus componentes para no romper nada
  return {
    profile: data || null,
    loading: isPending,
    error: isError ? error.message : null,
    success: isSuccess,
    // Nota: React Query se ejecuta automáticamente, ya no necesitas llamar a un método "getProfile()" manualmente.
  };
}
