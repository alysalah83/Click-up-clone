import { ALPHABET_LETTERS } from "@/shared/constants/ui";
import Avatar from "./Avatar";
import { IconsRegistry } from "../IconPicker/types";
import { ColorsToken } from "../ColorPicker/types";

type AvatarLetters = (typeof ALPHABET_LETTERS)[number];

type Avatar = Omit<
  {
    id: string;
    icon: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  },
  "icon" | "color"
> & {
  icon: IconsRegistry | AvatarLetters;
  color: ColorsToken;
};

type CreateAvatar = {
  id?: string;
  icon: string;
  color: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type { Avatar, AvatarLetters, CreateAvatar };
