import { FlipbotSoftwareApp } from "@/components/software-app";
import { requireUser } from "@/lib/supabase/auth";

export default async function AppPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("full_name, username, location, bio, plan, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("user_settings").select("currency, region, default_marketplace, default_distance, min_profit, max_purchase, risk_tolerance, email_alerts, quiet_hours, compact_cards, reduced_motion, density").eq("id", user.id).maybeSingle(),
  ]);

  const fallbackUsername = (user.user_metadata.username || user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`)
    .toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24);
  const memberSince = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(profile?.created_at || user.created_at));

  return (
    <FlipbotSoftwareApp
      initialProfile={{
        name: profile?.full_name || user.user_metadata.full_name || "Flipbot member",
        username: profile?.username || fallbackUsername,
        email: user.email || "",
        phone: user.phone || "",
        location: profile?.location || "",
        bio: profile?.bio || "Finding stronger resale opportunities with Flipbot.",
        emailVerified: Boolean(user.email_confirmed_at),
        phoneVerified: Boolean(user.phone_confirmed_at),
        memberSince,
        plan: profile?.plan || "Starter",
      }}
      initialUserSettings={{
        currency: settings?.currency || "GBP",
        region: settings?.region || "United Kingdom",
        defaultMarketplace: settings?.default_marketplace === "eBay" ? "eBay" : "Facebook",
        defaultDistance: Number(settings?.default_distance ?? 15),
        minProfit: Number(settings?.min_profit ?? 40),
        maxPurchase: Number(settings?.max_purchase ?? 500),
        riskTolerance: settings?.risk_tolerance === "Low" || settings?.risk_tolerance === "High" ? settings.risk_tolerance : "Medium",
        emailAlerts: settings?.email_alerts ?? true,
        quietHours: settings?.quiet_hours || "22:00-08:00",
        compactCards: settings?.compact_cards ?? false,
        reducedMotion: settings?.reduced_motion ?? false,
        density: settings?.density === "Compact" ? "Compact" : "Comfortable",
      }}
    />
  );
}
