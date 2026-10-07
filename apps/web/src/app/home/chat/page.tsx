import { Metadata } from "next";
import ChatHome from "@/features/chat/components/ChatHome";

export const metadata: Metadata = {
  title: "Chat",
};

function ChatPage() {
  return <ChatHome />;
}

export default ChatPage;
