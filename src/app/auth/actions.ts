"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { validatePasswordSecurely } from "@/lib/auth/password-security";
import { validateUsername } from "@/lib/auth/username-policy";
import { legalVersions } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function rawValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function captchaToken(formData: FormData, path: string) {
  const token = rawValue(formData, "cf-turnstile-response");
  if (!token) authRedirect(path, "Complete the bot-protection check and try again.");
  return token;
}

function authRedirect(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

async function siteOrigin() {
  const requestHeaders = await headers();
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const requestOrigin = requestHeaders.get("origin")?.trim().replace(/\/$/, "");

  // Never send production auth emails back to a developer machine if a local
  // environment value was accidentally copied into the deployment settings.
  if (process.env.NODE_ENV === "production") {
    if (configuredOrigin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredOrigin)) {
      return configuredOrigin;
    }
    if (requestOrigin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)) {
      return requestOrigin;
    }
    return "https://www.flipbot.me";
  }

  return configuredOrigin || requestOrigin || "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = rawValue(formData, "password");
  if (!email || !password) authRedirect("/auth/sign-in", "Enter your email and password.");
  const token = captchaToken(formData, "/auth/sign-in");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: token } });
  if (error?.code === "email_not_confirmed") {
    authRedirect("/auth/sign-in", "Confirm your email before signing in. If the message did not arrive, request a new one below.");
  }
  if (error) authRedirect("/auth/sign-in", "The email or password was not recognised.");
  redirect("/app");
}

export type SignUpState = { error: string | null };

export async function signUp(_previousState: SignUpState, formData: FormData): Promise<SignUpState> {
  const fullName = value(formData, "fullName");
  const username = value(formData, "username").toLowerCase();
  const email = value(formData, "email").toLowerCase();
  const password = rawValue(formData, "password");
  const confirmPassword = rawValue(formData, "confirmPassword");
  const acceptedTerms = formData.get("acceptedTerms") === "on";
  const marketingConsent = formData.get("marketingConsent") === "on";
  const token = rawValue(formData, "cf-turnstile-response");

  if (!acceptedTerms) return { error: "Confirm that you are at least 18 and agree to the Terms and Privacy Policy." };
  if (fullName.length < 2) return { error: "Enter your full name." };
  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  if (password !== confirmPassword) return { error: "The passwords do not match." };
  const passwordError = await validatePasswordSecurely(password, [fullName, username, email.split("@")[0] || ""]);
  if (passwordError) return { error: passwordError };
  if (!token) return { error: "Complete the bot-protection check and try again." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/app&verified=1`,
      data: {
        full_name: fullName,
        username,
        accepted_terms_version: legalVersions.terms,
        accepted_privacy_version: legalVersions.privacy,
        accepted_acceptable_use_version: legalVersions.acceptableUse,
        marketing_email_consent: marketingConsent,
      },
      captchaToken: token,
    },
  });

  if (error) return { error: error.message };
  if (data.session) redirect("/app");
  authRedirect("/auth/sign-in", "Check your email to confirm your account, then sign in.");
}

export async function requestPasswordReset(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) authRedirect("/auth/forgot-password", "Enter the email address for your account.");
  const token = captchaToken(formData, "/auth/forgot-password");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/auth/reset-password`,
    captchaToken: token,
  });
  if (error) authRedirect("/auth/forgot-password", error.message);
  authRedirect("/auth/sign-in", "If that email has a Flipbot account, a reset link is on its way.");
}

export async function resendConfirmation(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    authRedirect("/auth/resend-confirmation", "Enter the email address you used to create your account.");
  }
  const token = captchaToken(formData, "/auth/resend-confirmation");

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/app&verified=1`,
      captchaToken: token,
    },
  });

  if (error?.code === "over_email_send_rate_limit") {
    authRedirect("/auth/resend-confirmation", "Please wait a minute before requesting another confirmation email.");
  }
  if (error) authRedirect("/auth/resend-confirmation", error.message);
  authRedirect("/auth/sign-in", "If that account is waiting for confirmation, a new email is on its way.");
}

export async function resetPassword(formData: FormData) {
  const password = rawValue(formData, "password");
  const confirmPassword = rawValue(formData, "confirmPassword");
  if (password !== confirmPassword) authRedirect("/auth/reset-password", "The passwords do not match.");
  const passwordError = await validatePasswordSecurely(password);
  if (passwordError) authRedirect("/auth/reset-password", passwordError);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) authRedirect("/auth/forgot-password", "Your reset link has expired. Request a new one.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) authRedirect("/auth/reset-password", error.message);
  await supabase.auth.signOut({ scope: "local" });
  authRedirect("/auth/sign-in", "Password updated. Sign in with your new password.");
}
