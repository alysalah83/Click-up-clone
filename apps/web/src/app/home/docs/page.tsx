import { Metadata } from "next";
import DocsHome from "@/features/docs/components/DocsHome";

export const metadata: Metadata = {
  title: "Docs",
};

function DocsPage() {
  return <DocsHome />;
}

export default DocsPage;
