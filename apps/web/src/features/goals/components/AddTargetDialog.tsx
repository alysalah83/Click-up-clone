"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils/cn";
import { useAddTarget } from "../hooks";
import { TARGET_TYPES } from "../lib";
import type { GoalTargetType } from "../types";
import TargetTypeIcon from "./TargetTypeIcon";
import TaskSearchList from "./TaskSearchList";

const toNumber = (value: string) => (value.trim() === "" ? undefined : Number(value));

/** "Add target": a type picker, then the fields that type needs (values, or tasks to link). */
function AddTargetDialog({ goalId, workspaceId }: { goalId: string; workspaceId: string }) {
  const add = useAddTarget(goalId);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<GoalTargetType>("number");
  const [name, setName] = useState("");
  const [start, setStart] = useState("0");
  const [target, setTarget] = useState("100");
  const [unit, setUnit] = useState("$");
  const [taskIds, setTaskIds] = useState<Set<string>>(new Set());

  const onOpenChange = (next: boolean) => {
    if (next) {
      setType("number");
      setName("");
      setStart("0");
      setTarget("100");
      setUnit("$");
      setTaskIds(new Set());
    }
    setOpen(next);
  };

  const isValue = type === "number" || type === "currency";
  const startN = toNumber(start);
  const targetN = toNumber(target);
  const valuesOk = !isValue || (startN !== undefined && targetN !== undefined && !isNaN(startN) && !isNaN(targetN));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !valuesOk) return;
    try {
      await add.mutateAsync({
        name: name.trim(),
        type,
        ...(isValue && { startValue: startN, currentValue: startN, targetValue: targetN }),
        ...(type === "currency" && { unit: unit.trim() || "$" }),
        ...(type === "tasks" && { taskIds: [...taskIds] }),
      });
      setOpen(false);
    } catch {
      // Toasted by the mutation.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus /> Add target
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add target</DialogTitle>
            <DialogDescription>Targets are the measurable results that move this goal.</DialogDescription>
          </DialogHeader>

          <div role="radiogroup" aria-label="Target type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TARGET_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={type === t.value}
                title={t.hint}
                onClick={() => setType(t.value)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition",
                  type === t.value
                    ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                    : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800",
                )}
              >
                <TargetTypeIcon type={t.value} className="size-4" />
                {t.label}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Target name</span>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === "tasks"
                  ? "e.g. Fix launch-blocking bugs"
                  : type === "boolean"
                    ? "e.g. Referral program live"
                    : type === "currency"
                      ? "e.g. New MRR"
                      : "e.g. Weekly signups"
              }
              maxLength={120}
              required
            />
          </label>

          {isValue && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Start</span>
                <Input type="number" step="any" value={start} onChange={(e) => setStart(e.target.value)} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Target</span>
                <Input type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} required />
              </label>
              {type === "currency" && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Currency</span>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={12} />
                </label>
              )}
            </div>
          )}

          {type === "tasks" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Link tasks {taskIds.size > 0 && `(${taskIds.size} selected)`}
              </span>
              <TaskSearchList
                workspaceId={workspaceId}
                selectedIds={taskIds}
                onToggle={(id, selected) =>
                  setTaskIds((prev) => {
                    const next = new Set(prev);
                    if (selected) next.add(id);
                    else next.delete(id);
                    return next;
                  })
                }
                className="rounded-lg border border-neutral-200 dark:border-neutral-800"
              />
              <span className="text-xs text-muted-foreground">
                Progress counts done tasks (weighted by sprint points when every task has points).
              </span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={add.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={add.isPending || !name.trim() || !valuesOk}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {add.isPending ? "Adding…" : "Add target"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddTargetDialog;
