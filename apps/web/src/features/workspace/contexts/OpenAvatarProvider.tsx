"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  use,
  useState,
} from "react";

interface OpenAvatarContextValues {
  isAvatarPickerOpened: boolean;
  handleToggleAvatarPicker: () => void;
  setIsAvatarPickerOpened: Dispatch<SetStateAction<boolean>>;
}

const OpenAvatarContext = createContext<OpenAvatarContextValues | null>(null);

function OpenAvatarPickerProvider({
  children,
}: {
  children: Readonly<ReactNode>;
}) {
  const [isAvatarPickerOpened, setIsAvatarPickerOpened] = useState(false);

  const handleToggleAvatarPicker = () => setIsAvatarPickerOpened((cur) => !cur);

  return (
    <OpenAvatarContext
      value={{
        isAvatarPickerOpened,
        handleToggleAvatarPicker,
        setIsAvatarPickerOpened,
      }}
    >
      {children}
    </OpenAvatarContext>
  );
}

function useOpenAvatarPicker() {
  const values = use(OpenAvatarContext);
  if (!values)
    throw new Error(
      "open avatar picker context is being used outside his scope",
    );

  return values;
}

export { useOpenAvatarPicker, OpenAvatarPickerProvider };
