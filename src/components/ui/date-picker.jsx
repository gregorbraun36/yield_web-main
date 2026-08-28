import * as React from "react";
import { format, setMonth, setYear, getYear, getMonth } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1900 + 11 }, (_, i) => 1900 + i); // 1900 → +10 future

export function DatePicker({
  date,
  setDate,
  className,
  placeholder = "Datum auswählen",
  disabled = false,
  id,
  fromYear = 1900,
  toYear = THIS_YEAR + 10,
}) {
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(() => {
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const parsedDate = React.useMemo(() => {
    if (!date) return undefined;
    const d = new Date(date);
    return isNaN(d.getTime()) ? undefined : d;
  }, [date]);

  // Keep viewDate in sync when parsedDate changes externally
  React.useEffect(() => {
    if (parsedDate) setViewDate(parsedDate);
  }, [parsedDate]);

  const handleSelect = (d) => {
    if (d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      setDate(`${year}-${month}-${day}`);
      setOpen(false);
    } else {
      setDate("");
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setDate("");
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "mt-1 flex h-10 w-full items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background",
            "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !parsedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <span className="flex-1 text-left">
            {parsedDate ? format(parsedDate, "dd. MMMM yyyy", { locale: de }) : placeholder}
          </span>
          {parsedDate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Datum löschen"
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
              className="ml-auto rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cn(
            "z-[200] w-auto rounded-xl border border-slate-200 bg-white p-0 shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            "origin-[--radix-popover-content-transform-origin]"
          )}
        >
          {/* ── Custom year/month navigation header ── */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 rounded-t-xl">
            <button
              type="button"
              onClick={() => setViewDate((d) => setMonth(d, getMonth(d) - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              aria-label="Vorheriger Monat"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex gap-1.5">
              <select
                value={getMonth(viewDate)}
                onChange={(e) => setViewDate((d) => setMonth(d, Number(e.target.value)))}
                className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Monat auswählen"
              >
                {MONTHS_DE.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>

              <select
                value={getYear(viewDate)}
                onChange={(e) => setViewDate((d) => setYear(d, Number(e.target.value)))}
                className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Jahr auswählen"
              >
                {YEARS.filter((y) => y >= fromYear && y <= toYear).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setViewDate((d) => setMonth(d, getMonth(d) + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              aria-label="Nächster Monat"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* ── Day picker (no caption, no nav — we handle them above) ── */}
          <DayPicker
            mode="single"
            month={viewDate}
            onMonthChange={setViewDate}
            selected={parsedDate}
            onSelect={handleSelect}
            locale={de}
            showOutsideDays
            fixedWeeks
            classNames={{
              months: "p-3",
              month: "space-y-2",
              caption: "hidden",           // Our custom header replaces this
              nav: "hidden",               // Our custom header handles navigation
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-slate-500 rounded-md w-8 font-normal text-[0.75rem] flex items-center justify-center",
              row: "flex w-full mt-1",
              cell: "relative p-0 text-center",
              day: cn(
                "h-8 w-8 p-0 font-normal rounded-md text-sm",
                "flex items-center justify-center",
                "hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              ),
              day_selected: "!bg-slate-900 !text-white hover:!bg-slate-800 focus:!bg-slate-900",
              day_today: "bg-blue-50 text-blue-700 font-semibold",
              day_outside: "text-slate-300",
              day_disabled: "text-slate-300 cursor-not-allowed",
              day_hidden: "invisible",
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
