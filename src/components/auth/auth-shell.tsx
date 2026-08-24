import Link from "next/link";
import type React from "react";

export function AuthShell({
  eyebrow,
  title,
  copy,
  message,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  message?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#020308] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(36,107,253,.24),transparent_34rem)]" />
      <div className="blue-grid pointer-events-none absolute inset-0 opacity-35" />
      <section className="relative w-full max-w-md rounded-[28px] border border-white/[0.09] bg-[#070a11]/92 p-6 shadow-[0_30px_100px_rgba(0,0,0,.55)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-3" aria-label="Flipbot home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-sm font-bold text-blue-100 ring-1 ring-blue-300/20">F</span>
          <span className="font-semibold tracking-[0.14em]">FLIPBOT</span>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
        {message ? <p className="mt-5 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-3 text-sm leading-6 text-blue-100">{message}</p> : null}
        <div className="mt-6">{children}</div>
        <div className="mt-6 border-t border-white/[0.08] pt-5 text-center text-sm text-slate-400">{footer}</div>
      </section>
    </main>
  );
}

export function AuthField({ label, name, type = "text", autoComplete, placeholder, minLength, maxLength, pattern, hint }: { label: string; name: string; type?: string; autoComplete?: string; placeholder?: string; minLength?: number; maxLength?: number; pattern?: string; hint?: string }) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      <input name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} minLength={minLength} maxLength={maxLength} pattern={pattern} aria-describedby={hintId} required className="min-h-12 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-blue-300/45 focus:ring-2 focus:ring-blue-500/10" />
      {hint ? <span id={hintId} className="mt-2 block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function AuthSubmit({ children }: { children: React.ReactNode }) {
  return <button type="submit" className="min-h-12 w-full rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(36,107,253,.28)] transition hover:bg-blue-500">{children}</button>;
}
