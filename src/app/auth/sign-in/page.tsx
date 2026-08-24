import Link from "next/link";

import { AuthField, AuthShell, AuthSubmit } from "@/components/auth/auth-shell";
import { Turnstile } from "@/components/auth/turnstile";
import { signIn } from "@/app/auth/actions";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to Flipbot" copy="Access your sourcing workspace, saved deals and account settings." message={message} footer={<>New to Flipbot? <Link href="/auth/sign-up" className="font-semibold text-blue-300 hover:text-white">Create an account</Link></>}>
      <form action={signIn} className="space-y-4">
        <AuthField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        <AuthField label="Password" name="password" type="password" autoComplete="current-password" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
          <Link href="/auth/resend-confirmation" className="text-blue-300 hover:text-white">Resend confirmation</Link>
          <Link href="/auth/forgot-password" className="text-blue-300 hover:text-white">Forgot password?</Link>
        </div>
        <Turnstile />
        <AuthSubmit>Sign in</AuthSubmit>
      </form>
    </AuthShell>
  );
}
