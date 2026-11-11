import { Controller, Control, useWatch } from "react-hook-form";
import { ProfileFormData } from "@/schemas/profile/profile-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface ChipInputProps {
  editing?: boolean;
  control: Control<ProfileFormData>;
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  listSuggestions?: string[];
  maxItems?: number;
  nameArray: "dietaryPreferences" | "allergenWarnings"; //nombre del atributo del profile tipo array
  removePreference: (
    nameArray: "dietaryPreferences" | "allergenWarnings",
    preferenceToDeleted: string,
  ) => void;
}

export default function ChipInput({
  editing,
  control,
  placeholder,
  value,
  setValue,
  listSuggestions,
  maxItems = 25, //default backend 25
  nameArray,
  removePreference,
}: ChipInputProps) {
  const registeredPreferences = useWatch({
    name: nameArray,
    control,
  });

  //Controla el popover
  const [openSuggestion, setOpenSuggestion] = useState(false);

  //Normaliza un strign sacando espacios, tildes y dieresis (puntos sobre letras)
  const normalize = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // toda la lógica actual del onClick del botón +:
  // maxItems, duplicados, field.onChange, setValue("")
  const addChip = (
    arrayStrings: string[] | undefined,
    onChange: (event: string[]) => void,
    inputSuggestion: string = "",
  ) => {
    const current = arrayStrings ?? [];
    if (current.length >= maxItems) {
      return toast.error(`Solo se pueden añadir ${maxItems} items`);
    }
    const valueToArray = inputSuggestion ? inputSuggestion : value;
    const exists = current.some(
      (v) => normalize(v) === normalize(valueToArray),
    );
    onChange(
      exists ? current : [...current, valueToArray.trim().toLowerCase()],
    );
    setValue("");
  };

  //Cambiar texto por el valor del input que viene de control
  const filteredSuggestions = useMemo(() => {
    // Si el usuario limpia el input, puedes decidir mostrar todo o no mostrar nada (aquí no muestro nada)
    if (value.trim() === "" || !listSuggestions) return [];

    const textoBusqueda = normalize(value); //value.toLowerCase().trim();

    // Filtramos el array original
    return listSuggestions.filter((nombre) =>
      //nombre.toLowerCase().includes(textoBusqueda),
      normalize(nombre).includes(textoBusqueda),
    );
  }, [value, listSuggestions]);

  if (!editing) {
    if (registeredPreferences && registeredPreferences.length > 0) {
      return (
        <div className="flex flex-wrap gap-2">
          {registeredPreferences.map((preference) => (
            <span
              key={preference}
              className="text-xs px-3 py-1.5 rounded-full font-medium bg-[#fff7ed] text-[#f97316] border-[1.5px] border-[rgba(249,115,22,0.3)]"
            >
              {preference.charAt(0).toUpperCase() + preference.slice(1)}
            </span>
          ))}
        </div>
      );
    }
    return <p className="text-xs text-gray-300">Sin configurar</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Selected tags */}
      {registeredPreferences && registeredPreferences.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {registeredPreferences.map((preference) => (
            <span
              key={preference}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-[#fff7ed] text-[#f97316] border-[1.5px] border-[rgba(249,115,22,0.3)]"
            >
              {preference.charAt(0).toUpperCase() + preference.slice(1)}
              <Button
                className="flex items-center justify-center w-3.5 h-3.5 rounded-full transition-opacity hover:opacity-6 text-[#f97316] cursor-pointer"
                variant="ghost"
                type="button"
                onClick={() => {
                  removePreference(nameArray, preference);
                }}
              >
                <X size={10} strokeWidth={2.5} />
              </Button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <Controller
        name={nameArray}
        control={control}
        render={({ field }) => (
          <Popover open={openSuggestion} onOpenChange={setOpenSuggestion}>
            <PopoverAnchor asChild>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all bg-[#f3f3f5] border-[1.5px] border-transparent focus-within:border-[#f97316] focus-within:bg-white"
                onFocus={() => {}}
              >
                <Input
                  className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400 border-0 p-0 m-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={placeholder}
                  value={value}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // 1. Corta el envío implícito del form
                      // 2. Ejecuta la misma lógica que el botón + (agregar chip)
                      if (value.trim().length > 1)
                        addChip(field.value, field.onChange);
                    }
                  }}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (e.target.value.length > 0) setOpenSuggestion(true);
                  }}
                />
                <Button
                  className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all ${
                    value.trim()
                      ? "bg-gray-300  hover:bg-gray-400 transition-all"
                      : "bg-[#e5e7eb] cursor-not-allowed"
                  } cursor-pointer`}
                  disabled={value.trim().length < 2}
                  type="button"
                  onClick={() => {
                    addChip(field.value, field.onChange);
                  }}
                >
                  <Plus size={13} className="text-white" strokeWidth={2.5} />
                </Button>
              </div>
            </PopoverAnchor>

            {/* 4. Renderizamos las sugerencias filtradas abajo */}
            {value && (
              <PopoverContent
                className="w-[260px] p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex flex-col gap-1.5 p-3">
                  {listSuggestions &&
                    listSuggestions.length > 0 &&
                    filteredSuggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="ghost"
                        className="justify-start text-sm text-gray-700 hover:bg-[#f97316] hover:text-white transition-all hover:cursor-pointer"
                        onClick={() => {
                          setOpenSuggestion(false);
                          addChip(field.value, field.onChange, suggestion);
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                </div>
              </PopoverContent>
            )}
          </Popover>
        )}
      />
    </div>
  );
}
