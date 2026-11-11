import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
import CalendarField from "@/components/forms/profile/CalendarField";
import {
  UseFormRegister,
  FieldError,
  FieldValues,
  Control,
  Controller,
} from "react-hook-form";
import { ProfileFormData } from "@/schemas/profile/profile-schema";

interface FieldProfileProps<T extends FieldValues> {
  label: string;
  id: keyof ProfileFormData;
  Icon?: React.ReactNode;
  placeholder?: string;
  editing?: boolean;
  formatInput: string;
  optionsSelect?: readonly string[];
  register: UseFormRegister<T>;
  error?: FieldError;
  control: Control<ProfileFormData>;
}

export default function FieldProfile<T extends FieldValues>({
  label,
  id,
  Icon,
  placeholder,
  editing,
  formatInput,
  optionsSelect,
  register,
  error,
  control,
}: FieldProfileProps<T>) {
  return (
    <>
      <Field>
        <FieldLabel>
          {Icon && Icon} {label}
        </FieldLabel>
        {formatInput === "select" ? (
          <Controller
            name={id}
            control={control}
            render={({ field }) => (
              <Select
                disabled={!editing}
                value={field.value as string | undefined}
                onValueChange={(value) => {
                  if (value !== "") {
                    field.onChange(value);
                  }
                }}
              >
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {optionsSelect?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        ) : formatInput === "date" ? (
          <Controller
            name={id}
            control={control}
            render={({ field }) => (
              <CalendarField
                isDisable={editing}
                date={field.value as Date | undefined}
                setDate={field.onChange}
              />
            )}
          />
        ) : (
          <Input
            placeholder={placeholder}
            disabled={!editing}
            type={id === ("phone" as keyof T) ? "tel" : "text"}
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register(id as any)}
          />
        )}
      </Field>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </>
  );
}
