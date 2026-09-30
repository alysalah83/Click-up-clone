"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { useListMembers } from "@/features/members/hooks/useMembers";
import {
  useAutomationMutations,
  useAutomations,
  type Automation,
  type AutomationAction,
  type AutomationTrigger,
  type Priority,
} from "../hooks/useAutomations";

const PRIORITIES: Priority[] = ["urgent", "high", "normal", "low", "none"];
const TRIGGERS = [
  { value: "task_created", label: "A task is created" },
  { value: "status_changed", label: "Status changes to…" },
];
const ACTIONS = [
  { value: "notify_assignees", label: "Notify assignees" },
  { value: "assign_user", label: "Assign a user…" },
  { value: "set_priority", label: "Set priority…" },
  { value: "set_status", label: "Set status…" },
];

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Pick({
  value,
  onChange,
  options,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RuleBuilder({ listId, onDone }: { listId: string; onDone: () => void }) {
  const { statuses } = useStatuses();
  const { members } = useListMembers(listId);
  const { create } = useAutomationMutations(listId);

  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("task_created");
  const [toStatus, setToStatus] = useState("done");
  const [action, setAction] = useState("notify_assignees");
  const [param, setParam] = useState("");

  const statusOptions = (statuses ?? []).map((s) => ({ value: s.id, label: cap(s.name) }));
  const paramOptions =
    action === "assign_user"
      ? (members ?? []).map((m) => ({ value: m.userId, label: m.name ?? m.email ?? "Member" }))
      : action === "set_priority"
        ? PRIORITIES.map((p) => ({ value: p, label: cap(p) }))
        : action === "set_status"
          ? statusOptions
          : [];
  const needsParam = paramOptions.length > 0 || action !== "notify_assignees";

  const valid = name.trim().length > 0 && (!needsParam || param !== "");

  function submit() {
    const builtTrigger: AutomationTrigger =
      trigger === "status_changed" ? { type: "status_changed", to: toStatus } : { type: "task_created" };
    const builtAction = (
      action === "assign_user"
        ? { type: "assign_user", userId: param }
        : action === "set_priority"
          ? { type: "set_priority", priority: param }
          : action === "set_status"
            ? { type: "set_status", statusId: param }
            : { type: "notify_assignees" }
    ) as AutomationAction;
    create.mutate(
      { name: name.trim(), trigger: builtTrigger, actions: [builtAction] },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <Field label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Notify when done"
          maxLength={120}
        />
      </Field>
      <Field label="When">
        <Pick label="Trigger" value={trigger} onChange={setTrigger} options={TRIGGERS} />
      </Field>
      {trigger === "status_changed" && (
        <Field label="Status">
          <Pick
            label="Target status"
            value={toStatus}
            onChange={setToStatus}
            options={[{ value: "done", label: "Any done status" }, ...statusOptions]}
          />
        </Field>
      )}
      <Field label="Then">
        <Pick
          label="Action"
          value={action}
          onChange={(v) => {
            setAction(v);
            setParam("");
          }}
          options={ACTIONS}
        />
      </Field>
      {action !== "notify_assignees" && (
        <Field label={action === "assign_user" ? "User" : action === "set_priority" ? "Priority" : "Status"}>
          <Pick label="Action option" value={param} onChange={setParam} options={paramOptions} placeholder="Choose…" />
        </Field>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" disabled={!valid || create.isPending} onClick={submit}>
          Add rule
        </Button>
      </div>
    </div>
  );
}

function describe(rule: Automation, statusName: (id: string) => string, userName: (id: string) => string) {
  const when =
    rule.trigger.type === "task_created"
      ? "a task is created"
      : rule.trigger.to === "done"
        ? "status becomes Done"
        : `status becomes ${statusName(rule.trigger.to)}`;
  const then = rule.actions
    .map((a) =>
      a.type === "notify_assignees"
        ? "notify assignees"
        : a.type === "assign_user"
          ? `assign ${userName(a.userId)}`
          : a.type === "set_priority"
            ? `set priority ${cap(a.priority)}`
            : `set status ${statusName(a.statusId)}`,
    )
    .join(", ");
  return `When ${when} → ${then}`;
}

function AutomationsList({ listId }: { listId: string }) {
  const [adding, setAdding] = useState(false);
  const { data: rules, isPending } = useAutomations(listId, true);
  const { statuses } = useStatuses();
  const { members } = useListMembers(listId);
  const { toggle, remove } = useAutomationMutations(listId);

  const statusName = (id: string) => cap(statuses?.find((s) => s.id === id)?.name ?? "a status");
  const userName = (id: string) => {
    const m = members?.find((x) => x.userId === id);
    return m?.name ?? m?.email ?? "a user";
  };

  return (
    <div className="grid gap-3">
      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rules && rules.length > 0 ? (
        <ul className="grid gap-2">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                aria-label={`${rule.enabled ? "Disable" : "Enable"} ${rule.name}`}
                checked={rule.enabled}
                onCheckedChange={(checked) => toggle.mutate({ id: rule.id, enabled: checked === true })}
              />
              <div className={`min-w-0 flex-1 ${rule.enabled ? "" : "opacity-50"}`}>
                <p className="truncate text-sm font-medium">{rule.name}</p>
                <p className="text-xs text-muted-foreground">{describe(rule, statusName, userName)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${rule.name}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(rule.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        !adding && <p className="text-sm text-muted-foreground">No automations yet.</p>
      )}
      {adding ? (
        <RuleBuilder listId={listId} onDone={() => setAdding(false)} />
      ) : (
        <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setAdding(true)}>
          Add automation
        </Button>
      )}
    </div>
  );
}

/** Header button opening the list's automations (rules run when tasks are created or change status). */
export default function AutomationsDialog() {
  const { listId } = useParams<{ listId: string }>();
  const [open, setOpen] = useState(false);
  if (!listId) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="automations button">
          <Zap /> Automations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automations</DialogTitle>
          <DialogDescription>Rules that run automatically for tasks in this list.</DialogDescription>
        </DialogHeader>
        {open && <AutomationsList listId={listId} />}
      </DialogContent>
    </Dialog>
  );
}
