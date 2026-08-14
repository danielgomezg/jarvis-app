"use client";
import CardCustom from "@/components/card/CardCustom";
import CardHeaderCustom from "@/components/card/CardHeaderCustom";
import CardContentCustom from "@/components/card/CardContentCustom";
import CardFooterCustom from "@/components/card/CardFooterCustom";
import { CardTitle } from "@/components/ui/card";
import {
  Mail,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import ButtonCustom from "@/components/ButtonCustom";
import { useEffect, useState } from "react";
import { useConfirmation } from "@/hooks/auth/useConfirmation";
import { useRouter, useSearchParams } from "next/navigation";

const RESEND_SECONDS = 60;

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmation, loading, error, success } = useConfirmation();
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resendCount, setResendCount] = useState(0);
  const [justResent, setJustResent] = useState(false);
  const [message, setMessage] = useState<string | null>(
    "Correo reenviado correctamente",
  );
  const canResend = countdown === 0;
  const email = searchParams.get("email") || "";

  const steps = [
    { n: "1", text: "Abre el correo que te enviamos" },
    { n: "2", text: "Haz clic en el enlace de verificación" },
    { n: "3", text: "¡Listo! Tu cuenta estará activa" },
  ];

  useEffect(() => {
    if (countdown === 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    try {
      const res = await confirmation({ email });
      setMessage(res.message || "Correo reenviado correctamente");
      /*setCountdown(RESEND_SECONDS);
      setResendCount((prevCount) => prevCount + 1);
      setJustResent(true);
      setTimeout(() => setJustResent(false), 3000);*/
    } catch (err) {
      console.error("Error al reenviar correo de verificación:", err);
      setMessage("Error al reenviar correo. Intenta nuevamente.");
    } finally {
      setCountdown(RESEND_SECONDS);
      setResendCount((prevCount) => prevCount + 1);
      setJustResent(true);
      setTimeout(() => setJustResent(false), 3000);
    }
  };

  const onBack = () => {
    router.push("/login");
  };

  return (
    <CardCustom>
      <CardHeaderCustom>
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-[#fff7ed]"
            animate={{
              // 1   → tamaño normal (100%)
              // 1.4 → crece un 40% más grande que el original
              // 1   → vuelve al tamaño normal
              scale: [1, 1.4, 1], // define el tamaño en distintos momentos de la animación (como un keyframe)
              // 0.7 → empieza semi-visible
              // 0   → se vuelve completamente invisible (cuando está más grande)
              // 0.7 → vuelve a ser semi-visible
              // Resultado: el círculo se desvanece justo cuando está más expandido,
              // simulando que "se disuelve" al crecer (efecto ripple/sonar)
              opacity: [0.7, 0, 0.7], //define la transparencia en los mismos momentos
            }}
            transition={{
              duration: 2, //cuánto tarda en completarse UN ciclo completo (en segundos)
              repeat: Infinity, //cuántas veces se repite la animación
              // ease: la curva de aceleración de la animación
              // "easeInOut" = empieza lento, acelera en el medio, termina lento
              // (se ve más natural que una velocidad constante)
              ease: "easeInOut",
            }}
          />
          <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10 bg-[#fff7ed] border-2 border-[rgba(249,115,22,0.2)]">
            <Mail size={28} />
          </div>

          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center z-20 border-2 border-white">
            <CheckCircle2 size={14} className="text-white"></CheckCircle2>
          </div>
        </div>

        <CardTitle>¡Revisa tu correo!</CardTitle>
        <p className="text-sm text-gray-500 leading-relaxed">
          Enviamos un enlace de verificación a
        </p>
        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-[#fff7ed] text-[#f97316]">
          {email}
        </span>
      </CardHeaderCustom>

      <Separator />

      <CardContentCustom>
        {steps.map((step) => (
          <div key={step.n} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-[#fff7ed] text-[#f97316]">
              {step.n}
            </div>
            <p className="text-sm text-gray-600">{step.text}</p>
          </div>
        ))}
      </CardContentCustom>

      <CardFooterCustom>
        {/* Resend feedback */}
        {justResent && !loading && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-[#f0fdf4] border-1 border-[#bbf7d0] text-[#16a34a]">
            <CheckCircle2 size={15} />
            {message}
          </div>
        )}
        <ButtonCustom
          onClick={handleResend}
          disabled={!canResend}
          classNameCustom={`w-full py-2 rounded transition-all cursor-pointer flex items-center justify-center gap-2 ${canResend ? "bg-[#f97316] text-[#fff]" : "bg-[#f3f3f5] text-[#9ca3af]"} border-none`}
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <>
              <RotateCcw size={15} className={canResend ? "" : "opacity-40"} />
              {canResend ? "Reenviar correo" : `Reenviar en ${countdown}s`}
            </>
          )}
        </ButtonCustom>

        {/* Progress bar */}
        {!canResend && (
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden -mt-2">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-1000"
              style={{
                width: `${((RESEND_SECONDS - countdown) / RESEND_SECONDS) * 100}%`,
              }}
            />
          </div>
        )}

        {resendCount > 0 && (
          <p className="text-xs text-center text-gray-400">
            Correo reenviado {resendCount} {resendCount === 1 ? "vez" : "veces"}{" "}
            · Revisa tu carpeta de spam
          </p>
        )}

        <Separator />

        <ButtonCustom
          variant={"link"}
          onClick={onBack}
          classNameCustom="bg-transparent text-gray-500 text-sm p-0 h-auto flex items-center gap-1.5 mx-auto hover:"
        >
          <ArrowLeft size={13} />
          Volver al registro
        </ButtonCustom>
      </CardFooterCustom>
    </CardCustom>
  );
}
