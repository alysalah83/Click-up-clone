import { Metadata } from "next";
import WhiteboardEditor from "@/features/whiteboard/components/WhiteboardEditor";

export const metadata: Metadata = {
  title: "Whiteboard",
};

async function WhiteboardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return <WhiteboardEditor boardId={boardId} />;
}

export default WhiteboardPage;
