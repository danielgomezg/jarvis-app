"use client";
import { Button } from "@/components/ui/button";
import CardCustom from "../CardCustom";
import Image from "next/image";
import { Camera, Edit2, Save } from "lucide-react";

interface CardHeaderProfileProps {
  avatarUrl?: string | null;
  userName: string;
  fullName?: string;
  memberSince?: string | null;
  editing: boolean;
  isDirty?: boolean;
  saving?: boolean;
  saveError?: string | null;
  onEditClick: (b: boolean) => void;
  onCancelClick: () => void;
}

export default function CardHeaderProfile({
  avatarUrl,
  userName,
  fullName,
  memberSince,
  editing,
  isDirty,
  saving,
  saveError,
  onEditClick,
  onCancelClick,
}: CardHeaderProfileProps) {
  return (
    <CardCustom classNameCustom="overflow-hidden shadow-sm border border-[rgba(0,0,0,0.06)] p-0">
      {/* Banner */}
      <div className="h-24 w-full bg-gradient-to-br from-[#fff7ed] from-0% via-[#ffedd5] via-60% to-[#fed7aa] to-100%" />

      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="flex items-end justify-between -mt-14 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl border-4 border-card bg-orange-100 flex items-center justify-center text-6xl font-bold text-orange-500 shadow-sm">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                userName.charAt(0).toUpperCase() || "NN"
              )}
            </div>
            {editing && (
              <>
                <Button
                  onClick={() => console.log("Accion de editar avatar")}
                  type="button"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shadow-md"
                >
                  <Camera size={13} className="text-white"></Camera>
                </Button>

                {/*<input ref={fileRef} type="file" accept="image/*" className="hidden" />*/}
              </>
            )}
          </div>

          {/* Edit / Save buttons */}
          {!editing ? (
            <Button
              onClick={() => onEditClick(true)}
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-white hover:bg-orange-50 border border-[rgba(249,115,22,0.3)] text-[#f97316] cursor-pointer"
            >
              <Edit2 size={14} />
              Editar perfil
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  onClick={() => onCancelClick()}
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all border border-[rgba(0,0,0,0.1)] cursor-pointer bg-white"
                >
                  Cancelar
                </Button>

                <Button
                  //onClick={onSaveClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all bg-[#f97316] cursor-pointer hover:bg-[#f97316]/70"
                  type="submit"
                  disabled={!isDirty || saving}
                >
                  <Save size={14} /> {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
              {saveError && (
                <p className="text-sm text-red-500 mt-2">{saveError}</p>
              )}
            </>
          )}
        </div>

        {/* Name + meta */}
        <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>
        <p className="text-sm text-gray-400">@{userName}</p>
        <p className="text-xs text-gray-300 mt-1">
          Miembro desde {memberSince}
        </p>
      </div>
    </CardCustom>
  );
}
