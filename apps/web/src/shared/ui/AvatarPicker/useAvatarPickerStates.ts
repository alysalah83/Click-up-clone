"use client";

import { useState } from "react";
import { getRandomColor, getRandomLetter } from "./helper";
import { AvatarLetters } from "./avatarPicker.types";
import { ColorsToken } from "../ColorPicker/types";
import { IconsRegistry } from "../IconPicker/types";

export function useAvatarPickerStates({ label }: { label: string }) {
  const randomColor = getRandomColor();
  const randomLetter = getRandomLetter();
  const [selectedColor, setSelectedColor] = useState<ColorsToken>(randomColor);
  const [selectedIcon, setSelectedIcon] = useState<IconsRegistry | null>(null);
  const avatarLetter = (label.trim().at(0)?.toUpperCase() ||
    randomLetter) as AvatarLetters;

  return {
    selectedColor,
    selectedIcon,
    setSelectedColor,
    setSelectedIcon,
    avatarLetter,
  };
}
