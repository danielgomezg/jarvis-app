import CardCustom from "../CardCustom";
import { ShieldAlert } from "lucide-react";
import { Control } from "react-hook-form";
import { ProfileFormData } from "@/schemas/profile/profile-schema";
import ChipInput from "@/components/forms/profile/ChipInput";

interface allergensProps {
  isEditing: boolean;
  control: Control<ProfileFormData>;
  valueAllergen: string;
  setValueAllergen: (value: string) => void;
  listSuggestions?: string[];
  removePreference: (
    nameArray: "dietaryPreferences" | "allergenWarnings",
    preferenceToDeleted: string,
  ) => void;
}

export default function CardAllergens({
  isEditing,
  control,
  valueAllergen,
  setValueAllergen,
  listSuggestions,
  removePreference,
}: allergensProps) {
  return (
    <CardCustom classNameCustom="p-6 shadow-sm flex flex-col gap-5 border border-[rgba(0,0,0,0.06)]">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        <ShieldAlert size={16} className="text-red-400" /> Alertas de alérgenos
      </h3>

      {/* Allergen */}
      <div className="flex flex-col gap-2">
        <ChipInput
          editing={isEditing}
          control={control}
          placeholder="Ej: Gluten, Lacteos..."
          value={valueAllergen}
          setValue={setValueAllergen}
          listSuggestions={listSuggestions}
          nameArray="allergenWarnings"
          removePreference={removePreference}
        />
      </div>
    </CardCustom>
  );
}
