import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return (
    <AuthShell eyebrow="Create your workspace" title="Start your Flipbot account" copy="Create one secure account for your dashboard, preferences and saved opportunities." message={message} footer={<>Already have an account? <Link href="/auth/sign-in" className="font-semibold text-blue-300 hover:text-white">Sign in</Link></>}>
      <SignUpForm />
    </AuthShell>
  );
}
