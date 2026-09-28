# Legacy UI (v1)

These are the compound components this app shipped with before it moved to Radix primitives (see `docs/adr/0002-adopt-shadcn-ui.md`). They are kept unchanged as a record of the original design. The live app does not import them.

| Component | Pattern it demonstrates |
|---|---|
| `MenuCompound` | Compound components over React context, a portal to `document.body`, manual viewport-aware positioning (flip and clamp), motion enter/exit |
| `ModalCompound` | Uncontrolled dialog with context-exposed `toggleModal` / `closeModal`, animated backdrop and panel |
| `ToolTipCompound` | Hover tooltip with four-side positioning math and a CSS arrow |
| `ToastsManger` | Imperative global API (`window.toast`) with a queue, auto-dismiss and a progress bar |
| `GlobalModal` | Imperative stacked modals (`window.modal.open/close`) with Escape handling |
| `DropdownCompound` | Hover-reveal action rows |

**Why they were replaced:** none of them handled keyboard users. There was no Escape on menus or modals, no focus trap and no focus return, tooltips did not open on focus, and positioning did not follow scroll or resize. Radix covers all of that and is maintained upstream. The public APIs were kept, so the ~60 call sites did not change.

Run `pnpm --filter @clickup/web dev` and open `/legacy-ui` to try them (development only).
