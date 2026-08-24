"use client";

import { useId, useState } from "react";

import { measurePasswordStrength, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";

const BAR_COLOURS = ["bg-rose-500", "bg-orange-400", "bg-amber-300", "bg-blue-400", "bg-emerald-400"];

export function PasswordField({
  label,
  name,
  personalTerms = [],
}: {
  label: string;
  name: string;
  personalTerms?: string[];
}) {
  const [password, setPassword] = useState("");
  const hintId = useId();
  const result = measurePasswordStrength(password, personalTerms);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      <input
        name={name}
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-describedby={hintId}
        className="min-h-12 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-blue-300/45 focus:ring-2 focus:ring-blue-500/10"
      />
      <div id={hintId} className="mt-2" aria-live="polite">
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((level) => (
            <span key={level} className={`h-1 rounded-full ${password && result.score >= level ? BAR_COLOURS[result.score] : "bg-white/[0.08]"}`} />
          ))}
        </div>
        <div className="mt-2 flex items-start justify-between gap-3 text-xs leading-5">
          <span className={password ? "font-semibold text-slate-300" : "text-slate-500"}>{password ? result.label : "At least 8 characters"}</span>
          <span className="max-w-[68%] text-right text-slate-500">{password ? (result.suggestions[0] || "This password meets the standard.") : "Spaces are allowed. Longer passphrases work well."}</span>
        </div>
      </div>
    </label>
  );
}
