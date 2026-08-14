import { useState } from "react";
import { AuthService } from "@/services/auth/auth.service";
import { ConfirmationDto } from "@/types/auth/auth.types";
import axios from "axios";

//Funcion De Resend Confirmation
export function useConfirmation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const confirmation = async (data: ConfirmationDto) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await AuthService.confirmation(data);
      setSuccess(true);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // Mensaje específico que devuelve tu backend (ej: ConflictException)
        setError(
          err.response.data?.message ||
            "Error al reenviar email de confirmación.",
        );
      } else {
        setError("Error de conexión. Intenta nuevamente.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { confirmation, loading, error, success };
}
