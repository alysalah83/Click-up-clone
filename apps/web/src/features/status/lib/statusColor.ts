import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";

const COLOR_TOKEN_NAMES = Object.keys(COLORS_TOKENS) as ColorsToken[];

/** Stable (non-cryptographic) string hash, so the same name always maps to the same token. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function fallbackHex(name: string): string {
  const index = hashString(name) % COLOR_TOKEN_NAMES.length;
  return COLORS_TOKENS[COLOR_TOKEN_NAMES[index]!].hex;
}

/**
 * Resolves the hex color for a status name given a `{ name: token }` color map.
 * Falls back to a deterministic token (by a stable hash of the name) when the
 * name has no entry, or the entry isn't a known color token, so repeated calls
 * with the same input always return the same output.
 */
export function statusColorHex(name: string, colors: Record<string, string>): string {
  const token = colors[name] as ColorsToken | undefined;
  const hex = token ? COLORS_TOKENS[token]?.hex : undefined;
  return hex ?? fallbackHex(name);
}
