"use client";
import { useCallback, useEffect, useState } from "react";
import { useGetProfile } from "@/hooks/profile/useGetProfile";
import CardCustom from "@/components/card/CardCustom";
import { useAuthStore } from "@/store/auth.store";
import { User } from "lucide-react";
import CardHeaderProfile from "@/components/card/profile/CardHeaderProfile";
import CardHeaderCustom from "@/components/card/CardHeaderCustom";
import { CardTitle } from "@/components/ui/card";
import CardContentCustom from "@/components/card/CardContentCustom";
import {
  profileFormFields,
  optionsGender,
} from "@/data/profile/profile-form-fields";
import FieldProfile from "@/components/forms/profile/FieldProfile";
/* REACT HOOK FORMS */
import { FieldError, useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  profileSchema,
  ProfileFormData,
} from "@/schemas/profile/profile-schema";
import CardPreferences from "@/components/card/profile/CardPreferences";
import CardAllergens from "@/components/card/profile/CardAllergens";
import CardDeleteUser from "@/components/card/profile/CardDeleteUser";
import { useUpdateProfile } from "@/hooks/profile/useUpdateProfile";
import { UpdateProfilePayload } from "@/types/profile/profile.types";
import {
  dietarySuggestions,
  allergenSuggestions,
} from "@/data/profile/profile-suggestions";
import { toast } from "sonner";

export default function ProfilePage() {
  const { profile, loading, error } = useGetProfile();
  const { user, setUser } = useAuthStore();
  const {
    mutate: updateProfile,
    isPending,
    error: updateError,
  } = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: standardSchemaResolver(profileSchema),
    defaultValues: {
      userName: "",
      firstName: "",
      lastName: "",
      phone: undefined,
      birthDate: undefined,
      gender: undefined,
      defaultServings: 1,
      dietaryPreferences: [],
      allergenWarnings: [],
    },
  });

  // Estado para manejar el valor del input de preferencias dietéticas
  const [inputDietaryPreference, setInputDietaryPreference] = useState("");
  const [inputAllergen, setInputAllergen] = useState("");

  const firstName = profile?.firstName
    ? profile?.firstName?.charAt(0).toUpperCase() + profile?.firstName?.slice(1)
    : "";
  const lastName = profile?.lastName
    ? profile?.lastName?.charAt(0).toUpperCase() + profile?.lastName?.slice(1)
    : "";
  const defaultServings = useWatch({
    control,
    name: "defaultServings",
  });
  // Estado para manejar la edición del perfil
  const [editing, setEditing] = useState(false);

  //Funcion para resetear los valores del formulario a los del perfil original
  const resetToProfile = useCallback(() => {
    if (profile) {
      reset({
        userName: user?.userName ?? "",
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        phone: profile.phone ?? undefined,
        birthDate: profile.birthDate ? new Date(profile.birthDate) : undefined,
        gender: profile.gender ?? undefined,
        defaultServings: profile.defaultServings ?? 1,
        dietaryPreferences: profile.dietaryPreferences ?? [],
        allergenWarnings: profile.allergenWarnings ?? [],
      });
    }
  }, [profile, user, reset]);

  useEffect(() => {
    if (!profile) return;

    resetToProfile();
  }, [profile, user, resetToProfile]);

  // Renderizado condicional basado en el estado de la consulta de React Query
  if (loading) return <div>Cargando perfil...</div>;
  if (error) return <div>Error: {error}</div>;

  //Save profile
  const handleSaveProfile = (values: ProfileFormData) => {
    // Aquí puedes agregar la lógica para guardar los cambios del perfil
    const payload: UpdateProfilePayload = {
      userName: values.userName,
      firstName: values.firstName || null,
      lastName: values.lastName || null,
      phone: values.phone || null,
      gender: values.gender || null,
      birthDate: values.birthDate
        ? values.birthDate.toISOString().split("T")[0]
        : null, // Convertir a formato YYYY-MM-DD
      defaultServings: values.defaultServings,
      dietaryPreferences: values.dietaryPreferences,
      allergenWarnings: values.allergenWarnings,
    };

    updateProfile(payload, {
      onSuccess: () => {
        if (user && user.userName !== values.userName) {
          // Actualizar el nombre de usuario en el estado global si ha cambiado
          setUser({
            ...user,
            userName: values.userName,
          });
        }
        setEditing(false); // Salir del modo de edición después de guardar
        toast.success("Perfil Actualizado con correctamente.");
      },
      // Manejo de errores si es necesario
      onError: (error) => {
        console.error("Error al actualizar el perfil:", error);
        toast.error("Error al actualizar el perfil");
      },
    });
  };

  //Accion de cancelar edicion
  const handleCancelEditing = () => {
    resetToProfile(); // Restablecer los valores del formulario a los del perfil original
    setEditing(false);
    setInputDietaryPreference("");
    setInputAllergen("");
  };

  //Remueve preference de los atributos tipo array de perfil
  const removePreference = (
    nameArray: "dietaryPreferences" | "allergenWarnings",
    preferenceToDeleted: string,
  ) => {
    const currentArray = getValues(nameArray) ?? [];

    setValue(
      nameArray,
      currentArray.filter((v) => v !== preferenceToDeleted),
      { shouldDirty: true },
    );
  };

  const memberSince = profile?.createdAt
    ? new Date(profile?.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <form onSubmit={handleSubmit(handleSaveProfile)}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
          {/* Card Header Profile, Card superior muestra info y contiene boton de editar */}
          <CardHeaderProfile
            avatarUrl={profile?.avatarUrl}
            userName={user?.userName || "Usuario"}
            fullName={`${firstName} ${lastName}`}
            memberSince={memberSince}
            editing={editing}
            onEditClick={setEditing}
            onCancelClick={handleCancelEditing}
            isDirty={isDirty}
            saving={isPending}
            saveError={updateError?.message}
          />

          {/* Personal info */}
          <CardCustom classNameCustom="p-6 shadow-sm flex flex-col gap-5 border border-[rgba(0,0,0,0.06)]">
            <CardHeaderCustom classNameCustom="p-0">
              <CardTitle className="text-left font-bold text-lg flex gap-2 items-center text-gray-800">
                <User size={16} className="text-orange-500" /> Información
                personal
              </CardTitle>
            </CardHeaderCustom>

            <CardContentCustom classNameCustom="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileFormFields.map((field) => (
                <FieldProfile
                  key={field.id}
                  label={field.label}
                  id={field.id as keyof ProfileFormData}
                  Icon={field.Icon}
                  placeholder={field.placeholder}
                  editing={editing}
                  formatInput={field.formatInput}
                  optionsSelect={field.id === "gender" ? optionsGender : []}
                  register={register}
                  error={
                    errors[field.id as keyof ProfileFormData] as
                      | FieldError
                      | undefined
                  }
                  control={control}
                />
              ))}
            </CardContentCustom>
          </CardCustom>

          {/* Cooking preferences */}
          <CardPreferences
            defaultServings={defaultServings}
            isEditing={editing}
            error={errors["defaultServings"]}
            control={control}
            valueDietaryPreferences={inputDietaryPreference}
            setValueDietaryPreferences={setInputDietaryPreference}
            listSuggestions={dietarySuggestions}
            removePreference={removePreference}
          />

          {/* Allergen warnings */}
          <CardAllergens
            isEditing={editing}
            control={control}
            valueAllergen={inputAllergen}
            setValueAllergen={setInputAllergen}
            listSuggestions={allergenSuggestions}
            removePreference={removePreference}
          ></CardAllergens>

          {/* Danger zone */}
          <CardDeleteUser />
        </div>
      </form>
    </>
  );
}
