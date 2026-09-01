"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"checking" | "verified" | "error">("checking");

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      size: "flexible",
      retry: "auto",
      "refresh-expired": "auto",
      callback: (nextToken: string) => {
        setToken(nextToken);
        setStatus("verified");
      },
      "expired-callback": () => {
        setToken("");
        setStatus("checking");
      },
      "error-callback": () => {
        setToken("");
        setStatus("error");
      },
    });
  }, [siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [renderWidget]);

  if (!siteKey) {
    return process.env.NODE_ENV === "development" ? (
      <p className="rounded-xl border border-amber-300/20 bg-amber-400/[0.07] p-3 text-xs leading-5 text-amber-100">
        Bot protection is waiting for a Turnstile site key.
      </p>
    ) : null;
  }

  return (
    <div aria-label="Bot protection check">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderWidget} onReady={renderWidget} />
      <input type="hidden" name="cf-turnstile-response" value={token} readOnly />
      <div ref={containerRef} className="min-h-[65px] overflow-hidden rounded-xl" />
      <p className="sr-only" aria-live="polite">
        {status === "verified" ? "Bot protection complete." : status === "error" ? "Bot protection could not load. Refresh and try again." : "Checking your browser."}
      </p>
      <noscript>
        <p className="text-xs leading-5 text-amber-100">Enable JavaScript to complete the bot-protection check.</p>
      </noscript>
    </div>
  );
}
