import { redirect } from "next/navigation";
import { freshSessionUser } from "@/lib/session";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  if (await freshSessionUser()) redirect("/dashboard");
  return <ForgotPasswordForm />;
}
