"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveAsTemplate } from "../hooks";

type TaskForTemplate = {
  id: string;
  name: string;
  subtasks: unknown[];
  checklists: { items: unknown[] }[];
};

/** "Save as template" from the task panel: name (prefilled with the task name) and a short description. */
function SaveAsTemplateDialog({
  task,
  open,
  onOpenChange,
}: {
  task: TaskForTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveAsTemplate();
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState("");
  const items = task.checklists.reduce((sum, c) => sum + c.items.length, 0);

  const change = (next: boolean) => {
    if (next) {
      setName(task.name);
      setDescription("");
    }
    onOpenChange(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    save.mutate(
      { taskId: task.id, name: name.trim(), description: description.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription>
              Saves the description, priority, points, tags and relative due date, with{" "}
              {task.subtasks.length} {task.subtasks.length === 1 ? "subtask" : "subtasks"} and {items} checklist{" "}
              {items === 1 ? "item" : "items"} (unchecked).
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Template name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Description (optional)</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="When should the team use this template?"
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-violet-600 text-white hover:bg-violet-700"
              disabled={!name.trim() || save.isPending}
            >
              {save.isPending ? "Saving…" : "Save template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SaveAsTemplateDialog;
