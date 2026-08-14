import { useState } from "react";
import { AuthService } from "@/services/auth/auth.service";
import { RegisterDto } from "@/types/auth/auth.types";
import axios from "axios";

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const register = async (data: RegisterDto) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await AuthService.register(data);
      setSuccess(true);
      return res.data;
    } catch (err) {
      let message = "Error de conexión. Intenta nuevamente.";
      if (axios.isAxiosError(err) && err.response) {
        // Mensaje específico que devuelve tu backend (ej: ConflictException)
        message = err.response.data?.message || "Error al registrar usuario.";
      }
      setError(message);

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, success };
}
