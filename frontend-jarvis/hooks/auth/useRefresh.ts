import { useState } from "react";
import { AuthService } from "@/services/auth/auth.service";
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

//refresca tokens
export function useRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { setUser } = useAuthStore();

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await AuthService.refresh();
      setSuccess(true);
      setUser(res.data); //GUARDAR DATOS DEL USER EN EL STORE ZUSTAND

      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // Mensaje específico que devuelve tu backend (ej: ConflictException)
        setError(err.response.data?.message || "Error al iniciar sesión.");
      } else {
        setError("Error de conexión. Intenta nuevamente.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { refresh, loading, error, success };
}
