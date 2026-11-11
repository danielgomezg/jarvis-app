"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "@/services/profile/profile.service";
import type { UpdateProfilePayload } from "@/types/profile/profile.types";
import axios from "axios";

async function fetchUpdatedProfile(data: UpdateProfilePayload) {
  try {
    console.log("ENviando perfil ", data);
    console.log("fecha ", data.birthDate, "tipo ", typeof data.birthDate);
    const res = await ProfileService.updateProfile(data);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      // Mensaje específico que devuelve tu backend (ej: ConflictException)
      throw new Error(
        err.response.data?.message || "Error al actualizar el perfil.",
      );
    } else {
      throw new Error("Error de conexión. Intenta nuevamente.");
    }
  }
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  //Significado de los estados de React Query:
  // isIdle: La mutación aún no se ha ejecutado.
  // isPending: La mutación está en proceso.
  // isSuccess: La mutación se completó con éxito.
  // isError: La mutación falló.
  // isPaused: La mutación está pausada (por ejemplo, si la aplicación pierde conexión a internet).
  // reset: Función que reinicia el estado de la mutación a su estado inicial (isIdle).
  // mutate: Función que ejecuta la mutación. Se llama con los datos que deseas enviar a la API.
  // error: Contiene información sobre el error si la mutación falla.
  // data: Contiene la respuesta de la mutación si se completa con éxito (objeto).
  // Recordar que existen mas estados y funciones, pero estos son los más relevantes para la mayoría de los casos de uso.
  // Nota: generalmente podrias retornar solo useMutation, pero en este caso se retorna un objeto con los estados y funciones para tener un control más granular sobre la mutación y su estado. Ademas como se esta aprendiendo React Query, es útil ver explícitamente qué estados y funciones son mas relevantes.
  const {
    mutate,
    error,
    data,
    isPending,
    isError,
    isIdle,
    isSuccess,
    isPaused,
    reset,
  } = useMutation({
    mutationFn: fetchUpdatedProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return {
    mutate,
    error,
    data,
    isPending,
    isError,
    isIdle,
    isSuccess,
    isPaused,
    reset,
  };
}
