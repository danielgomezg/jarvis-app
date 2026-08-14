import CardCustom from "../card/CardCustom";
import CardHeaderCustom from "../card/CardHeaderCustom";
import CardFooterCustom from "../card/CardFooterCustom";
import ButtonCustom from "../ButtonCustom";
import { CardTitle } from "../ui/card";
import { XCircle } from "lucide-react";
import { ButtonCustomType } from "@/types/button.types";

interface ErrorViewCustomProps {
  title?: string;
  message?: string;
  primaryButton?: ButtonCustomType;
  secondaryButton?: ButtonCustomType;
}

export default function ErrorViewCustom({
  title,
  message,
  primaryButton,
  secondaryButton,
}: ErrorViewCustomProps) {
  return (
    <CardCustom>
      <CardHeaderCustom>
        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto">
          <XCircle size={30} className="text-red-500" />
        </div>
        {title && <CardTitle>{title}</CardTitle>}
        {message && <p className="text-sm text-gray-500">{message}</p>}
      </CardHeaderCustom>

      <CardFooterCustom>
        {primaryButton && (
          <ButtonCustom
            text={primaryButton.label}
            onClick={primaryButton.action}
            classNameCustom={primaryButton.classNameCustom}
            variant={primaryButton.variant}
          ></ButtonCustom>
        )}
        {secondaryButton && (
          <ButtonCustom
            text={secondaryButton.label}
            onClick={secondaryButton.action}
            classNameCustom={secondaryButton.classNameCustom}
            variant={secondaryButton.variant}
          ></ButtonCustom>
        )}
      </CardFooterCustom>
    </CardCustom>
  );
}
