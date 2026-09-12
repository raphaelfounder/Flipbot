"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { validateUsername } from "@/lib/auth/username-policy";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UsernameState = "idle" | "checking" | "available" | "unavailable" | "invalid" | "error";

export function UsernameField() {
  const [username, setUsername] = useState("");
  const [state, setState] = useState<UsernameState>("idle");
  const [message, setMessage] = useState("3–24 lowercase letters, numbers or single underscores.");

  useEffect(() => {
    if (state !== "checking") return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("username_available", { candidate: username });
      if (controller.signal.aborted) return;
      if (error) {
        setState("error");
        setMessage("Could not check availability. You can still submit the form.");
      } else if (data === true) {
        setState("available");
        setMessage("Username is available.");
      } else {
        setState("unavailable");
        setMessage("That username is already taken.");
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [state, username]);

  function updateUsername(rawUsername: string) {
    const nextUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(nextUsername);
    if (!nextUsername) {
      setState("idle");
      setMessage("3–24 lowercase letters, numbers or single underscores.");
      return;
    }
    const validationError = validateUsername(nextUsername);
    if (validationError) {
      setState("invalid");
      setMessage(validationError);
      return;
    }
    setState("checking");
    setMessage("Checking availability…");
  }

  const hasError = state === "invalid" || state === "unavailable";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">Username</span>
      <span className="relative block">
        <input
          name="username"
          type="text"
          autoComplete="username"
          placeholder="your_username"
          minLength={3}
          maxLength={24}
          pattern="[a-z0-9][a-z0-9_]{1,22}[a-z0-9]"
          onChange={(event) => updateUsername(event.target.value)}
          aria-describedby="username-status"
          aria-invalid={hasError}
          required
          className={cn(
            "min-h-12 w-full rounded-xl border bg-white/[0.035] px-3 pr-11 text-base text-white outline-none placeholder:text-slate-600 focus:ring-2",
            state === "available" && "border-emerald-300/45 focus:border-emerald-300/60 focus:ring-emerald-500/10",
            hasError && "border-red-300/45 focus:border-red-300/60 focus:ring-red-500/10",
            state !== "available" && !hasError && "border-white/[0.09] focus:border-blue-300/45 focus:ring-blue-500/10",
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center" aria-hidden="true">
          {state === "checking" ? <LoaderCircle className="h-4 w-4 animate-spin text-blue-300" /> : null}
          {state === "available" ? <Check className="h-5 w-5 text-emerald-300" strokeWidth={2.5} /> : null}
          {hasError ? <X className="h-5 w-5 text-red-300" strokeWidth={2.5} /> : null}
        </span>
      </span>
      <span id="username-status" aria-live="polite" className={cn("mt-2 block text-xs leading-5", state === "available" ? "text-emerald-300" : hasError ? "text-red-300" : "text-slate-500")}>
        {message}
      </span>
    </label>
  );
}
