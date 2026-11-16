"use client";

import React from "react";

interface AdContainerProps {
  slot: string;
  format?: "horizontal" | "rectangle" | "vertical";
  className?: string;
}

export default function AdContainer({ slot, format = "horizontal", className = "" }: AdContainerProps) {
  const getDimensions = () => {
    switch (format) {
      case "rectangle":
        return "min-h-[250px] w-full max-w-[300px]";
      case "vertical":
        return "min-h-[600px] w-full max-w-[160px] md:max-w-[300px]";
      case "horizontal":
      default:
        return "min-h-[90px] sm:min-h-[100px] w-full max-w-[728px]";
    }
  };

  return (
    <div className={`my-4 flex flex-col items-center justify-center ${className}`}>
      {/* Label */}
      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1 select-none">
        Advertisement
      </span>

      {/* CLS-safe reserved box */}
      <div
        className={`${getDimensions()} rounded-lg border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-900/30 flex flex-col items-center justify-center p-3 text-center transition-colors relative overflow-hidden`}
      >
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
          <span className="text-xs font-mono font-medium">AdSense Unit &bull; {slot}</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
          High-RPM responsive ad slot optimized for zero Cumulative Layout Shift (CLS).
        </p>
      </div>
    </div>
  );
}
