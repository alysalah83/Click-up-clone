# Portfolio screenshots

Captured from the live guest demo (https://click-up-clone-two.vercel.app → Continue as guest) with Playwright headless:
desktop at 1920×1080 with device scale 2 (3840×2160 PNG), phones at 390×844 with device scale 2 (780×1688 PNG).
Every shot waits for data, skeletons and charts to finish and hides toasts. Re-capture with:

```bash
node apps/web/scripts/capture-screenshots.mjs --only=portfolio
```

Add `--shots=04,10` to re-take only some of them.

| File | Caption |
|---|---|
| `01-board-sprint.png` | Sprint 14 board: custom statuses, sprint points, tags, assignees, and a red WIP limit warning on In Progress (4 / 3). |
| `02-task-panel.png` | Task panel for "Add Google SSO to the login page": status, dates, points, tags, linked goal, 8 custom fields, AI buttons, rich-text description and activity feed. |
| `03-timeline-dependencies.png` | Gantt timeline for Sprint 14 with a today line and "blocked by" dependency arrows between tasks. |
| `04-table-custom-fields.png` | Table view with two rows selected for bulk edit and custom field columns: Severity, Estimate, Effort score (formula), Progress, Customer, Reviewer. |
| `05-workload-overload.png` | Workload by day in points: capacity per person, with Maya Chen overloaded (9 / 8) in red. |
| `06-dashboard.png` | Dashboard: task, list and workspace counts, workload by status, priorities, overdue, completed this week, time tracked and tasks per assignee. |
| `07-sprint-report.png` | Sprint 14 report: committed, completed and remaining points, burndown against the ideal line, and velocity across Sprints 11–13. |
| `08-chat-thread.png` | #product chat channel with mentions, reactions, inline code and an open thread on the dark-mode decision. |
| `09-docs-nested.png` | "Product roadmap Q4" doc with headings, checklists and lists, beside the nested docs tree (Meeting notes → Sprint 14 retro). |
| `10-mind-map.png` | Mind map: Sprint 14 → In Progress → "Add Google SSO" → subtasks → sub-subtasks. |
| `11-board-light.png` | The Sprint 14 board in the light theme. |
| `12-task-panel-light.png` | The task panel in the light theme. |
| `13-timeline-light.png` | The Gantt timeline with dependencies in the light theme. |
| `14-phone-board.png` | Phone layout: the board scrolls sideways one column at a time. |
| `15-phone-calendar.png` | Phone layout: compact month calendar with task dots and the day's task list. |
