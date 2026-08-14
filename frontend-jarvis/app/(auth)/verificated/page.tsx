"use client";
import CardCustom from "@/components/card/CardCustom";
import CardHeaderCustom from "@/components/card/CardHeaderCustom";
import CardContentCustom from "@/components/card/CardContentCustom";
import CardFooterCustom from "@/components/card/CardFooterCustom";
import ButtonCustom from "@/components/ButtonCustom";
import { CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingView from "@/components/status/LoadingViewCustom";
import ErrorView from "@/components/status/ErrorViewCustom";
import { useVerificated } from "@/hooks/auth/useVerificated";
import { ButtonCustomType } from "@/types/button.types";

const optionsList = [
  "Explorar recetas personalizadas con IA",
  "Gestionar tu despensa e ingredientes",
  "Planificar tu menú semanal",
  "Recibir recomendaciones de cocina",
  "Acceder a funciones premium de Jarvis",
  "Mas opciones y sorpresas en el futuro",
];

// AHORA PROBAR TODAS LAS VISTAS, Y LUEGO HACER EL HOME

export default function VerificatedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(() =>
    token ? "loading" : "error",
  );

  const { verification, loading, error, success } = useVerificated();

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        await verification(token);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  const onBack = () => {
    router.push("/login");
  };

  //estilos para botones en error view
  const primaryButton: ButtonCustomType = {
    classNameCustom:
      "w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition cursor-pointer",
    label: "Reenviar correo de verificación",
    action: () => {
      router.push("/resend-verification");
    },
  };

  const secondaryButton: ButtonCustomType = {
    classNameCustom:
      "text-sm text-gray-500 cursor-pointer mx-auto bg-transparent p-0 h-auto flex items-center gap-1.5 hover:",
    label: "Volver al inicio",
    action: () => {
      router.push("/login");
    },
    variant: "link",
  };

  if (status === "loading")
    return (
      <LoadingView
        title="Verificando tu cuenta..."
        message="Esto tomará solo un momento."
      />
    );
  if (status === "error")
    return (
      <ErrorView
        title="No pudimos verificar tu cuenta"
        message="El enlace expiró o ya fue utilizado. Podés solicitar uno nuevo."
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
      />
    );

  return (
    <CardCustom>
      <CardHeaderCustom>
        <div className="relative w-20 h-20 flex items-center justify-center mx-auto">
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10 bg-[#f0fdf4] border-2 border-[rgba(34,197,94,0.25)]">
            <CheckCircle2 size={30} className="text-green-500" />
          </div>
        </div>

        <CardTitle>¡Cuenta verificada!</CardTitle>
        <p className="text-sm text-gray-500 leading-relaxed">
          Tu correo electrónico ha sido verificado correctamente. Ya puedes
          acceder a tu asistente de cocina.
        </p>
      </CardHeaderCustom>

      <CardContentCustom>
        <div className="rounded-xl p-4 flex flex-col gap-3 bg-[#fff7ed] border border-[rgba(249,115,22,0.15)]">
          <p className="text-xs font-semibold text-orange-500 tracking-wide uppercase">
            ¿Qué puedes hacer ahora?
          </p>
          {optionsList.map((option) => (
            <div key={option} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
              <p className="text-sm text-gray-600">{option}</p>
            </div>
          ))}
        </div>
      </CardContentCustom>

      <CardFooterCustom>
        <ButtonCustom
          classNameCustom="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition cursor-pointer"
          text="Iniciar sesion"
          onClick={onBack}
        ></ButtonCustom>
      </CardFooterCustom>
    </CardCustom>
  );
}
