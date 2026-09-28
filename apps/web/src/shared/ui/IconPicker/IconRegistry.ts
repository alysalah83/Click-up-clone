import { ICONS_MAP } from "@/shared/icons/icons-map";
import * as ICONS from "react-icons/ti";

const ICONS_LIBRARY = "Ti";

const ICONS_REGISTRY = {
  ...ICONS,
  circleDotted: ICONS_MAP.circleDotted,
  inProgress: ICONS_MAP.inProgress,
  complete: ICONS_MAP.complete,
} as const;

const ITEMS_PER_ROW = 5;
const ROW_HEIGHT = 36;
const OVER_SCAN_ROWS = 2;

export {
  ICONS_LIBRARY,
  ICONS_REGISTRY,
  ITEMS_PER_ROW,
  ROW_HEIGHT,
  OVER_SCAN_ROWS,
};
