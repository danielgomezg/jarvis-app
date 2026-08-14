import {
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "../ui/navigation-menu";
import { usePathname } from "next/navigation";
import { NavbarItemType } from "@/types/navbar.types";

interface NavbarCustomProps {
  children?: React.ReactNode;
  menuItems: NavbarItemType;
}

export default function NavigationMenuListCustom({
  children,
  menuItems,
}: NavbarCustomProps) {
  const pathname = usePathname();
  //console.log(pathname);

  return (
    <NavigationMenuList key={menuItems.id}>
      <NavigationMenuItem>
        {menuItems.menuLink ? (
          //<NavigationMenuLink
          //className={navigationMenuTriggerStyle()}
          //render={<Link href={menuItems.href}>{menuItems.menuTrigger}</Link>}
          ///>
          <NavigationMenuLink
            className={`${navigationMenuTriggerStyle()} cursor-pointer transition-all ${pathname === menuItems.href ? "bg-[#fff7ed] font-[600] text-[#f97316]" : "bg-transparent font-[400] text-[#6b7280]"} hover:bg-[#fff7ed] hover:text-[#f97316] `}
          >
            {menuItems.menuTrigger}
          </NavigationMenuLink>
        ) : (
          <>
            <NavigationMenuTrigger>
              {menuItems.menuTrigger}
            </NavigationMenuTrigger>
            <NavigationMenuContent>{children}</NavigationMenuContent>
          </>
        )}
      </NavigationMenuItem>
    </NavigationMenuList>
  );
}
