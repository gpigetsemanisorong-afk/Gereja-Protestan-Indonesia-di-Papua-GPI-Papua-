import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { ServiceSchedule } from '../types/church';

interface KalenderKegiatanWidgetProps {
  schedules: ServiceSchedule[];
  onSelectSchedule?: (schedule: ServiceSchedule) => void;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function parseScheduleDate(dateStr: string): { day: number; month: number; year: number } | null {
  if (!dateStr) return null;

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1,
      day: parseInt(isoMatch[3], 10),
    };
  }

  const parts = dateStr.split(/[\s,]+/);
  let day: number | null = null;
  let monthIndex = -1;
  let year = new Date().getFullYear();

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      if (num > 31) {
        year = num;
      } else if (day === null && num >= 1 && num <= 31) {
        day = num;
      }
    } else {
      const lower = part.toLowerCase();
      const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase().startsWith(lower.slice(0, 3)));
      if (mIdx >= 0) {
        monthIndex = mIdx;
      }
    }
  }

  if (day !== null && monthIndex >= 0) {
    return { day, month: monthIndex, year };
  }

  return null;
}

export const KalenderKegiatanWidget: React.FC<KalenderKegiatanWidgetProps> = ({
  schedules,
}) => {
  const currentDate = new Date();
  const [activeYear, setActiveYear] = useState<number>(currentDate.getFullYear());
  const [activeMonth, setActiveMonth] = useState<number>(currentDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(currentDate.getDate());

  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      setActiveMonth(11);
      setActiveYear((y) => y - 1);
    } else {
      setActiveMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      setActiveMonth(0);
      setActiveYear((y) => y + 1);
    } else {
      setActiveMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const scheduleMap = useMemo(() => {
    const map = new Map<number, ServiceSchedule[]>();
    schedules.forEach((sch) => {
      const parsed = parseScheduleDate(sch.date);
      if (parsed && parsed.year === activeYear && parsed.month === activeMonth) {
        const list = map.get(parsed.day) || [];
        list.push(sch);
        map.set(parsed.day, list);
      }
    });
    return map;
  }, [schedules, activeYear, activeMonth]);

  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(activeYear, activeMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const calendarDays = useMemo(() => {
    const items: { day: number | null; key: string }[] = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      items.push({ day: null, key: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      items.push({ day: d, key: `day-${d}` });
    }
    return items;
  }, [adjustedFirstDay, daysInMonth]);

  const selectedDaySchedules = useMemo(() => {
    if (selectedDay === null) return [];
    return scheduleMap.get(selectedDay) || [];
  }, [scheduleMap, selectedDay]);

  const monthSchedulesCount = useMemo(() => {
    let count = 0;
    scheduleMap.forEach((list) => {
      count += list.length;
    });
    return count;
  }, [scheduleMap]);

  return (
    <section className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Kalender Kegiatan · {monthSchedulesCount} Agenda</span>
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-stone-900 dark:text-stone-100">
            {MONTH_NAMES[activeMonth]} {activeYear}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F6F9] text-stone-700 hover:bg-stone-200/70 dark:bg-[#1E232D] dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
            title="Bulan Sebelumnya"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F6F9] text-stone-700 hover:bg-stone-200/70 dark:bg-[#1E232D] dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
            title="Bulan Berikutnya"
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid & Selected Day Agenda */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-semibold text-stone-400 dark:text-stone-500">
            {DAY_NAMES.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
            {calendarDays.map(({ day, key }) => {
              if (day === null) {
                return <div key={key} className="h-10" />;
              }

              const hasSchedules = scheduleMap.has(day);
              const isSelected = selectedDay === day;
              const isToday =
                day === currentDate.getDate() &&
                activeMonth === currentDate.getMonth() &&
                activeYear === currentDate.getFullYear();

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                      : isToday
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300'
                      : hasSchedules
                      ? 'bg-[#F4F6F9] text-stone-900 hover:bg-stone-200/70 dark:bg-[#1E232D] dark:text-stone-100'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="font-tabular">{day}</span>
                  {hasSchedules && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        isSelected ? 'bg-white dark:bg-stone-950' : 'bg-[#7F1D1D] dark:bg-amber-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-[#F4F6F9] p-4 dark:bg-[#1E232D]">
          <div>
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-2.5 dark:border-stone-700/70">
              <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {selectedDay !== null
                  ? `${selectedDay} ${MONTH_NAMES[activeMonth]} ${activeYear}`
                  : 'Pilih Tanggal'}
              </h3>
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {selectedDaySchedules.length} Agenda
              </span>
            </div>

            <div className="mt-3 max-h-[210px] space-y-2.5 overflow-y-auto pr-1">
              {selectedDay === null ? (
                <p className="py-6 text-center text-xs text-stone-400">
                  Ketuk tanggal untuk melihat agenda ibadah.
                </p>
              ) : selectedDaySchedules.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                  Tidak ada jadwal ibadah pada tanggal ini.
                </p>
              ) : (
                selectedDaySchedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="rounded-xl bg-white p-3 dark:bg-[#161A22]"
                  >
                    <p className="text-[11px] font-medium text-[#7F1D1D] dark:text-amber-400">
                      {sch.category}
                      {sch.unsur ? ` · ${sch.unsur}` : ''} · {sch.time}
                    </p>
                    <h4 className="mt-0.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                      {sch.title}
                    </h4>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{sch.location}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
