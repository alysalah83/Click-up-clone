import { Metadata } from "next";
import WhiteboardsHome from "@/features/whiteboard/components/WhiteboardsHome";

export const metadata: Metadata = {
  title: "Whiteboards",
};

function WhiteboardsPage() {
  return <WhiteboardsHome />;
}

export default WhiteboardsPage;
