import { CircleAlert } from "lucide-react";
import CardCustom from "../CardCustom";
import { Button } from "@/components/ui/button";

//interface deleteUserProps {}

export default function CardDeleteUser({}) {
  return (
    <CardCustom classNameCustom="p-6 shadow-sm border border-[rgba(239,68,68,0.15)]">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        {" "}
        <CircleAlert size={16} className="text-red-400" /> Zona de peligro
      </h3>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-50  hover:text-[#ef4444] border border-[1.5px] border-[rgba(239,68,68,0.2)] text-[#ef4444] cursor-pointer"
          variant="ghost"
        >
          Eliminar cuenta
        </Button>

        <Button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50  hover:text-[#6b7280] border border-[1.5px] border-[rgba(0,0,0,0.1)] text-[#6b7280] cursor-pointer"
          variant="ghost"
        >
          Cerrar sesión
        </Button>
      </div>
    </CardCustom>
  );
}
