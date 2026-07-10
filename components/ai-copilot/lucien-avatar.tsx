import { cn } from "@/lib/utils";

export const LUCIEN_AVATAR_SRC = "/images/ai-copilot/lucien-avatar.png";

type LucienAvatarProps = {
  size?: "sm" | "md" | "lg";
  alt?: string;
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<LucienAvatarProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-14 w-14"
};

export function LucienAvatar({ size = "md", alt = "Lucien", className }: LucienAvatarProps) {
  return (
    <img
      src={LUCIEN_AVATAR_SRC}
      alt={alt}
      className={cn(
        "shrink-0 rounded-full object-cover shadow-lg shadow-violet-100 ring-1 ring-violet-200/70",
        SIZE_CLASS[size],
        className
      )}
    />
  );
}
