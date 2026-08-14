import { CardFooter } from "../ui/card";
import { cn } from "@/lib/utils";

interface CardFooterCustomProps {
  children: React.ReactNode;
  classNameCustom?: string;
}

export default function CardFooterCustom({
  children,
  classNameCustom,
}: CardFooterCustomProps) {
  return (
    <CardFooter
      className={cn(
        "flex flex-col gap-4 bg-transparent border-t-0",
        classNameCustom,
      )}
    >
      {children}
    </CardFooter>
  );
}
