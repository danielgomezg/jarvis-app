"use client";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import CardCustom from "@/components/card/CardCustom";
import CardHeaderCustom from "@/components/card/CardHeaderCustom";
import CardContentCustom from "@/components/card/CardContentCustom";
import CardFooterCustom from "@/components/card/CardFooterCustom";
import ImageCustom from "@/components/ImageCustom";
import FormField from "@/components/forms/FormField";
import { loginFields } from "@/data/auth/login-fields";
import { socialNetworks } from "@/data/auth/social-networks";
import ButtonCustom from "@/components/ButtonCustom";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { loginSchema, LoginFormData } from "@/schemas/auth/auth-schema";
import { useLogin } from "@/hooks/auth/useLogin";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { login, success, loading } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const onsubmit = async (data: LoginFormData) => {
    try {
      //console.log(data);
      const response = await login(data);
      setUser(response); //guarda { email, userName, firstName, lastName }
      console.log("Login exitoso:", response);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  const handleResendVerification = () => {
    router.push("/resend-verification");
  };

  const handleSocialLogin = async (nameOAuth: string) => {
    //console.log("nombre: ", nameOAuth);
    window.location.assign(
      `${process.env.NEXT_PUBLIC_NESTJS_API_URL}/auth/${nameOAuth}`,
    );
  };

  useEffect(() => {
    if (success && !loading) {
      //router.push("/");
      window.location.href = "/"; // Redirige a la página de inicio después del login exitoso
    }
  }, [success, loading]);

  return (
    <form onSubmit={handleSubmit(onsubmit)}>
      <CardCustom>
        <CardHeaderCustom>
          <CardTitle className="text-xl font-bold">
            Bienvenido a Jarvis
          </CardTitle>
          <ImageCustom
            src="/assets/images/jarvis_app_logo.png"
            alt="Logo Jarvis"
            width={140}
            height={140}
          />
        </CardHeaderCustom>

        <CardContentCustom>
          {loginFields.map((field) => (
            <FormField
              key={field.id}
              {...field}
              register={register}
              error={errors[field.id as keyof LoginFormData]}
              {...(field.id === "password" && {
                showPassword: showPassword,
                togglePasswordVisibility: setShowPassword,
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
                <Loader2 className="mr-2 animate-spin" /> iniciando
                sesion...{" "}
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
          <ButtonCustom
            type="button"
            variant={"link"}
            classNameCustom="bg-transparent text-xs text-gray-400  p-0 h-auto mx-auto hover:text-orange-500 transition-colors"
            onClick={handleResendVerification}
          >
            ¿No verificaste tu correo? Reenviar enlace
          </ButtonCustom>

          <div className="flex w-full items-center justify-center gap-2">
            <Separator className="flex-1" />
            <p className="text-center text-gray-500 shrink-0">
              O iniciar sesión con
            </p>
            <Separator className="flex-1" />
          </div>

          <div className="flex gap-4 justify-center">
            {socialNetworks.map((network) => (
              <ButtonCustom
                key={network.name}
                variant="outline"
                size="icon-sm"
                type="button"
                classNameCustom="w-10 h-10 rounded-full bg-transparent text-black hover:border-orange-300 hover:bg-orange-50 transition-all"
                onClick={() => handleSocialLogin(network.name)}
              >
                {network.icon}
              </ButtonCustom>
            ))}
          </div>

          <div className="flex flex-col w-full items-center justify-center gap-2">
            <Separator className="" />
            <p className="text-center text-gray-500 shrink-0">
              No tienes una cuenta?
            </p>
            <Button
              variant="link"
              type="button"
              className="text-sm text-gray-500 underline font-bold cursor-pointer p-0 h-auto"
              onClick={() => {
                router.push("/register");
              }}
            >
              Regístrate aquí
            </Button>
          </div>
        </CardFooterCustom>
      </CardCustom>
    </form>
  );
}
