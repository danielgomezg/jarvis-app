"use client";

//import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { AuthService } from "@/services/auth/auth.service";
import { useHydrated } from "@/hooks/useHydrated";
import { navbarFields } from "@/data/navbar-fields";
import NavigationMenuListCustom from "./navbarCustom";
import { NavigationMenu } from "../ui/navigation-menu";
import { ChefHat, Bell } from "lucide-react";
import ButtonCustom from "../ButtonCustom";
import DropDownProfile from "./dropDownProfile";
import { dropDownProfileMenu } from "@/data/navbar-fields";

export default function Navbar() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const hydrated = useHydrated(); // Estado para verificar si el componente se ha hidratado, hidratado = true significa que el componente se ha renderizado en el cliente y podemos acceder a las propiedades del usuario.

  if (!hydrated) return null; // Evita renderizar el componente hasta que se haya hidratado para evitar errores de acceso a propiedades del usuario.

  const handleLogout = async () => {
    await AuthService.logout();
    clearUser();
    router.push("/login");
  };

  console.log("user ", user);

  return (
    <header className="w-full border-b bg-white px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500">
          <ChefHat size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-800 text-lg tracking-tight">
          Jarvis
        </span>
        <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium bg-[#fff7ed] text-[#f97316]">
          Culinario
        </span>
      </div>
      <NavigationMenu>
        {" "}
        {navbarFields.map((field) => (
          <NavigationMenuListCustom
            key={field.id}
            menuItems={field}
          ></NavigationMenuListCustom>
        ))}
      </NavigationMenu>

      <div className="flex items-center gap-2">
        <ButtonCustom classNameCustom="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all border-none">
          <Bell size={18} className="text-gray-500" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
        </ButtonCustom>

        {/* <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-md font-bold text-orange-600 cursor-pointer">
          {user?.userName.charAt(0).toUpperCase() || "NN"}
        </div> */}

        <DropDownProfile
          menuContents={dropDownProfileMenu}
          userName={user?.userName || "NN"}
          logoutAction={handleLogout}
        ></DropDownProfile>
      </div>
    </header>
  );

  /* return (
    <nav className="w-full flex items-center justify-between px-6 py-3 border-b bg-white">
      <p className="font-semibold text-orange-500">Jarvis</p>
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-600">
          Hola, <span className="font-medium">{user?.userName}</span>
        </p>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded bg-orange-500 text-white hover:bg-orange-600 transition"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );*/
}
