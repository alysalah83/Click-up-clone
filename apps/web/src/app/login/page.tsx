import LoginForm from "@/features/auth/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

function LoginPage() {
  return <LoginForm />;
}

export default LoginPage;
