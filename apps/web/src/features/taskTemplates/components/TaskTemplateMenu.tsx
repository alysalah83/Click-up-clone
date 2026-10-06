"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutTemplate, MoreHorizontal, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SaveAsTemplateDialog from "./SaveAsTemplateDialog";

/** The task panel's "⋯" menu: Save as template, Manage templates. */
function TaskTemplateMenu({ task }: { task: React.ComponentProps<typeof SaveAsTemplateDialog>["task"] }) {
  const [saving, setSaving] = useState(false);
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label="task actions"
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setSaving(true)}>
            <LayoutTemplate /> Save as template
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/home/templates">
              <Settings2 /> Manage templates
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SaveAsTemplateDialog task={task} open={saving} onOpenChange={setSaving} />
    </>
  );
}

export default TaskTemplateMenu;
