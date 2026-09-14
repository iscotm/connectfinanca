import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, CheckCheck, Briefcase, Trash2 } from "lucide-react";
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

export interface MultiDatePickerProps {
  selectedDates?: string[]; // Array of 'YYYY-MM-DD'
  selectedDays?: number[];   // Array of day numbers 1..31
  month?: number;            // 0-11
  year?: number;
  startDate?: string;        // Fallback range start
  endDate?: string;          // Fallback range end
  onChange: (selectedDates: string[], selectedDays: number[]) => void;
  label?: string;
}

export function MultiDatePicker({
  selectedDates,
  selectedDays,
  month: propMonth,
  year: propYear,
  startDate,
  endDate,
  onChange,
  label = "Dias de Separação (Rateio)"
}: MultiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize view date based on props or current date
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    if (propYear !== undefined && propMonth !== undefined) {
      return new Date(propYear, propMonth, 1);
    }
    if (selectedDates && selectedDates.length > 0) {
      return new Date(selectedDates[0] + "T00:00:00");
    }
    if (startDate) {
      return new Date(startDate + "T00:00:00");
    }
    return new Date();
  });

  // Keep view date synced if propMonth / propYear change
  useEffect(() => {
    if (propYear !== undefined && propMonth !== undefined) {
      setCurrentViewDate(new Date(propYear, propMonth, 1));
    }
  }, [propMonth, propYear]);

  const currentYear = currentViewDate.getFullYear();
  const currentMonth = currentViewDate.getMonth();

  // Normalize selected dates
  const activeDatesSet = useMemo(() => {
    const set = new Set<string>();

    if (selectedDates !== undefined) {
      selectedDates.forEach(d => set.add(d));
      return set;
    }

    if (selectedDays !== undefined && propYear !== undefined && propMonth !== undefined) {
      selectedDays.forEach(day => {
        const dStr = `${propYear}-${String(propMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        set.add(dStr);
      });
      return set;
    }

    if (startDate && endDate) {
      // Backwards compatibility range expansion
      const s = new Date(startDate + "T00:00:00");
      const e = new Date(endDate + "T00:00:00");
      const cur = new Date(s);
      while (cur <= e) {
        const dStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        set.add(dStr);
        cur.setDate(cur.getDate() + 1);
      }
      return set;
    }

    return set;
  }, [selectedDates, selectedDays, propMonth, propYear, startDate, endDate]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Filter selected days specifically for current month
  const selectedDaysInCurrentMonth = useMemo(() => {
    const days: number[] = [];
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${prefix}${String(day).padStart(2, "0")}`;
      if (activeDatesSet.has(dateStr)) {
        days.push(day);
      }
    }
    return days;
  }, [activeDatesSet, currentYear, currentMonth, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const triggerChange = (newSet: Set<string>) => {
    const allDates = Array.from(newSet).sort();
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`;
    const daysInViewMonth: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${prefix}${String(day).padStart(2, "0")}`;
      if (newSet.has(dateStr)) {
        daysInViewMonth.push(day);
      }
    }

    onChange(allDates, daysInViewMonth);
  };

  const handleToggleDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const newSet = new Set(activeDatesSet);

    if (newSet.has(dateStr)) {
      newSet.delete(dateStr);
    } else {
      newSet.add(dateStr);
    }

    triggerChange(newSet);
  };

  const handleSelectAll = () => {
    const newSet = new Set(activeDatesSet);
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`;

    for (let day = 1; day <= daysInMonth; day++) {
      newSet.add(`${prefix}${String(day).padStart(2, "0")}`);
    }

    triggerChange(newSet);
  };

  const handleSelectWeekdays = () => {
    const newSet = new Set(activeDatesSet);
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay(); // 0 = Dom, 6 = Sáb
      const dateStr = `${prefix}${String(day).padStart(2, "0")}`;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        newSet.add(dateStr);
      } else {
        newSet.delete(dateStr);
      }
    }

    triggerChange(newSet);
  };

  const handleClearMonth = () => {
    const newSet = new Set(activeDatesSet);
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`;

    for (let day = 1; day <= daysInMonth; day++) {
      newSet.delete(`${prefix}${String(day).padStart(2, "0")}`);
    }

    triggerChange(newSet);
  };

  const count = selectedDaysInCurrentMonth.length;
  const isTodayDate = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 text-white hover:border-blue-500 hover:ring-2 hover:ring-blue-500/10 rounded-xl p-3 text-sm transition-all duration-200 outline-none text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <CalendarIcon size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                {label}
              </span>
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="text-blue-400">{count}</span> {count === 1 ? "dia selecionado" : "dias selecionados"}
                <span className="text-xs font-normal text-slate-400">({MONTH_NAMES[currentMonth]})</span>
              </span>
            </div>
          </div>
          <ChevronDown size={16} className="text-slate-400 shrink-0 ml-4 group-hover:text-white transition-colors" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 bg-transparent border-none shadow-2xl z-[9999]" align="start">
        <div className="bg-[#0b1329] border border-[#1e2a4a] rounded-2xl shadow-2xl p-5 inline-block w-full max-w-[360px] sm:max-w-md transition-all duration-200 backdrop-blur-xl">
          
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[#1c2640] rounded-lg transition-colors text-slate-300 hover:text-white"
              type="button"
              aria-label="Mês Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-base font-extrabold text-white tracking-wide">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <p className="text-[11px] text-blue-400 font-semibold">
                {count} {count === 1 ? "dia incluído" : "dias incluídos"} no rateio
              </p>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[#1c2640] rounded-lg transition-colors text-slate-300 hover:text-white"
              type="button"
              aria-label="Próximo Mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Selection Shortcuts */}
          <div className="grid grid-cols-3 gap-1.5 mb-4 p-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/30 transition-all"
            >
              <CheckCheck size={12} className="text-blue-400" />
              Todos
            </button>
            <button
              type="button"
              onClick={handleSelectWeekdays}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/30 transition-all"
            >
              <Briefcase size={12} className="text-cyan-400" />
              Seg - Sex
            </button>
            <button
              type="button"
              onClick={handleClearMonth}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
            >
              <Trash2 size={12} className="text-rose-400" />
              Limpar
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="text-[10px] sm:text-xs font-bold text-slate-400 py-1 uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="w-9 h-9 sm:w-10 sm:h-10" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = activeDatesSet.has(dateStr);
              const isToday = isTodayDate(day);

              return (
                <button
                  key={day}
                  onClick={() => handleToggleDay(day)}
                  type="button"
                  className={`
                    w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm flex flex-col items-center justify-center rounded-xl transition-all font-bold cursor-pointer relative
                    ${isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/80 scale-[0.98]"
                      : "text-slate-300 hover:bg-[#1a243d] hover:text-white bg-slate-900/40 border border-slate-800/40"
                    }
                  `}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="text-[11px] text-slate-400">
              Clique nos dias para ativar ou desativar o rateio.
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              OK
            </button>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
}
