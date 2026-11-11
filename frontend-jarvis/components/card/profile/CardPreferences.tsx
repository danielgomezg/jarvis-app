import { Label } from "@/components/ui/label";
import CardCustom from "../CardCustom";
import { Utensils, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "react-hook-form";
import { ProfileFormData } from "@/schemas/profile/profile-schema";
import { Controller, Control } from "react-hook-form";
import ChipInput from "@/components/forms/profile/ChipInput";

interface preferencesProps {
  defaultServings: number;
  isEditing: boolean;
  error?: FieldError;
  control: Control<ProfileFormData>;
  valueDietaryPreferences: string;
  setValueDietaryPreferences: (value: string) => void;
  listSuggestions?: string[];
  removePreference: (
    nameArray: "dietaryPreferences" | "allergenWarnings",
    preferenceToDeleted: string,
  ) => void;
}

export default function CardPreferences({
  defaultServings,
  isEditing,
  error,
  control,
  valueDietaryPreferences,
  setValueDietaryPreferences,
  listSuggestions,
  removePreference,
}: preferencesProps) {
  return (
    <CardCustom classNameCustom="p-6 shadow-sm flex flex-col gap-5 border border-[rgba(0,0,0,0.06)]">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
        <Utensils size={16} className="text-orange-500" />
        Preferencias culinarias
      </h3>

      {/* Default servings */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-gray-400">
          Porciones por defecto
        </Label>

        {isEditing ? (
          <Controller
            name="defaultServings"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 hover:bg-orange-50 hover:text-orange-500 transition-all cursor-pointer"
                  onClick={
                    () => field.onChange(field.value > 1 ? field.value - 1 : 1)
                    //onChange(field.value > 1 ? field.value - 1 : 1)
                  }
                >
                  -
                </Button>
                <span className="text-xl font-bold text-gray-800 w-6 text-center">
                  {field.value}
                </span>{" "}
                <Button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 hover:bg-orange-50 hover:text-orange-500 transition-all cursor-pointer"
                  onClick={
                    () =>
                      field.onChange(
                        field.value < 1000 ? field.value + 1 : 1000,
                      )
                    //onChange(field.value < 1000 ? field.value + 1 : 1000)
                  }
                >
                  {" "}
                  +{" "}
                </Button>{" "}
                <span className="text-sm text-gray-400">
                  persona{field.value === 1 ? "" : "s"}
                </span>
              </div>
            )}
          />
        ) : (
          <p className="text-sm px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-[#f9fafb] text-gray-700">
            <Users size={14} className="text-orange-400" /> {defaultServings}{" "}
            {defaultServings === 1 ? "persona" : "personas"}
          </p>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}

      {/* Dietary preferences */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-gray-400">
          Preferencias dietéticas
        </Label>

        <ChipInput
          editing={isEditing}
          control={control}
          placeholder="EJ: vegetariano, keto..."
          value={valueDietaryPreferences}
          setValue={setValueDietaryPreferences}
          listSuggestions={listSuggestions}
          nameArray="dietaryPreferences"
          removePreference={removePreference}
        />
      </div>
    </CardCustom>
  );
}
