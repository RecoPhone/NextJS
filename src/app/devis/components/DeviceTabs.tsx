"use client";

import React from "react";

export type DeviceTab = {
  id: string;
  label: string; // ex: "iPhone 13 Pro" ou "Appareil 2"
  isComplete?: boolean; // modèle choisi ?
};

export type DeviceTabsProps = {
  devices: DeviceTab[];
  activeIndex: number;
  onSwitch: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const DeviceTabs: React.FC<DeviceTabsProps> = ({
  devices,
  activeIndex,
  onSwitch,
  onAdd,
  onRemove,
}) => {
  return (
    <div className="mb-3 overflow-x-auto">
      <div className="inline-flex items-center gap-2">
        {devices.map((d, i) => {
          const isActive = i === activeIndex;
          return (
            <div key={d.id} className="flex items-center">
              <button
                type="button"
                onClick={() => onSwitch(i)}
                className={[
                  "px-3 py-1.5 rounded-full text-sm border transition",
                  isActive
                    ? "bg-[#54b435] border-[#54b435] text-white"
                    : "bg-white border-gray-300 text-gray-800 hover:border-[#54b435]"
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
                title={d.isComplete ? "Modèle sélectionné" : "Modèle non sélectionné"}
              >
                {d.label}
              </button>
              {/* Supprimer (sauf si 1 seul appareil) */}
              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="ml-1 text-gray-500 hover:text-red-600"
                  aria-label={`Supprimer ${d.label}`}
                  title="Supprimer cet appareil"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAdd}
          className="ml-1 px-3 py-1.5 rounded-full text-sm border border-dashed border-gray-300 text-gray-700 hover:border-[#54b435] hover:text-[#54b435]"
          title="Ajouter un appareil"
        >
          + Ajouter un appareil
        </button>
      </div>
    </div>
  );
};

export default DeviceTabs;
