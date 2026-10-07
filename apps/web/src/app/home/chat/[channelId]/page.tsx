import { Metadata } from "next";
import ChatChannelView from "@/features/chat/components/ChatChannelView";

export const metadata: Metadata = {
  title: "Chat",
};

async function ChatChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  return <ChatChannelView key={channelId} channelId={channelId} />;
}

export default ChatChannelPage;
