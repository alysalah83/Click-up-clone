import { Metadata } from "next";
import TemplatesHome from "@/features/taskTemplates/components/TemplatesHome";

export const metadata: Metadata = {
  title: "Templates",
};

function TemplatesPage() {
  return <TemplatesHome />;
}

export default TemplatesPage;
