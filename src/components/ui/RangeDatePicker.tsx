import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const time = date.getTime();
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return time >= Math.min(startTime, endTime) && time <= Math.max(startTime, endTime);
}

export interface RangeDatePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
}

export function RangeDatePicker({
  startDate,
  endDate,
  onChange
}: RangeDatePickerProps) {
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());

  useEffect(() => {
    if (startDate) {
      const parsedStart = new Date(startDate + "T00:00:00");
      setStart(parsedStart);
      setCurrentViewDate(parsedStart);
    } else {
      setStart(null);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      setEnd(new Date(endDate + "T00:00:00"));
    } else {
      setEnd(null);
    }
  }, [endDate]);

  const currentYear = currentViewDate.getFullYear();
  const currentMonth = currentViewDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    const clickedStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, "0")}-${String(clickedDate.getDate()).padStart(2, "0")}`;

    if (!start || (start && end)) {
      setStart(clickedDate);
      setEnd(null);
      onChange(clickedStr, "");
    } else if (start && !end) {
      if (clickedDate < start) {
        setStart(clickedDate);
        setEnd(null);
        onChange(clickedStr, "");
      } else {
        setEnd(clickedDate);
        const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
        onChange(startStr, clickedStr);
      }
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "--/--/----";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 text-white hover:border-blue-500 hover:ring-2 hover:ring-blue-500/10 rounded-xl p-3 text-sm transition-all duration-200 outline-none text-left"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-blue-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1">Período de Separação</span>
              <span className="font-semibold text-xs sm:text-sm">
                {formatDateDisplay(startDate)} &rarr; {formatDateDisplay(endDate)}
              </span>
            </div>
          </div>
          <ChevronDown size={16} className="text-slate-400 shrink-0 ml-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-transparent border-none shadow-2xl z-[9999]" align="start">
        <div className="bg-[#0f1629] border border-[#1c2640] rounded-2xl shadow-xl p-5 inline-block w-full max-w-[340px] sm:max-w-sm transition-all duration-200">
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between mb-5 px-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[#1c2640] rounded-lg transition-colors text-slate-300 hover:text-white"
              type="button"
              aria-label="Mês Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-base font-semibold text-white tracking-wide">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[#1c2640] rounded-lg transition-colors text-slate-300 hover:text-white"
              type="button"
              aria-label="Próximo Mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="text-[10px] sm:text-xs font-semibold text-slate-400 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="w-9 h-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(currentYear, currentMonth, day);

              const isStart = start ? isSameDay(dateObj, start) : false;
              const isEnd = end ? isSameDay(dateObj, end) : false;
              const isInRange = isDateInRange(dateObj, start, end);

              let classStyles = "text-white hover:bg-[#1e2a4a] rounded-lg font-medium";

              if (isStart || isEnd) {
                classStyles = "bg-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50";
              } else if (isInRange) {
                classStyles = "bg-[#1e2a4a]/85 text-white font-semibold rounded-none";
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  type="button"
                  className={`w-9 h-9 text-xs sm:text-sm flex items-center justify-center transition-all ${classStyles}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
