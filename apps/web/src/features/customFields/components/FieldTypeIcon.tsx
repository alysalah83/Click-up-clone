import { Calendar, CircleChevronDown, Gauge, Hash, Sigma, SquareCheck, Type, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import type { CustomFieldType } from "../types";

export const FIELD_TYPE_ICON: Record<CustomFieldType, LucideIcon> = {
  dropdown: CircleChevronDown,
  text: Type,
  number: Hash,
  date: Calendar,
  checkbox: SquareCheck,
  people: Users,
  progress: Gauge,
  formula: Sigma,
};

function FieldTypeIcon({ type, className }: { type: CustomFieldType; className?: string }) {
  const Icon = FIELD_TYPE_ICON[type];
  return <Icon aria-hidden className={cn("size-3.5 shrink-0", className)} />;
}

export default FieldTypeIcon;
