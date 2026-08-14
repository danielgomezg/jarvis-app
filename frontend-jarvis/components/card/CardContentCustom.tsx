import { CardContent } from "../ui/card";
import { cn } from "@/lib/utils";

interface CardContentCustomProps {
  children: React.ReactNode;
  classNameCustom?: string;
}

export default function CardContentCustom({
  children,
  classNameCustom,
}: CardContentCustomProps) {
  return (
    <CardContent className={cn("text-center text-gray-600", classNameCustom)}>
      {children}
    </CardContent>
  );
}
