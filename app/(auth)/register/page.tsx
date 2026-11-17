import { redirect } from "next/navigation";
import { freshSessionUser } from "@/lib/session";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  if (await freshSessionUser()) redirect("/dashboard");
  return <RegisterForm />;
}
