import { notFound } from "next/navigation";
import LegacyShowcase from "@/legacy-ui/LegacyShowcase";

export default function LegacyUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <LegacyShowcase />;
}
