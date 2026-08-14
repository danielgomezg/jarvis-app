import { NavbarItemType, NavbarDropDownProfile } from "@/types/navbar.types";
import { LogOutIcon, BadgeCheckIcon } from "lucide-react";

export const navbarFields: NavbarItemType[] = [
  {
    id: "inicio",
    menuTrigger: "Inicio",
    menuLink: true, //si es true content es false
    menuContent: false,
    href: "/",
  },
  {
    id: "recetas",
    menuTrigger: "Recetas",
    menuLink: true,
    menuContent: false,
    href: "/recipe",
  },
  {
    id: "despensa",
    menuTrigger: "Despensa",
    menuLink: true,
    menuContent: false,
    href: "/pantry",
  },
  {
    id: "planificador",
    menuTrigger: "Planificador",
    menuLink: true,
    menuContent: false,
    href: "/planner",
  },
];

export const dropDownProfileMenu: NavbarDropDownProfile[] = [
  {
    id: "account",
    label: "Cuenta",
    icon: <BadgeCheckIcon />,
  },

  //Ejemplo el logout
  {
    id: "logout",
    label: "Cerrar sesión (ejemplo)",
    icon: <LogOutIcon />,
  },
];
