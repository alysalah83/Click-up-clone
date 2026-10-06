import { DollarSign, Hash, ListChecks, ToggleRight } from "lucide-react";
import type { GoalTargetType } from "../types";

const ICONS = { number: Hash, currency: DollarSign, boolean: ToggleRight, tasks: ListChecks } as const;

function TargetTypeIcon({ type, className }: { type: GoalTargetType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon aria-hidden className={className} />;
}

export default TargetTypeIcon;
