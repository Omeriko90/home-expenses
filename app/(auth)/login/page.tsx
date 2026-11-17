import { redirect } from "next/navigation";
import { freshSessionUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await freshSessionUser()) redirect("/dashboard");
  return <LoginForm />;
}
