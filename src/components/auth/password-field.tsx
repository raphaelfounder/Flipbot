"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import { measurePasswordStrength, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";

const BAR_COLOURS = ["bg-rose-500", "bg-orange-400", "bg-amber-300", "bg-blue-400", "bg-emerald-400"];

export function PasswordField({
  label,
  name,
  personalTerms = [],
  showStrength = true,
}: {
  label: string;
  name: string;
  personalTerms?: string[];
  showStrength?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const hintId = useId();
  const result = measurePasswordStrength(password, personalTerms);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      <span className="relative block">
        <input
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          required
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={showStrength ? hintId : undefined}
          className="min-h-12 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 pr-12 text-base text-white outline-none placeholder:text-slate-600 focus:border-blue-300/45 focus:ring-2 focus:ring-blue-500/10"
        />
        <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      {showStrength ? <div id={hintId} className="mt-2" aria-live="polite">
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((level) => (
            <span key={level} className={`h-1 rounded-full ${password && result.score >= level ? BAR_COLOURS[result.score] : "bg-white/[0.08]"}`} />
          ))}
        </div>
        <div className="mt-2 flex items-start justify-between gap-3 text-xs leading-5">
          <span className={password ? "font-semibold text-slate-300" : "text-slate-500"}>{password ? result.label : "At least 8 characters"}</span>
          <span className="max-w-[68%] text-right text-slate-500">{password ? (result.suggestions[0] || "This password meets the standard.") : "Spaces are allowed. Longer passphrases work well."}</span>
        </div>
      </div> : null}
    </label>
  );
}
