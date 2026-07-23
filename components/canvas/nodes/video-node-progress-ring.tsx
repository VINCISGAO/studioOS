"use client";

function ringGeometry(size: number, stroke: number) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return { size, stroke, radius, circumference };
}

export function VideoNodeProgressRing({
  progress,
  gradientId = "video-node-progress-gradient"
}: {
  progress: number;
  gradientId?: string;
}) {
  const { size, stroke, radius, circumference } = ringGeometry(88, 5);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#EDE9FE"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
