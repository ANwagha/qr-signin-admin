import type { Metadata } from "next";
import SignupWizard from "@/components/SignupWizard";

export const metadata: Metadata = { title: "Start your free trial" };

export default function SignupPage() {
  return <SignupWizard />;
}
