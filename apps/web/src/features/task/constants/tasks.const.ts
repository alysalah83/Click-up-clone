import { OptionUiItem } from "@/shared/types/types";

const TASK_RENAME_FORM_ICON_SIZE = 3.5;
const TASK_ICON_SIZE = 3.5;

const TASK_REVALIDATE_TIME = 1000 * 3600; // one hour

const TASK_PRIORITIES_LIST = [
  {
    iconColor: "fill-pink-500",
    label: "Urgent",
    colorHex: "#f6339a",
  },
  {
    iconColor: "fill-amber-500",
    label: "High",
    colorHex: "#fd9a00",
  },
  {
    iconColor: "fill-blue-500",
    label: "Normal",
    colorHex: "#2b7fff",
  },
  {
    iconColor: "fill-stone-500",
    label: "Low",
    colorHex: "#79716b",
  },
] as const;

const TASK_FEATURES = [
  { id: "date", icon: "date", label: "Add date" },
  { id: "Priority", icon: "flag", label: "Add priority" },
] as const;

const OPTIONS_UI_MENU = [
  {
    id: "rename",
    icon: "pen",
    label: "Rename",
    color: null,
    display: null,
  },
  {
    id: "delete",
    icon: "trash",
    label: "Delete",
    color: "text-red-400/80",
    display: null,
  },
] as OptionUiItem[];

const TASK_VIEWS = ["board", "list", "table"];

export {
  TASK_RENAME_FORM_ICON_SIZE,
  TASK_PRIORITIES_LIST,
  TASK_ICON_SIZE,
  TASK_FEATURES,
  OPTIONS_UI_MENU,
  TASK_REVALIDATE_TIME,
  TASK_VIEWS,
};
