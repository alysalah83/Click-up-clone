import LoginForm from "@/features/auth/components/LoginForm";
import { Metadata } from "next";
import ApiWarmup from "@/shared/components/ApiWarmup";

export const metadata: Metadata = {
  title: "Login",
};

function LoginPage() {
  return (
    <>
      <ApiWarmup />
      <LoginForm />
    </>
  );
}

export default LoginPage;
