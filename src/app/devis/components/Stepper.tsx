
"use client";

import React from "react";

export type StepperProps = {
  steps: { key: string; label: string }[];
  current: number; 
  onNavigate?: (index: number) => void; 
};

const Stepper: React.FC<StepperProps> = ({ steps, current, onNavigate }) => {
  return (
    <nav aria-label="Progression du devis" className="mb-4">
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          const isCompleted = i < current;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate?.(i)}
                disabled={!onNavigate || i > current}
                className={[
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition border",
                  isCurrent
                    ? "bg-[#edfbe2] border-[#54b435] text-[#222]"
                    : isCompleted
                      ? "bg-[#54b435] border-[#54b435] text-white"
                      : "bg-white border-gray-300 text-gray-700",
                  i > current ? "cursor-not-allowed opacity-60" : "hover:shadow-sm"
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={[
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                    isCurrent
                      ? "bg-[#54b435] text-white"
                      : isCompleted
                        ? "bg-white text-[#54b435]"
                        : "bg-gray-200 text-gray-700"
                  ].join(" ")}
                >
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>

              {/* trait séparateur */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={[
                    "h-[2px] w-6 sm:w-12 rounded",
                    isCompleted ? "bg-[#54b435]" : "bg-gray-200"
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
