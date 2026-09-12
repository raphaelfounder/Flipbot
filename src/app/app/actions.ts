"use server";

import { redirect } from "next/navigation";

import { validatePasswordSecurely } from "@/lib/auth/password-security";
import { validateUsername } from "@/lib/auth/username-policy";
import { deleteRuntimeAccount, withRuntimeUser } from "@/lib/flipbot-runtime";
import { requireUser } from "@/lib/supabase/auth";

export type AccountActionResult = { ok: true; message: string } | { ok: false; message: string };

export type ProfileUpdate = {
  name: string;
  username: string;
  email: string;
  location: string;
  bio: string;
};

export type SettingsUpdate = {
  currency: string;
  region: string;
  defaultMarketplace: "Facebook" | "eBay";
  defaultDistance: number;
  minProfit: number;
  maxPurchase: number;
  riskTolerance: "Low" | "Medium" | "High";
  emailAlerts: boolean;
  marketingEmailOptIn: boolean;
  quietHours: string;
  compactCards: boolean;
  reducedMotion: boolean;
  density: "Comfortable" | "Compact";
};

export async function updateProfileAction(input: ProfileUpdate): Promise<AccountActionResult> {
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, message: "Enter your full name." };
  const usernameError = validateUsername(username);
  if (usernameError) return { ok: false, message: usernameError };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (input.bio.length > 160) return { ok: false, message: "Your bio must be 160 characters or fewer." };

  const { supabase, user } = await requireUser();
  const { error: profileError } = await supabase.from("profiles").update({
    full_name: name,
    username,
    location: input.location.trim(),
    bio: input.bio.trim(),
  }).eq("id", user.id);

  if (profileError) {
    return { ok: false, message: profileError.code === "23505" ? "That username is already in use." : "Your profile could not be saved." };
  }

  if (email !== user.email?.toLowerCase()) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) return { ok: false, message: emailError.message };
    return { ok: true, message: "Profile saved. Confirm the link sent to your new email address." };
  }

  return { ok: true, message: "Your account details were updated." };
}

export async function updateSettingsAction(input: SettingsUpdate): Promise<AccountActionResult> {
  if (!["GBP", "USD", "EUR"].includes(input.currency)) return { ok: false, message: "Choose a supported currency." };
  if (!Number.isFinite(input.defaultDistance) || input.defaultDistance < 1 || input.defaultDistance > 100) return { ok: false, message: "Default distance must be between 1 and 100 miles." };
  if (!Number.isFinite(input.minProfit) || input.minProfit < 0) return { ok: false, message: "Minimum profit cannot be negative." };
  if (!Number.isFinite(input.maxPurchase) || input.maxPurchase < 0) return { ok: false, message: "Maximum purchase cannot be negative." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("user_settings").update({
    currency: input.currency,
    region: input.region.trim(),
    default_marketplace: input.defaultMarketplace,
    default_distance: input.defaultDistance,
    min_profit: input.minProfit,
    max_purchase: input.maxPurchase,
    risk_tolerance: input.riskTolerance,
    email_alerts: input.emailAlerts,
    quiet_hours: input.quietHours.trim(),
    compact_cards: input.compactCards,
    reduced_motion: input.reducedMotion,
    density: input.density,
  }).eq("id", user.id);
  if (error) return { ok: false, message: "Your settings could not be saved." };
  const { error: marketingError } = await supabase.from("marketing_preferences").update({
    email_opt_in: input.marketingEmailOptIn,
  }).eq("user_id", user.id);
  return marketingError ? { ok: false, message: "Your marketing preference could not be saved." } : { ok: true, message: "Your preferences were updated." };
}

export async function updatePasswordAction(currentPassword: string, nextPassword: string): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user.email) return { ok: false, message: "This account does not have an email sign-in." };

  const passwordPolicyError = await validatePasswordSecurely(nextPassword, [user.email.split("@")[0] || ""]);
  if (passwordPolicyError) return { ok: false, message: passwordPolicyError };

  const { error: passwordError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (passwordError) return { ok: false, message: "Your current password is incorrect." };
  const { error } = await supabase.auth.updateUser({ password: nextPassword });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Your password was updated." };
}

export async function signOutOtherSessionsAction(): Promise<AccountActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  return error ? { ok: false, message: "Other sessions could not be signed out." } : { ok: true, message: "All other sessions were signed out." };
}

export async function deleteAccountAction(currentPassword: string, confirmation: string): Promise<AccountActionResult> {
  if (confirmation !== "DELETE") return { ok: false, message: "Type DELETE exactly to confirm." };
  const { supabase, user } = await requireUser();
  if (!user.email) return { ok: false, message: "This account does not have an email sign-in." };

  const { error: passwordError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (passwordError) return { ok: false, message: "Your current password is incorrect." };

  try {
    await withRuntimeUser(user.id, () => deleteRuntimeAccount());
    return { ok: true, message: "Your account and associated Flipbot data were deleted." };
  } catch {
    return { ok: false, message: "Your account could not be deleted. No changes were made." };
  }
}

export async function signOutAction() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/auth/sign-in?message=You+have+been+signed+out.");
}
