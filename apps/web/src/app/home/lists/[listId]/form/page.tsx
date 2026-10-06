import FormView from "@/features/forms/components/FormView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Form",
};

function FormPage() {
  return <FormView />;
}

export default FormPage;
