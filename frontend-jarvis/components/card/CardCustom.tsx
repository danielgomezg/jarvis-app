import { Card } from "../ui/card";
import { cn } from "@/lib/utils";

interface CardCustomProps {
  children: React.ReactNode;
  classNameCustom?: string;
}

export default function CardCustom({
  children,
  classNameCustom,
}: CardCustomProps) {
  return (
    <Card className={cn("w-full max-w-sm p-6", classNameCustom)}>
      {children}
    </Card>
  );
}
