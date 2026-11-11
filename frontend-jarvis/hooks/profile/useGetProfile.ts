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
    if (axios.isAxiosError(err) && err.response) {
      // Mensaje específico que devuelve tu backend (ej: ConflictException)
      throw new Error(
        err.response.data?.message || "Error al obtener el perfil.",
      );
    } else {
      throw new Error("Error de conexión. Intenta nuevamente.");
    }
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
