import MindMapView from "@/features/task/views/MindMap/components/MindMapView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mind Map",
};

function MindMapPage() {
  return <MindMapView />;
}

export default MindMapPage;
