import { useState } from "react";
import { AuthService } from "@/services/auth/auth.service";
import { LoginDto } from "@/types/auth/auth.types";
import axios from "axios";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const login = async (data: LoginDto) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await AuthService.login(data);
      setSuccess(true);
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

  return { login, loading, error, success };
}
