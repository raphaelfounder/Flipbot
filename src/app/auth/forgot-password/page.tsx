import Link from "next/link";

import { requestPasswordReset } from "@/app/auth/actions";
import { AuthField, AuthShell, AuthSubmit } from "@/components/auth/auth-shell";
import { Turnstile } from "@/components/auth/turnstile";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return (
    <AuthShell eyebrow="Account recovery" title="Reset your password" copy="Enter your account email and we’ll send a secure reset link." message={message} footer={<Link href="/auth/sign-in" className="font-semibold text-blue-300 hover:text-white">Back to sign in</Link>}>
      <form action={requestPasswordReset} className="space-y-4">
        <AuthField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        <Turnstile />
        <AuthSubmit>Send reset link</AuthSubmit>
      </form>
    </AuthShell>
  );
}
