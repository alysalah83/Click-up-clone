/**
 * Decide whether a dragged task must move to a different column.
 *
 * Returns the destination status id when the task must move, or `null`
 * when the drop should be a no-op (dropped on nothing, or dropped back on
 * its own column).
 */
export function shouldMoveTask(
  activeStatusId: string,
  overId: string | number | undefined | null,
): string | null {
  if (overId === undefined || overId === null) return null;
  const target = String(overId);
  return target === activeStatusId ? null : target;
}
