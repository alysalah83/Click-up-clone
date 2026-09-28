"use client";

import { use, useEffect } from "react";
import { UserWithoutPassword } from "../types";
import Modal, { ModalContent } from "@/shared/ui/ModalCompound";
import CreateSpaceFlow from "@/features/workspace/components/CreateSpaceFlow";
import { updateUser } from "../actions/update-user.action";

function OnBoardingTrigger({
  userPromise,
}: {
  userPromise: Promise<UserWithoutPassword>;
}) {
  const user = use(userPromise);

  if (!user || user.hasOnBoarded) return null;

  return (
    <Modal initialOpen={true}>
      <Content />
    </Modal>
  );
}

function Content() {
  useEffect(() => {
    updateUser({ hasOnBoarded: true });
  }, []);

  return (
    <ModalContent>
      <CreateSpaceFlow />
    </ModalContent>
  );
}

export default OnBoardingTrigger;
