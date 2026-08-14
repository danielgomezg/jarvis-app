import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ButtonCustomProps {
  text?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  classNameCustom?: string;
  disabled?: boolean;
  variant?:
    | "outline"
    | "link"
    | "default"
    | "secondary"
    | "ghost"
    | "destructive"
    | null
    | undefined;
  size?:
    | "default"
    | "xs"
    | "sm"
    | "lg"
    | "icon"
    | "icon-xs"
    | "icon-sm"
    | "icon-lg"
    | null
    | undefined;
  type?: "button" | "submit" | "reset" | undefined;
}

export default function ButtonCustom({
  text,
  onClick,
  children,
  classNameCustom,
  variant = "outline",
  size,
  disabled = false,
  type,
}: ButtonCustomProps) {
  return (
    <Button
      className={cn(
        `w-full bg-transparent text-white py-2 rounded ${variant === "link" ? "" : "hover:bg-orange-600"} transition cursor-pointer`,
        classNameCustom,
      )}
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      type={type}
    >
      {text}
      {children}
    </Button>
  );
}

//bg-orange-500
