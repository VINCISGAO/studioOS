"use client";

export function VideoNodeSparkIcon({
  className,
  size = 16
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 2.5L13.6 8.4L19.5 10L13.6 11.6L12 17.5L10.4 11.6L4.5 10L10.4 8.4L12 2.5Z"
        fill="currentColor"
      />
      <path
        d="M18.5 3.5L19.1 5.6L21.2 6.2L19.1 6.8L18.5 8.9L17.9 6.8L15.8 6.2L17.9 5.6L18.5 3.5Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}
