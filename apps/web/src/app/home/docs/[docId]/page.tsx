import { Metadata } from "next";
import DocEditor from "@/features/docs/components/DocEditor";

export const metadata: Metadata = {
  title: "Docs",
};

async function DocPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  return <DocEditor docId={docId} />;
}

export default DocPage;
