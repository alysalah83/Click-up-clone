const FALLBACK_COLORS = [
  "#7b68ee",
  "#0092b8",
  "#e17100",
  "#008236",
  "#e7000b",
  "#4f39f6",
  "#c800de",
  "#009689",
];

interface AvatarUser {
  id: string;
  name: string | null;
  email?: string | null;
  avatarColor?: string | null;
}

/** "Maya Chen" / guests without a name get a stable "Guest 1a2b". */
export function displayName({ id, name, email }: AvatarUser) {
  return name ?? email?.split("@")[0] ?? `Guest ${id.slice(0, 4)}`;
}

export function initials(user: AvatarUser) {
  const parts = displayName(user).trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : parts[0]!.slice(0, 2);
  return letters.toUpperCase();
}

/** The stored color, or one derived from the id so the same person always looks the same. */
export function avatarColor({ id, avatarColor }: AvatarUser) {
  if (avatarColor) return avatarColor;
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]!;
}
