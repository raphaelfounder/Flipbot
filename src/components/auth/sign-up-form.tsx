"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";

import { signUp, type SignUpState } from "@/app/auth/actions";
import { AuthField, AuthSubmit } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { Turnstile } from "@/components/auth/turnstile";
import { UsernameField } from "@/components/auth/username-field";

const initialState: SignUpState = { error: null };

export function SignUpForm() {
  const [state, formAction] = useActionState(signUp, initialState);
  const [clientError, setClientError] = useState<string | null>(null);

  return (
    <form onInput={() => setClientError(null)} onSubmit={(event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const password = String(formData.get("password") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");
      if (password !== confirmPassword) {
        setClientError("The passwords do not match.");
        return;
      }
      setClientError(null);
      startTransition(() => formAction(formData));
    }} className="space-y-4">
      <AuthField label="Full name" name="fullName" autoComplete="name" placeholder="Your name" />
      <UsernameField />
      <AuthField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
      <PasswordField label="Password" name="password" />
      <PasswordField label="Confirm password" name="confirmPassword" showStrength={false} />
      <Turnstile />
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">
        <input name="acceptedTerms" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-blue-500" />
        <span>I confirm that I am at least 18 and agree to Flipbot’s <Link href="/legal/terms" target="_blank" className="font-semibold text-blue-300 hover:text-white">Terms of Service</Link> and <Link href="/legal/privacy" target="_blank" className="font-semibold text-blue-300 hover:text-white">Privacy Policy</Link>.</span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">
        <input name="marketingConsent" type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-blue-500" />
        <span>Send me occasional Flipbot product news and offers by email. This is optional, is off by default and can be withdrawn at any time.</span>
      </label>
      {clientError || state.error ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-400/[0.07] p-3 text-sm leading-6 text-red-100">{clientError || state.error}</p> : null}
      <AuthSubmit>Create account</AuthSubmit>
    </form>
  );
}
