const initialCharacterPattern = /[\p{L}\p{N}]/u;

function firstInitialCharacter(value: string) {
  return Array.from(value.normalize("NFKC")).find((character) => initialCharacterPattern.test(character)) ?? "";
}

function firstInitialsFromWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map(firstInitialCharacter)
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export function buildAvatarInitials(name: string | null | undefined, fallback = "U") {
  const initials = firstInitialsFromWords(name ?? "");
  const fallbackInitials = firstInitialsFromWords(fallback);
  const value = initials || fallbackInitials || "U";
  return Array.from(value.toUpperCase()).slice(0, 2).join("");
}
