"use client";
import CardContentCustom from "@/components/card/CardContentCustom";
import CardCustom from "@/components/card/CardCustom";
import CardHeaderCustom from "@/components/card/CardHeaderCustom";
import FormField from "@/components/forms/FormField";
import { CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import {
  resendVerificationSchema,
  ResendVerificationFormData,
} from "@/schemas/auth/auth-schema";
import CardFooterCustom from "@/components/card/CardFooterCustom";
import ButtonCustom from "@/components/ButtonCustom";
import { useRouter } from "next/navigation";
import { useConfirmation } from "@/hooks/auth/useConfirmation";

export default function ResendVerificationPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendVerificationFormData>({
    resolver: standardSchemaResolver(resendVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  const { confirmation, loading, error, success } = useConfirmation();

  const onSubmit = async (data: ResendVerificationFormData) => {
    try {
      console.log("Resend verification... ", data);
      const res = await confirmation(data);
      router.push(`/confirmation?email=${encodeURIComponent(data.email)}`);
      //router.push("/confirmation");
    } catch (err) {
      console.error("Error al reenviar correo de verificación:", err);
    }
  };

  const onBack = () => {
    console.log("Volver a iniciar sesión");
  };
  return (
    <CardCustom>
      <CardHeaderCustom>
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#fff7ed] border-2 border-[rgba(249,115,22,0.2)]">
            <Mail size={24} className="text-orange-500" />
          </div>
        </div>
        <CardTitle>Verificar correo</CardTitle>
        <p className="text-sm text-gray-500 leading-relaxed">
          Introduce tu correo y te enviaremos un nuevo enlace de verificación.
        </p>
      </CardHeaderCustom>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContentCustom>
          <FormField
            id="email"
            register={register}
            label="Correo electrónico"
            type="email"
            placeholder="ejemplo@gmail.com"
            error={
              errors[
                "resend-verification-email" as keyof ResendVerificationFormData
              ]
            }
          />
        </CardContentCustom>

        <CardFooterCustom>
          <div className="flex flex-col gap-4 mt-6 w-full">
            <ButtonCustom
              classNameCustom="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition cursor-pointer flex items-center justify-center gap-2"
              type="submit"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                "Enviar enlace"
              )}
            </ButtonCustom>

            <ButtonCustom
              type="button"
              variant={"link"}
              classNameCustom="text-sm text-gray-500 cursor-pointer p-0 h-auto flex items-center gap-1.5 mx-auto bg-transparent hover:text-orange-500 transition-colors"
              onClick={onBack}
            >
              <ArrowLeft size={13} />
              Volver a iniciar sesión
            </ButtonCustom>
          </div>
        </CardFooterCustom>
      </form>
    </CardCustom>
  );
}
