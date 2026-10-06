"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePeople } from "@/features/members/hooks/useMembers";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import { GOAL_COLORS, fromDateInput, toDateInput } from "../lib";
import type { Goal, GoalColor, GoalInput } from "../types";

const NO_OWNER = "none";

type Props =
  | {
      mode: "create";
      spaces: { id: string; name: string }[];
      defaultSpaceId?: string;
      onSubmit: (input: GoalInput & { workspaceId: string; name: string }) => Promise<unknown>;
      children: ReactNode;
    }
  | {
      mode: "edit";
      goal: Goal;
      onSubmit: (input: GoalInput) => Promise<unknown>;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/** Create or edit a goal: name, space, description, owner, due date and color. */
function GoalFormDialog(props: Props) {
  const goal = props.mode === "edit" ? props.goal : undefined;
  const [innerOpen, setInnerOpen] = useState(false);
  const open = props.mode === "edit" ? props.open : innerOpen;
  const setOpen = props.mode === "edit" ? props.onOpenChange : setInnerOpen;

  const firstSpace = props.mode === "create" ? (props.defaultSpaceId ?? props.spaces[0]?.id ?? "") : "";
  const [spaceId, setSpaceId] = useState(goal?.workspaceId ?? firstSpace);
  const [name, setName] = useState(goal?.name ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [color, setColor] = useState<GoalColor>(goal?.color ?? "violet");
  const { people } = usePeople();
  const meId = people?.find((p) => p.isMe)?.id;
  const [ownerId, setOwnerId] = useState<string>(goal ? (goal.owner?.id ?? NO_OWNER) : (meId ?? NO_OWNER));
  // A new goal is owned by its creator unless the owner is changed (the API defaults it).
  const [ownerTouched, setOwnerTouched] = useState(false);
  const [due, setDue] = useState(toDateInput(goal?.dueDate ?? null));
  const [saving, setSaving] = useState(false);

  const members = (people ?? []).filter((p) => p.workspaces.some((w) => w.id === spaceId));

  const reset = () => {
    setSpaceId(goal?.workspaceId ?? firstSpace);
    setName(goal?.name ?? "");
    setDescription(goal?.description ?? "");
    setColor(goal?.color ?? "violet");
    setOwnerId(goal ? (goal.owner?.id ?? NO_OWNER) : (meId ?? NO_OWNER));
    setOwnerTouched(false);
    setDue(toDateInput(goal?.dueDate ?? null));
  };

  const onOpenChange = (next: boolean) => {
    if (next) reset();
    setOpen(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !spaceId) return;
    const fields = {
      name: name.trim(),
      description: description.trim(),
      color,
      ownerId: !goal && !ownerTouched ? undefined : ownerId === NO_OWNER ? null : ownerId,
      dueDate: fromDateInput(due),
    };
    setSaving(true);
    try {
      if (props.mode === "create") await props.onSubmit({ ...fields, workspaceId: spaceId });
      else await props.onSubmit(fields);
      setOpen(false);
    } catch {
      // The mutation toasts the error; keep the dialog open.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {props.mode === "create" && <DialogTrigger asChild>{props.children}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{props.mode === "create" ? "Create goal" : "Edit goal"}</DialogTitle>
            <DialogDescription>
              Goals track progress through targets: numbers, true/false milestones, currency or linked tasks.
            </DialogDescription>
          </DialogHeader>

          <Field label="Goal name">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Launch v2.0 by end of Q4"
              maxLength={120}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {props.mode === "create" && (
              <Field label="Space">
                <Select
                  value={spaceId}
                  onValueChange={(v) => {
                    setSpaceId(v);
                    if (!(people ?? []).some((p) => p.id === ownerId && p.workspaces.some((w) => w.id === v))) {
                      setOwnerId(NO_OWNER);
                      setOwnerTouched(true);
                    }
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Space">
                    <SelectValue placeholder="Choose a space" />
                  </SelectTrigger>
                  <SelectContent>
                    {props.spaces.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Owner">
              <Select
                value={ownerId}
                onValueChange={(v) => {
                  setOwnerId(v);
                  setOwnerTouched(true);
                }}
              >
                <SelectTrigger className="w-full" aria-label="Owner">
                  <SelectValue placeholder="No owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_OWNER}>No owner</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <UserAvatar user={m} size="xs" />
                      {displayName(m)}
                      {m.isMe ? " (you)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Due date">
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
            <Field label="Color">
              <div className="flex h-9 items-center gap-2">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-label={`Color ${c.value}`}
                    aria-pressed={color === c.value}
                    onClick={() => setColor(c.value)}
                    className="flex size-6 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background transition hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-neutral-400"
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.value && <Check className="size-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does success look like?"
              rows={3}
              maxLength={2000}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !name.trim() || !spaceId}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {saving ? "Saving…" : props.mode === "create" ? "Create goal" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GoalFormDialog;
