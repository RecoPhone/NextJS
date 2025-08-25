"use client";

import React, { useEffect, useMemo, useState } from "react";

export type StepScheduleProps = {
  selectedISO: string | null;
  onChange: (iso: string | null) => void;
  blockedDates?: string[];          // ISO "YYYY-MM-DD" à bloquer (jours fériés, indispos…)
  autoSelectNextSaturday?: boolean; // pré-sélectionner le prochain samedi libre
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const SLOT_START = 10; // 10h
const SLOT_END = 17;   // dernier départ 16:00
const SLOT_STEP = 60;  // minutes

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth   = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths    = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, 1);
const isSameDay    = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const toISOAtHour  = (date: Date, hour: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0).toISOString();
const dateKey      = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const formatDate   = (d: Date) => new Intl.DateTimeFormat("fr-BE", { weekday: "long", day: "2-digit", month: "long" }).format(d);
const formatTime   = (h: number) => `${String(h).padStart(2, "0")}:00`;

const StepSchedule: React.FC<StepScheduleProps> = ({ selectedISO, onChange, blockedDates = [], autoSelectNextSaturday = true }) => {
  const today = useMemo(() => { const t = new Date(); t.setHours(0,0,0,0); return t; }, []);
  const blocked = useMemo(() => new Set(blockedDates), [blockedDates]);

  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(today));
  const selectedDate = selectedISO ? new Date(selectedISO) : null;
  const selectedDay  = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : null;
  const selectedHour = selectedDate ? selectedDate.getHours() : null;

  // Grille de jours (Lundi→Dim.)
  const daysGrid = useMemo(() => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);
    const days: Date[] = [];
    const startWeekday = (start.getDay() + 6) % 7; // 0 = lundi
    for (let i = 0; i < startWeekday; i++) { const d = new Date(start); d.setDate(d.getDate() - (startWeekday - i)); days.push(d); }
    for (let d = 1; d <= end.getDate(); d++) days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    while (days.length % 7 !== 0) { const last = days[days.length - 1]; const next = new Date(last); next.setDate(next.getDate() + 1); days.push(next); }
    return days;
  }, [viewMonth]);

  const slots = useMemo(() => {
    const res: number[] = [];
    for (let h = SLOT_START; h < SLOT_END; h += SLOT_STEP / 60) res.push(h);
    return res;
  }, []);

  const canPickDay = (d: Date) => {
    const isSaturday = d.getDay() === 6; // Saturday = 6
    const isInView   = d.getMonth() === viewMonth.getMonth();
    const isPast     = d < today;
    const isBlocked  = blocked.has(dateKey(d));
    return isSaturday && isInView && !isPast && !isBlocked;
  };

  const onPickDay = (d: Date) => {
    if (!canPickDay(d)) return;
    onChange(toISOAtHour(d, SLOT_START)); // sélection par défaut 10:00
  };

  const isDisabledSlot = (day: Date, hour: number) => {
    const now = new Date();
    const slot = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
    return slot < now;
  };

  const onPickSlot = (hour: number) => {
    if (!selectedDay) return;
    if (isDisabledSlot(selectedDay, hour)) return;
    onChange(toISOAtHour(selectedDay, hour));
  };

  // Si aucun samedi futur dans le mois affiché, on avance automatiquement
  useEffect(() => {
    const anySat = daysGrid.some(d => canPickDay(d));
    if (!anySat) setViewMonth(addMonths(viewMonth, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pré-sélectionner le prochain samedi libre
  useEffect(() => {
    if (!autoSelectNextSaturday || selectedISO) return;

    const next = (() => {
      const d = new Date(today);
      // avancer jusqu'au prochain samedi
      while (d.getDay() !== 6 || blocked.has(dateKey(d))) {
        d.setDate(d.getDate() + 1);
        if (d.getFullYear() - today.getFullYear() > 1) break; // garde-fou
      }
      return d >= today && d.getDay() === 6 && !blocked.has(dateKey(d)) ? d : null;
    })();

    if (next) {
      onChange(toISOAtHour(next, SLOT_START));
      // afficher le mois du samedi choisi
      setViewMonth(startOfMonth(next));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectNextSaturday, blockedDates.join("|")]);

  return (
    <section aria-labelledby="step-schedule-title" className="w-full">
      <header className="mb-3">
        <h2 id="step-schedule-title" className="text-xl font-semibold text-[#222]">4) Choisissez votre créneau</h2>
        <p className="text-sm text-gray-600">
          Samedi uniquement — <strong>10:00</strong> à <strong>17:00</strong> — créneaux de <strong>60 min</strong>.
        </p>
      </header>

      {/* Calendrier */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#edfbe2]">
          <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white hover:bg-gray-50">←</button>
          <div className="text-sm font-semibold text-[#222]">
            {new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric" }).format(viewMonth)}
          </div>
          <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white hover:bg-gray-50">→</button>
        </div>

        <div className="px-3 py-3">
          <div className="grid grid-cols-7 text-center text-[11px] text-gray-500 mb-2">
            {WEEKDAYS.map((w) => (<div key={w} className="py-1">{w}</div>))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((d, i) => {
              const out = d.getMonth() !== viewMonth.getMonth();
              const selectable = canPickDay(d);
              const selected = selectedDay && isSameDay(d, selectedDay);
              const blockedDay = blocked.has(dateKey(d));
              return (
                <button
                  key={`${d.toDateString()}-${i}`}
                  type="button"
                  disabled={!selectable}
                  onClick={() => onPickDay(d)}
                  className={[
                    "aspect-square rounded-lg text-sm",
                    selectable ? (selected ? "bg-[#54b435] text-white" : "bg-white border border-gray-300 hover:border-[#54b435] hover:shadow-sm")
                               : "bg-gray-100 text-gray-400",
                    out && "opacity-50",
                    blockedDay && "line-through"
                  ].join(" ")}
                  title={blockedDay ? "Indisponible" : undefined}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slots horaires */}
      <div className="mt-4">
        <div className="mb-2 text-sm text-gray-700">
          {selectedDay ? <>Samedi sélectionné : <strong>{formatDate(selectedDay)}</strong></> : <>Choisissez un <strong>samedi</strong> dans le calendrier.</>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {slots.map((h) => {
            const active = selectedDay && selectedHour === h;
            const disabled = !selectedDay || isDisabledSlot(selectedDay, h);
            return (
              <button key={h} type="button" disabled={disabled} onClick={() => onPickSlot(h)}
                      className={["rounded-xl px-3 py-2 text-sm border transition",
                        active ? "border-[#54b435] bg-[#edfbe2] text-[#222]" : "border-gray-300 bg-white hover:border-[#54b435]",
                        disabled && "opacity-50 cursor-not-allowed"].join(" ")}>
                {formatTime(h)}
              </button>
            );
          })}
        </div>

        {!selectedISO && <p className="mt-2 text-[11px] text-gray-500">Sélectionnez une date (samedi) puis un horaire.</p>}
      </div>
    </section>
  );
};

export default StepSchedule;
