import { redirect } from "next/navigation";

export default function LoginPage() {
  // Immediately redirect to Cognito Hosted UI login
  redirect("/api/auth/cognito/login");
}

