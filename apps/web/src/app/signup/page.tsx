import SignupForm from "@/features/auth/components/SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
};

function SignupPage() {
  return <SignupForm />;
}

export default SignupPage;
