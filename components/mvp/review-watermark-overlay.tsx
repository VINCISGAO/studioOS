"use client";

type Props = {
  label: string;
  sublabel?: string;
  enabled?: boolean;
};

export function ReviewWatermarkOverlay({ label, sublabel, enabled = true }: Props) {
  if (!enabled) return null;

  const stamp = `${label}${sublabel ? ` · ${sublabel}` : ""} · ${new Date().toLocaleDateString()}`;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 opacity-[0.18]">
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 4 }).map((__, col) => (
            <span
              key={`${row}-${col}`}
              className="absolute select-none whitespace-nowrap text-[11px] font-semibold uppercase tracking-widest text-white"
              style={{
                top: `${row * 18 + 8}%`,
                left: `${col * 28 - 10}%`,
                transform: "rotate(-24deg)"
              }}
            >
              {stamp}
            </span>
          ))
        )}
      </div>
      <div className="absolute bottom-3 right-3 rounded bg-black/45 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/90">
        Review copy
      </div>
    </div>
  );
}
