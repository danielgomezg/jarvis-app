import CardCustom from "../card/CardCustom";
import { Loader2 } from "lucide-react";
import { CardTitle } from "../ui/card";

interface LoadingViewCustomProps {
  title?: string;
  message?: string;
}

export default function LoadingViewCustom({
  title,
  message,
}: LoadingViewCustomProps) {
  return (
    <CardCustom>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
        <Loader2 size={28} className="animate-spin text-orange-500" />
      </div>
      {title && <CardTitle>{title}</CardTitle>}
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </CardCustom>
  );
}
