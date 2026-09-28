import { ALPHABET_LETTERS } from "@/shared/constants/ui";
import { AvatarLetters } from "./avatarPicker.types";
import { IconsRegistry } from "../IconPicker/types";
import { ICONS_LIBRARY } from "../IconPicker/IconRegistry";
import { COLORS_TOKENS } from "../ColorPicker/colorTokens";
import { ColorsToken } from "../ColorPicker/types";

const isAvatarIcon = (label: IconsRegistry | AvatarLetters) => {
  return label?.startsWith(ICONS_LIBRARY);
};

const getRandomColor = () => {
  const colorsArr = Object.entries(COLORS_TOKENS);
  const randomIndex = Math.floor(Math.random() * colorsArr.length);
  return colorsArr[randomIndex]![0] as ColorsToken;
};

const getRandomLetter = () => {
  const randomIndex = Math.floor(Math.random() * ALPHABET_LETTERS.length);
  return ALPHABET_LETTERS[randomIndex];
};

export { getRandomColor, getRandomLetter, isAvatarIcon };
