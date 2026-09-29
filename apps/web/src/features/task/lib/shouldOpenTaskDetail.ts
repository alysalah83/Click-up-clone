/**
 * Decide whether a click or keypress on a board task card should open the
 * task detail panel.
 *
 * Used for both the card's `onClick` (no `key`) and `onKeyDown` (`key` set
 * to the pressed key) handlers, so the same guards — renaming/temp-task
 * gating, ignoring clicks on interactive descendants (buttons, links,
 * inputs, portaled menus/dialogs), and ignoring bubbled clicks that
 * originated outside the card's own DOM (React re-dispatches a portal's
 * synthetic events through the React tree it was mounted from, so a click
 * inside a portaled Menu/Modal still reaches this card's handler even
 * though the portaled node is not a DOM descendant of `currentTarget`) —
 * live in one place and are unit-testable without rendering the card.
 */

// Elements whose own click must not open the detail panel.
const NO_CARD_CLICK_SELECTOR =
  'button, a, input, textarea, select, [role="menu"], [role="dialog"], [data-no-card-click]';

interface ShouldOpenTaskDetailParams {
  /** The event's `target` (`e.target`). */
  target: Element | null;
  /** The event's `currentTarget` — the card element the handler is bound to. */
  currentTarget: Element;
  isRenameOpen: boolean;
  isTempTask: boolean;
  /**
   * The pressed key, for a keydown event. Omit (or pass `undefined`) for a
   * click event.
   */
  key?: string;
}

export function shouldOpenTaskDetail({
  target,
  currentTarget,
  isRenameOpen,
  isTempTask,
  key,
}: ShouldOpenTaskDetailParams): boolean {
  if (isRenameOpen || isTempTask) return false;
  if (!target) return false;
  // Clicks/keys that bubbled from outside the card's own DOM (a portaled
  // Menu or Modal) never open the panel.
  if (!currentTarget.contains(target)) return false;

  if (key !== undefined) {
    // Only the card element itself responds to Enter/Space — a keypress
    // while focus is on an inner interactive element (e.g. a button) is
    // that element's own concern.
    if (target !== currentTarget) return false;
    return key === "Enter" || key === " ";
  }

  if (target.closest(NO_CARD_CLICK_SELECTOR)) return false;
  return true;
}
