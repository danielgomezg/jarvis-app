export interface NavbarItemType {
  id: string;
  menuTrigger: string;
  menuContent: boolean;
  menuLink: boolean;
  href: string;
}

export interface NavbarDropDownProfile {
  id: string;
  label: string;
  icon: React.ReactNode;
}
