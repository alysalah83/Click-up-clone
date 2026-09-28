import { BsPencil, BsThreeDots } from "react-icons/bs";
import {
  FaBullseye,
  FaMoon,
  FaPaintBrush,
  FaRegUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import {
  FaArrowDownLong,
  FaArrowUpLong,
  FaFlag,
  FaListUl,
  FaPlus,
  FaSort,
} from "react-icons/fa6";
import { FiMail } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi";
import { ImSpinner9 } from "react-icons/im";
import {
  IoCheckmarkCircleSharp,
  IoSearchOutline,
  IoCloseOutline,
  IoCheckmarkSharp,
  IoSettings,
  IoWaterOutline,
} from "react-icons/io5";
import { MdLockOutline, MdOutlineBlock, MdSunny } from "react-icons/md";
import {
  PiArrowBendDownLeftBold,
  PiArrowBendDownRightBold,
  PiCalendarDotsFill,
  PiExclamationMarkBold,
  PiWarningFill,
} from "react-icons/pi";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiHomeSmileFill,
  RiInsertColumnLeft,
  RiProgress3Line,
} from "react-icons/ri";
import {
  TbCircleDotted,
  TbLayoutDashboardFilled,
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarRightCollapseFilled,
  TbRouteOff,
  TbZoomQuestionFilled,
} from "react-icons/tb";
import { VscGraph } from "react-icons/vsc";
import { RiDraggable } from "react-icons/ri";

import { TiCalendar } from "react-icons/ti";

export const ICONS_MAP = {
  home: RiHomeSmileFill,
  dashboard: VscGraph,
  circleDotted: TbCircleDotted,
  inProgress: RiProgress3Line,
  complete: IoCheckmarkCircleSharp,
  search: IoSearchOutline,
  sideBarLeftCollapse: TbLayoutSidebarLeftCollapseFilled,
  sideBarRightCollapse: TbLayoutSidebarRightCollapseFilled,
  plus: FaPlus,
  list: FaListUl,
  board: TbLayoutDashboardFilled,
  date: PiCalendarDotsFill,
  flag: FaFlag,
  close: IoCloseOutline,
  error: PiWarningFill,
  dotsRow: BsThreeDots,
  trash: HiOutlineTrash,
  leftArrow: PiArrowBendDownLeftBold,
  rightArrow: PiArrowBendDownRightBold,
  leftArrow2: RiArrowLeftSLine,
  rightArrow2: RiArrowRightSLine,
  checkMark: IoCheckmarkSharp,
  pen: BsPencil,
  mail: FiMail,
  lock: MdLockOutline,
  user: FaRegUserCircle,
  notAllowed: MdOutlineBlock,
  spinner: ImSpinner9,
  sort: FaSort,
  arrowUp: FaArrowUpLong,
  arrowDown: FaArrowDownLong,
  bullEye: FaBullseye,
  signOut: FaSignOutAlt,
  exclamationMark: PiExclamationMarkBold,
  setting: IoSettings,
  moon: FaMoon,
  sun: MdSunny,
  water: IoWaterOutline,
  paintBrush: FaPaintBrush,
  addColumn: RiInsertColumnLeft,
  noRoute: TbRouteOff,
  notFound: TbZoomQuestionFilled,
  calendar: TiCalendar,
  dragHandle: RiDraggable,
} as const;
