import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { UseFormRegister, FieldError, FieldValues } from "react-hook-form";
import { RegisterFormData, LoginFormData } from "@/schemas/auth/auth-schema";
import { Eye, EyeClosed } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface FormFieldProps<T extends FieldValues> {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  showForgotPassword?: boolean;
  register: UseFormRegister<T>; //<RegisterFormData>;
  error?: FieldError;
  togglePasswordVisibility?: Dispatch<SetStateAction<boolean>>;
  showPassword?: boolean;
}

export default function FormField<T extends FieldValues>({
  id,
  label,
  type,
  placeholder,
  showForgotPassword,
  register,
  error,
  togglePasswordVisibility,
  showPassword,
}: FormFieldProps<T>) {
  return (
    <Field className="mb-2">
      <FieldLabel className="text-left mb-1">{label}</FieldLabel>
      {/*Al hacer spread (...), inyectas onChange, onBlur, name y ref automáticamente */}
      <div className="relative">
        <Input
          placeholder={placeholder}
          type={
            id.toLowerCase().includes("password")
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...register(id as any)}
        />
        {id.toLowerCase().includes("password") /*id === "password"*/ && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => togglePasswordVisibility?.((prev) => !prev)}
          >
            {showPassword ? <Eye></Eye> : <EyeClosed></EyeClosed>}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      {showForgotPassword && (
        <div className="flex justify-end mt-2">
          <Button
            variant="link"
            className="text-sm text-gray-500 cursor-pointer p-0 h-auto"
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </div>
      )}
    </Field>
  );
}
