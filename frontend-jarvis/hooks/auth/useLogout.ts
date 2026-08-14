import { useState } from "react";
import { AuthService } from "@/services/auth/auth.service";
import axios from "axios";

export function useLogout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const logout = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await AuthService.logout();
      setSuccess(true);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // Mensaje específico que devuelve tu backend (ej: ConflictException)
        setError(err.response.data?.message || "Error al cerrar sesión.");
      } else {
        setError("Error de conexión. Intenta nuevamente.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading, error, success };
}
