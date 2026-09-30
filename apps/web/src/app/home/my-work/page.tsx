import type { Metadata } from "next";
import MyWorkView from "@/features/home/components/MyWorkView";

export const metadata: Metadata = { title: "My Work" };

export default function MyWorkPage() {
  return <MyWorkView />;
}
