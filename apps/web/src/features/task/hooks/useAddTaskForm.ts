"use client";

import { useParams } from "next/navigation";
import { useAddTask } from "./useAddTask";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema } from "../schema/task-action.schema";
import { CreateTaskInput, Task } from "../types";
import { useEffect, useRef } from "react";

interface UseClientAddTaskProps {
  statusId: Task["statusId"];
  onClose: () => void;
}

export function useAddTaskForm({ statusId, onClose }: UseClientAddTaskProps) {
  const { listId } = useParams<{ listId: string }>();
  const formRef = useRef<HTMLFormElement>(null);
  const { addTask } = useAddTask(statusId);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setFocus,
    control,
    formState: { errors, isValid },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema) as Resolver<CreateTaskInput>,
    defaultValues: { name: "", priority: "none", statusId, listId },
    mode: "onChange",
  });

  const onSubmit = (data: CreateTaskInput) => {
    addTask(data);
    reset({ name: "", priority: "none", statusId, listId });
  };

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (
        formRef.current &&
        e.target instanceof Node &&
        !formRef.current.contains(e.target)
      )
        onClose();
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") formRef.current?.requestSubmit();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return {
    handleSubmit: handleSubmit(onSubmit),
    register,
    isValid,
    errors,
    setValue,
    formRef,
    control,
  };
}
