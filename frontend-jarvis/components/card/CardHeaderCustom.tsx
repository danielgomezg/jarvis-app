import { CardHeader } from "../ui/card";
import { cn } from "@/lib/utils";

interface CardHeaderCustomProps {
  children: React.ReactNode;
  classNameCustom?: string;
}

export default function CardHeaderCustom({
  children,
  classNameCustom,
}: CardHeaderCustomProps) {
  return (
    <CardHeader
      className={cn("text-2xl font-bold text-center mb-2", classNameCustom)}
    >
      {children}
    </CardHeader>
  );
}
