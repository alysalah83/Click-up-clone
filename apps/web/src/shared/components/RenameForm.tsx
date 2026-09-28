import {
  memo,
  SubmitEvent,
  SubmitEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";

interface RenameFormProps {
  initialName: string;
  onClose: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onSave: (name: string) => void;
}

function RenameForm({ onClose, initialName, onSave }: RenameFormProps) {
  const [nameValue, setNameValue] = useState(initialName);
  const containerRef = useRef<HTMLFormElement | null>(null);
  const isValid = nameValue.trim().length > 0;

  useEffect(() => {
    if (!containerRef.current) return;

    const handleClickOutside = function (e: MouseEvent) {
      if (e.target instanceof Node && containerRef.current?.contains(e.target))
        return;
      else onSave(nameValue);
    };

    document.body.addEventListener("click", handleClickOutside);

    return () => document.body.removeEventListener("click", handleClickOutside);
  }, [onSave, nameValue]);

  const handleRename: SubmitEventHandler<HTMLFormElement> = (
    e: SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!isValid) return;
    if (initialName === nameValue) return;

    onSave(nameValue);
    onClose();
  };

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key === "Enter") return onSave(nameValue);
    };

    document.addEventListener("keydown", handleKeys);

    return () => document.removeEventListener("keydown", handleKeys);
  }, [onClose, onSave, nameValue]);

  return (
    <form className="w-full" ref={containerRef} onSubmit={handleRename}>
      <input
        onChange={(e) => setNameValue(e.target.value)}
        autoFocus
        value={nameValue}
        name="name"
        type="text"
        className="w-full text-sm text-neutral-900 outline-0 dark:text-neutral-100"
        title="Rename Task"
      />
    </form>
  );
}

export default memo(RenameForm);
