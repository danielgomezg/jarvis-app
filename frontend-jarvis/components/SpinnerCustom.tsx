import { cn } from "@/lib/utils";
import { Spinner } from "./ui/spinner";

interface spinnerCustomProps {
  classNameContainer?: string;
  classNameSpinner?: string;
}

export default function SpinnerCustom({
  classNameContainer,
  classNameSpinner,
}: spinnerCustomProps) {
  return (
    <div className={cn("flex items-center", classNameContainer)}>
      <Spinner className={cn("size-4", classNameSpinner)} />
    </div>
  );
}
