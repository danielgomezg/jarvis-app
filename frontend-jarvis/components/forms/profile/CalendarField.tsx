import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

interface calendarProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  isDisable?: boolean;
}

export default function CalendarField({
  date,
  setDate,
  isDisable,
}: calendarProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground cursor-pointer"
          data-empty={!date}
          disabled={!isDisable}
        >
          {" "}
          {date ? format(date, "dd/MM/yyyy") : <span>Selecciona </span>}
          <CalendarDays />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          defaultMonth={date ?? new Date()}
          disabled={(date) => date > new Date()}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}
