import Link from "next/link";

import { resendConfirmation } from "@/app/auth/actions";
import { AuthField, AuthShell, AuthSubmit } from "@/components/auth/auth-shell";
import { Turnstile } from "@/components/auth/turnstile";

export default async function ResendConfirmationPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;

  return (
    <AuthShell
      eyebrow="Email verification"
      title="Resend confirmation email"
      copy="Enter the email address you used to create your Flipbot account. We’ll send a fresh verification link if the account is waiting for confirmation."
      message={message}
      footer={<Link href="/auth/sign-in" className="font-semibold text-blue-300 hover:text-white">Back to sign in</Link>}
    >
      <form action={resendConfirmation} className="space-y-4">
        <AuthField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        <Turnstile />
        <AuthSubmit>Resend confirmation email</AuthSubmit>
      </form>
    </AuthShell>
  );
}
