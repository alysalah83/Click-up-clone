# ADR 0002: Rebuild overlays on Radix (shadcn/ui) behind the existing APIs

- Status: Accepted
- Date: 2026-09-29

## Context
v1 of this app used a hand-built component library: Menu, Modal, ToolTip, Toasts and Dropdown. Building it taught compound components, portals and positioning maths, and it looked right. But it failed keyboard and screen-reader users:
- no Escape-to-close on menus or modals,
- no focus trap or focus return,
- tooltips that never open on focus,
- `role="tooltip"` on the trigger,
- menus positioned once, which did not follow scroll or resize.

## Decision
- **Radix primitives, same APIs.** Re-implement each component on the Radix primitive that shadcn/ui builds on (Popover, Dialog, Tooltip, Checkbox, plus sonner for toasts), keeping every export name and prop. About 60 call sites keep working unchanged, and the visual classes are carried over, so the app looks the same.
- **Legacy copies kept.** The v1 implementations stay in `apps/web/src/legacy-ui/` with a README and a dev-only `/legacy-ui` showcase.
- **Semantic tokens.** Tokens (`--popover`, `--tooltip`, `--surface`, `--ring`) are defined once for light and dark, and the rebuilt components use them.

## Deviations from the foundation spec
- The legacy library lives inside the web app, not in `packages/legacy-ui`, because it imports app icons and buttons.
- Feature files keep their paired `dark:` classes for now. They move to tokens when they are next touched: a mass rewrite would not change what users see.
- Dates stay on `react-date-range` so they look the same. Its two duplicated wrappers were merged.

## Consequences
- **Gain:** keyboard access and correct ARIA come from a maintained library, and the diff at call sites is minimal.
- **Cost:** a facade layer between features and Radix. New code should use Radix-style APIs directly as features are rebuilt.
