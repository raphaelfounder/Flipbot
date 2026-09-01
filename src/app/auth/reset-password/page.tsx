import Link from "next/link";

import { resetPassword } from "@/app/auth/actions";
import { AuthField, AuthShell, AuthSubmit } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return (
    <AuthShell eyebrow="Choose a new password" title="Secure your account" copy="Use at least eight characters and avoid reusing a password from another service." message={message} footer={<Link href="/auth/sign-in" className="font-semibold text-blue-300 hover:text-white">Back to sign in</Link>}>
      <form action={resetPassword} className="space-y-4">
        <PasswordField label="New password" name="password" />
        <AuthField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} />
        <AuthSubmit>Update password</AuthSubmit>
      </form>
    </AuthShell>
  );
}
