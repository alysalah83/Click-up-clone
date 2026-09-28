"use client";

import { useEffect, useState } from "react";
import { useMultiStep } from "../../../shared/hooks/useMultiStep";
import {
  getRandomColor,
  getRandomLetter,
} from "../../../shared/ui/AvatarPicker/helper";
import { ModalContent, useModal } from "../../../shared/ui/ModalCompound";
import CreateWorkspaceStep from "./CreateWorkspaceStep";
import { Button } from "@/shared/ui/Button";
import CreateListStep from "@/features/list/components/CreateListStep";
import AddStatusStep from "@/features/status/components/AddStatusStep";
import CreateTaskStep from "@/features/task/components/CreateTaskStep";
import { Task } from "@/features/task/types";
import StepsProgressBar from "@/shared/ui/StepsProgressBar";
import ErrorMessage from "@/shared/ui/ErrorMessage/ErrorMessage";
import { createWorkspaceFlow } from "../actions/create-workspace-flow.action";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { useRouter } from "next/navigation";
import { AvatarLetters } from "@/shared/ui/AvatarPicker/avatarPicker.types";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { AnimatePresence, motion } from "motion/react";

function CreateSpaceFlow() {
  const { closeModal } = useModal();
  const { push } = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [flowData, setFlowData] = useState({
    workspace: {
      name: "",
      avatar: {
        icon: getRandomLetter() as AvatarLetters | IconsRegistry,
        color: getRandomColor(),
      },
    },
    list: {
      name: "",
    },
    status: {
      name: "",
      bgColor: getRandomColor(),
    },
    task: {
      name: "",
      priority: "none" as Task["priority"],
      startDate: null as Task["startDate"],
      endDate: null as Task["endDate"],
    },
  });
  const updateFlowData = (
    section: keyof typeof flowData,
    fields: Record<string, unknown>,
  ) =>
    setFlowData((cur) => ({
      ...cur,
      [section]: { ...cur[section], ...fields },
    }));
  const [isTouched, setIsTouched] = useState(false);

  const stepsComponents = [
    <CreateWorkspaceStep
      data={flowData.workspace}
      onChange={(fields: Record<string, unknown>) =>
        updateFlowData("workspace", fields)
      }
      onBlur={() => setIsTouched(true)}
      key="step-1"
    />,
    <CreateListStep
      data={flowData.list}
      onChange={(fields: Record<string, unknown>) =>
        updateFlowData("list", fields)
      }
      onBlur={() => setIsTouched(true)}
      key="step-2"
    />,
    <AddStatusStep
      data={flowData.status}
      onChange={(fields: Record<string, unknown>) =>
        updateFlowData("status", fields)
      }
      onBlur={() => setIsTouched(true)}
      key="step-3"
    />,
    <CreateTaskStep
      data={flowData.task}
      onChange={(fields: Record<string, unknown>) =>
        updateFlowData("task", fields)
      }
      onBlur={() => setIsTouched(true)}
      key="step-4"
    />,
  ];

  const {
    curStep,
    isFirstStep,
    isLastStep,
    curStepComponent,
    handleGoNext,
    handleGoPrev,
    direction,
  } = useMultiStep({ stepsComponents });

  const stepsLabel = ["Workspace", "List", "Status", "Task"];

  const isStepVialed =
    !!flowData[
      stepsLabel[curStep]?.toLocaleLowerCase() as keyof typeof flowData
    ].name.trim();

  const variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        visualDuration: 0.25,
        bounce: 0.1,
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: "easeIn" as const,
      },
    }),
  };

  return (
    <ModalContent contentYPosition="withTopMargin">
      <div className="px-6 pt-6">
        <StepsProgressBar stepsLabel={stepsLabel} curActiveStep={curStep} />
      </div>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={curStep}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {curStepComponent}
        </motion.div>
      </AnimatePresence>
      <footer className="mt-3 flex items-center justify-between px-6 pb-6">
        {isTouched && !isStepVialed && (
          <ErrorMessage error="name is required" />
        )}

        <div className="ml-auto flex justify-end gap-4">
          <Button
            size="medium"
            type="primary"
            ariaLabel="go next button"
            onClick={() => {
              handleGoPrev();
              setIsTouched(false);
            }}
            disabled={isFirstStep || isPending}
          >
            Prev
          </Button>
          <Button
            size="medium"
            type="colored"
            ariaLabel="go next button"
            onClick={async () => {
              if (isLastStep) {
                setIsPending(true);
                const results = await createWorkspaceFlow({
                  workspaceInputs: { ...flowData.workspace },
                  listInputs: { ...flowData.list },
                  statusInputs: {
                    ...flowData.status,
                    icon: "inProgress",
                    iconColor: flowData.status.bgColor,
                  },
                  taskInputs: { ...flowData.task },
                });
                setIsPending(false);
                if (results.status === "error")
                  window.toast?.error(formatErrorForToast(results.error));
                if (results.status === "success" && "payload" in results) {
                  closeModal();
                  push(`/home/lists/${results.payload.listId}/board`);
                }
              } else {
                handleGoNext();
                setIsTouched(false);
              }
            }}
            pending={isPending}
            disabled={!isStepVialed || isPending}
          >
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </footer>
    </ModalContent>
  );
}

export default CreateSpaceFlow;
