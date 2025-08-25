"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type InfoTipProps = {
  content: React.ReactNode;
  tone?: "default" | "danger";
  className?: string;
};

const InfoTip: React.FC<InfoTipProps> = ({ content, tone = "default", className }) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const computePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 8, 
      left: r.left + r.width / 2,
    });
  };

  useEffect(() => {
    if (!open) return;
    computePos();
    const onScroll = () => computePos();
    const onResize = () => computePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold align-middle",
          tone === "danger"
            ? "bg-red-100 text-red-700 border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
            : "bg-gray-100 text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300",
          className || "",
        ].join(" ")}
        aria-label="Informations"
      >
        i
      </button>

      {open &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
            className={[
              "w-64 max-w-[80vw] rounded-md border bg-white p-2 text-xs shadow-lg",
              tone === "danger" ? "border-red-200" : "border-gray-200",
            ].join(" ")}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <div className={tone === "danger" ? "text-red-600" : "text-gray-700"}>{content}</div>
          </div>,
          document.body
        )}
    </>
  );
};

export default InfoTip;
