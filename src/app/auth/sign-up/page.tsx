import Link from "next/link";

import { signUp } from "@/app/auth/actions";
import { AuthField, AuthShell, AuthSubmit } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { Turnstile } from "@/components/auth/turnstile";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return (
    <AuthShell eyebrow="Create your workspace" title="Start your Flipbot account" copy="Create one secure account for your dashboard, preferences and saved opportunities." message={message} footer={<>Already have an account? <Link href="/auth/sign-in" className="font-semibold text-blue-300 hover:text-white">Sign in</Link></>}>
      <form action={signUp} className="space-y-4">
        <AuthField label="Full name" name="fullName" autoComplete="name" placeholder="Your name" />
        <AuthField label="Username" name="username" autoComplete="username" placeholder="your_username" minLength={3} maxLength={24} pattern="[a-z0-9][a-z0-9_]{1,22}[a-z0-9]" hint="3–24 lowercase letters, numbers or single underscores." />
        <AuthField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        <PasswordField label="Password" name="password" />
        <AuthField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} />
        <Turnstile />
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">
          <input name="acceptedTerms" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-blue-500" />
          <span>I confirm that I am at least 18 and agree to Flipbot’s <Link href="/legal/terms" target="_blank" className="font-semibold text-blue-300 hover:text-white">Terms of Service</Link> and <Link href="/legal/privacy" target="_blank" className="font-semibold text-blue-300 hover:text-white">Privacy Policy</Link>.</span>
        </label>
        <AuthSubmit>Create account</AuthSubmit>
      </form>
    </AuthShell>
  );
}
