import { notFound } from "next/navigation";

import { FlipbotDashboard } from "@/components/flipbot-dashboard";

export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <FlipbotDashboard
      initialProfile={{
        name: "Alex Morgan",
        username: "alex_resells",
        email: "preview@flipbot.me",
        phone: "",
        location: "Brighton, United Kingdom",
        bio: "Finding stronger resale opportunities with Flipbot.",
        emailVerified: true,
        phoneVerified: false,
        memberSince: "September 2026",
        plan: "Starter",
      }}
      initialUserSettings={{
        currency: "GBP",
        region: "Brighton, United Kingdom",
        defaultMarketplace: "Facebook",
        defaultDistance: 25,
        minProfit: 40,
        maxPurchase: 650,
        riskTolerance: "Medium",
        emailAlerts: true,
        marketingEmailOptIn: false,
        quietHours: "22:00-08:00",
        compactCards: false,
        reducedMotion: false,
        density: "Comfortable",
      }}
      initialCredits={{
        subscriptionCredits: 240,
        subscriptionCreditsExpireAt: "2026-10-01T00:00:00.000Z",
        purchasedCredits: 75,
      }}
    />
  );
}
