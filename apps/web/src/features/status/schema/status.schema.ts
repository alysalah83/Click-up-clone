import z from "zod";
import { ICONS_REGISTRY } from "@/shared/ui/IconPicker/IconRegistry";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";

const createStatusSchema = z.object({
  name: z.string().trim().min(1, "name is too short"),
  listId: z.string("no listId provided"),
  icon: z.enum(Object.keys(ICONS_REGISTRY)),
  iconColor: z.enum(Object.keys(COLORS_TOKENS)),
  bgColor: z.enum(Object.keys(COLORS_TOKENS)),
});

export { createStatusSchema };
