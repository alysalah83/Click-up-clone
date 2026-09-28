import { INITIAL_SIDE_BAR_NAV_OPEN } from "./sideBar.const";
import { create } from "zustand";

interface SideBarState {
  isSideBarOpened: boolean;
  setOpenSideBar: () => void;
  setCloseSideBar: () => void;
}

export const useSideBarStore = create<SideBarState>((set) => ({
  isSideBarOpened: INITIAL_SIDE_BAR_NAV_OPEN,
  setOpenSideBar: () => set({ isSideBarOpened: true }),
  setCloseSideBar: () => set({ isSideBarOpened: false }),
}));
