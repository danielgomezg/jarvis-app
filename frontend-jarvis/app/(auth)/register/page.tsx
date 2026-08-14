"use client";
import CardCustom from "@/components/card/CardCustom";
import CardHeaderCustom from "@/components/card/CardHeaderCustom";
import CardContentCustom from "@/components/card/CardContentCustom";
import CardFooterCustom from "@/components/card/CardFooterCustom";
import { CardTitle } from "@/components/ui/card";
import ImageCustom from "@/components/ImageCustom";
import { registerFields } from "@/data/auth/register-fields";
import FormField from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { socialNetworks } from "@/data/auth/social-networks";
import { useRouter } from "next/navigation";
import ButtonCustom from "@/components/ButtonCustom";
import { useRegister } from "@/hooks/auth/useRegister";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { RegisterFormData, registerSchema } from "@/schemas/auth/auth-schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: standardSchemaResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      userName: "",
      firstName: "",
      lastName: "",
    },
  });
  const {
    register: executeRegisterApi,
    success,
    error,
    loading,
  } = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      console.log(data);
      await executeRegisterApi(data);
      console.log("SE REGISTRO");
      //TOAST  toast.success("¡Registro exitoso! Revisa tu correo para verificar tu cuenta.");
      //aun no probado
      router.push("/confirmation");
    } catch {
      console.log("ERROR");
      console.log(error);
      //toast.error(error || "Error al registrar usuario.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardCustom classNameCustom="max-w-md">
        <CardHeaderCustom>
          <CardTitle className="text-xl font-bold">Crear cuenta</CardTitle>
          <ImageCustom
            src="/assets/images/jarvis_app_logo.png"
            alt="Logo Jarvis"
            width={140}
            height={140}
          />
        </CardHeaderCustom>

        <CardContentCustom classNameCustom="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registerFields.map((field) => (
            <FormField
              key={field.id}
              {...field}
              register={register} // Pasamos el error específico si existe
              error={errors[field.id as keyof RegisterFormData]}
              {...(field.id === "password" && {
                showPassword: showPassword,
                togglePasswordVisibility: setShowPassword,
              })}
              {...(field.id === "confirmPassword" && {
                showPassword: showConfirmPassword,
                togglePasswordVisibility: setShowConfirmPassword,
              })}
            />
          ))}
        </CardContentCustom>

        <CardFooterCustom>
          <Button
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition cursor-pointer"
            type="submit"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" /> Registrando...{" "}
              </>
            ) : (
              "Registrarse"
            )}
          </Button>

          <div className="flex w-full items-center justify-center gap-2">
            <Separator className="flex-1" />
            <p className="text-center text-gray-500 shrink-0">
              O registrarse con
            </p>
            <Separator className="flex-1" />
          </div>

          <div className="flex gap-4 justify-center">
            {socialNetworks.map((network) => (
              <ButtonCustom
                key={network.name}
                variant="outline"
                size="icon-sm"
                classNameCustom="w-10 h-10 rounded-full bg-transparent text-black hover:border-orange-300 hover:bg-orange-50 transition-all"
                onClick={() => "handleSocialLogin(network.name)"}
              >
                {network.icon}
              </ButtonCustom>
            ))}
          </div>

          <div className="flex flex-col w-full items-center justify-center gap-2">
            <Separator className="" />
            <p className="text-center text-gray-500 shrink-0">
              ya tienes una cuenta?
            </p>
            <Button
              variant="link"
              className="text-sm text-gray-500 underline font-bold cursor-pointer p-0 h-auto"
              type="button"
              onClick={() => {
                router.push("/login");
              }}
            >
              Inicia sesión aquí
            </Button>
          </div>
        </CardFooterCustom>
      </CardCustom>
    </form>
  );
}
