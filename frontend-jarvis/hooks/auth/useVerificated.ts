import { useState } from "react";
import { AuthService } from "@/services/auth/auth.service";
import axios from "axios";

//Funcion De Resend Confirmation
export function useVerificated() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const verification = async (token: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await AuthService.verifyEmail(token);
      setSuccess(true);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // Mensaje específico que devuelve tu backend (ej: ConflictException)
        setError(
          err.response.data?.message ||
            "Error al verificar el correo. Intenta nuevamente.",
        );
      } else {
        setError("Error de conexión. Intenta nuevamente.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { verification, loading, error, success };
}
