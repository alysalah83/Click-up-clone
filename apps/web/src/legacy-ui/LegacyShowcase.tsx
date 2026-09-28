"use client";

import { Menu, MenuContent, MenuTrigger } from "./MenuCompound";
import Modal, { ModalContent, ModalTrigger } from "./ModalCompound";
import { ToolTip, ToolTipMessage, ToolTipTrigger } from "./ToolTipCompound";

export default function LegacyShowcase() {
  return (
    <main className="flex min-h-screen flex-col items-start gap-8 p-10">
      <h1 className="text-2xl font-bold">Legacy UI (v1) showcase</h1>

      <Menu>
        <MenuTrigger>
          <button type="button" className="rounded-lg border px-3 py-2">Open legacy menu</button>
        </MenuTrigger>
        <MenuContent>
          <p className="p-4">Hand-positioned menu content</p>
        </MenuContent>
      </Menu>

      <Modal>
        <ModalTrigger>
          <button type="button" className="rounded-lg border px-3 py-2">Open legacy modal</button>
        </ModalTrigger>
        <ModalContent>
          <p className="p-10">Legacy modal content</p>
        </ModalContent>
      </Modal>

      <ToolTip>
        <ToolTipTrigger>
          <button type="button" className="rounded-lg border px-3 py-2">Hover for legacy tooltip</button>
        </ToolTipTrigger>
        <ToolTipMessage>Positioned with manual math</ToolTipMessage>
      </ToolTip>
    </main>
  );
}
