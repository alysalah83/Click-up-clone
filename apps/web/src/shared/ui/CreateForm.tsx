import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useTransition,
  useState,
} from "react";
import ErrorMessage from "./ErrorMessage/ErrorMessage";
import ControlledFormInput from "./Input/ControlledInput";
import { useRouter } from "next/navigation";
import { useModal } from "./ModalCompound";
import { ActionResponse, ErrorResponse } from "../types/action.types";
import { Button } from "./Button";

interface CreateFormProps {
  children?: ReactNode;
  theAction: (...args: any) => Promise<ActionResponse>;
  inputPlaceholder: string;
  name: string;
  headerTitle: string;
  headerText: string;
  inputLabel: string;
  actionFor: "workspace" | "list";
  setInputValue: Dispatch<SetStateAction<string>>;
  inputValue: string;
}

function CreateForm({
  children,
  name,
  theAction,
  inputPlaceholder,
  headerTitle,
  headerText,
  inputLabel,
  actionFor,
  setInputValue: setNameValue,
  inputValue: nameValue,
}: CreateFormProps) {
  const { push } = useRouter();
  const { toggleModal } = useModal();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ErrorResponse | null>(null);

  const isFormValid = nameValue.trim().length > 0;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await theAction(formData);

      if (result.status === "error") return setError(result.error);

      if (result.status === "success") {
        if ("payload" in result)
          push(`/home/lists/${result.payload.listId}/board`);

        toggleModal();
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-w-80 flex-col gap-5 p-6 text-neutral-700 lg:max-w-lg lg:min-w-lg dark:text-neutral-500"
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          {headerTitle}
        </h2>
        <p className="text-sm">{headerText}</p>
      </header>
      <main className="flex flex-col gap-2">
        <h3 className="font-medium text-neutral-600 dark:text-neutral-400">
          {inputLabel}
        </h3>
        <div className="flex items-center gap-3">
          {children}
          <div className="w-full">
            <ControlledFormInput
              disabled={isPending}
              name="name"
              type="text"
              placeholder={inputPlaceholder}
              value={name}
              onChange={(e) => setNameValue(e.target.value)}
            />
          </div>
        </div>
      </main>
      <footer className="mt-3 flex justify-between">
        {error && (
          <ErrorMessage error={error.message} errorObject={error.errors} />
        )}
        <Button
          disabled={isPending || !isFormValid}
          pending={isPending}
          size="medium"
          ariaLabel={`${actionFor} create button`}
          extraClasses="ml-auto"
          buttonFor="submit"
        >
          Create
        </Button>
      </footer>
    </form>
  );
}

export default CreateForm;
