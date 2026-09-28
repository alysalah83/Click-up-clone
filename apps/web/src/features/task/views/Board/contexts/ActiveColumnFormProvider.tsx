"use client";

import { createContext, use, useState } from "react";

interface ActiveColumnFormValues {
  activeStatusColumn: string;
  setActiveColumn: (columnStatus: string) => void;
  handleCloseForm: () => void;
}

const ActiveColumnFormContext = createContext<ActiveColumnFormValues | null>(
  null,
);

function ActiveColumnFormProvider({ children }: { children: React.ReactNode }) {
  const [activeStatusColumn, setActiveStatusColumn] = useState("");

  const setActiveColumn = (columnStatus: string) =>
    setActiveStatusColumn(columnStatus);

  const handleCloseForm = () => setActiveStatusColumn("");

  return (
    <ActiveColumnFormContext
      value={{
        activeStatusColumn,
        setActiveColumn,
        handleCloseForm,
      }}
    >
      {children}
    </ActiveColumnFormContext>
  );
}

function useActiveColumnForm() {
  const values = use(ActiveColumnFormContext);
  if (!values)
    throw new Error(
      "add task panel context is being used outside of his scope",
    );
  return values;
}

export { ActiveColumnFormProvider, useActiveColumnForm };
