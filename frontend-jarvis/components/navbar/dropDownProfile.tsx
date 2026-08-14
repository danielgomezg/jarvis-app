"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { NavbarDropDownProfile } from "@/types/navbar.types";
import { LogOutIcon } from "lucide-react";

interface DropDownProps {
  menuContents: NavbarDropDownProfile[];
  avatarUrl?: string;
  altAvatar?: string;
  userName: string;
  logoutAction: () => void;
}

export default function DropDownProfile({
  menuContents,
  avatarUrl,
  altAvatar = "",
  userName,
  logoutAction,
}: DropDownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          size={"icon"}
          className="rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Avatar>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={altAvatar} />}
            <AvatarFallback className="bg-orange-100 flex items-center justify-center text-md font-bold text-orange-600 cursor-pointer">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {menuContents.map((item) => (
            <DropdownMenuItem key={item.id}>
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Button variant={"ghost"} className="px-0" onClick={logoutAction}>
            <LogOutIcon />
            Cerrar Sesión
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/*<DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full"><Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar></Button>} />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheckIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BellIcon />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>*/
