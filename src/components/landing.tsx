"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  CircleDollarSign,
  Play,
  ShoppingBag,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { demoDeals, secondaryDemoDeals } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { CursorGlow, MagneticButton, Reveal, SpotlightCard, useScrolled } from "./motion-kit";
import { MotionNavigationMenu, SquarePattern } from "./unlumen-inspired";
import type { DisplayDeal } from "@/types/deals";

const navItems = [
  {
    label: "Product",
    href: "#flip-score",
    items: [
      { title: "Flip Score", copy: "Compare profit, ROI, demand and valuation confidence.", href: "#flip-score" },
      { title: "Scanner", copy: "Check products while sourcing in person.", href: "#scanner" },
    ],
  },
  {
    label: "How It Works",
    href: "#flip-score",
    items: [
      { title: "Find", copy: "Review deal cards from the moving showcase.", href: "#flip-score" },
      { title: "Decide", copy: "Use Flip Score and market evidence before buying.", href: "#flip-score" },
    ],
  },
  {
    label: "Pricing",
    href: "#pricing",
    items: [
      { title: "Starter", copy: "For getting started.", href: "#pricing" },
      { title: "Plus", copy: "Most popular for active resellers.", href: "#pricing" },
    ],
  },
  {
    label: "FAQ",
    href: "#faq",
    items: [
      { title: "Credits", copy: "Monthly usage allowance across Flipbot tools.", href: "#faq" },
      { title: "Guarantees", copy: "Estimates and decision support, not guaranteed profit.", href: "#faq" },
    ],
  },
];

const videos = [
  {
    title: "Find Deals with Flipbot",
    description: "See how Flipbot searches Marketplace and eBay and brings the strongest resale opportunities to the top.",
    image: "/opportunities/ps5-disc-edition.png",
    stat: "+£74 est.",
    label: "Deal Finder",
  },
  {
    title: "Check a Deal with Flipbot",
    description: "See how Flip Score, profit, ROI, demand and valuation confidence help you decide whether an opportunity is worth pursuing.",
    image: "/opportunities/dji-mini-4-pro.jpg",
    stat: "84/100",
    label: "Flip Score",
  },
  {
    title: "Scan Products While You're Out",
    description: "See how the Scanner helps you value products while sourcing in shops, charity shops, car boots and elsewhere.",
    image: "https://i.ebayimg.com/images/g/pGAAAeSweFppwAVx/s-l500.jpg",
    stat: "Strong Buy",
    label: "Scanner",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Coming soon",
    positioning: "For getting started.",
    features: ["Deal finding", "Flip Score", "Resale valuations", "Demand analysis", "Deal history", "Scanner access using credits"],
  },
  {
    name: "Plus",
    price: "Coming soon",
    positioning: "For active resellers.",
    popular: true,
    features: ["Everything in Starter", "More monthly usage", "Plus Discord access", "Priority-processing entitlement", "Enhanced saved/history functionality", "Selected early features when enabled"],
  },
  {
    name: "Pro",
    price: "Coming soon",
    positioning: "For serious sourcing.",
    features: ["Everything in Plus", "Pro Discord access", "Highest priority entitlement", "Advanced history and limits", "Beta/priority features where enabled", "High-volume sourcing workflow"],
  },
];

export function FlipbotLanding() {
  return (
    <main className="relative isolate overflow-hidden bg-[#020308] text-white">
      <CursorGlow />
      <div aria-hidden className="blue-grid pointer-events-none fixed inset-0 z-0 opacity-50" />
      <Navbar />
      <Hero />
      <DealShowcase />
      <VideoExplainers />
      <FlipScore />
      <ScannerSection />
      <CexInstantBuy />
      <Community />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}

function Navbar() {
  const scrolled = useScrolled();
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-300",
          scrolled ? "border-blue-200/10 bg-[#030711]/80 shadow-[0_12px_60px_rgba(0,0,0,.38)] backdrop-blur-xl" : "border-white/[0.06] bg-white/[0.02]",
        )}
      >
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
          <FlipbotLogoMark />
          FLIPBOT
        </Link>
        <MotionNavigationMenu items={navItems} />
        <div className="flex items-center gap-3 text-sm">
          <a href="/auth/sign-in" className="hidden text-slate-300 hover:text-white sm:inline">
            Log in
          </a>
          <MagneticButton className="min-h-10 px-4 py-2" href="/auth/sign-up">
            Create account
          </MagneticButton>
        </div>
      </nav>
    </header>
  );
}

function FlipbotLogoMark() {
  return <Image src="/flipbot-logo.png" alt="" width={40} height={40} sizes="40px" className="h-10 w-10 shrink-0 object-contain" unoptimized priority />;
}

function Hero() {
  return (
    <section className="relative z-10 flex items-center px-4 pb-6 pt-28 md:pb-8 md:pt-32">
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[160px]" />
      <SquarePattern className="absolute inset-x-8 top-28 h-[520px] overflow-hidden [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" gridSize={12} />
      <div className="mx-auto w-full max-w-5xl text-center">
        <h1 className="mx-auto max-w-5xl text-[clamp(3.25rem,8vw,8.2rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
          <span className="block">Find the flips</span>
          <span className="block">everyone else</span>
          <span className="block text-blue-300">misses.</span>
        </h1>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Save hours of searching. Flipbot scans Facebook Marketplace and eBay, checks resale potential and surfaces the deals most worth your attention.
          </p>
        </Reveal>
        <Reveal delay={0.3} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MagneticButton href="/auth/sign-up">Create your account</MagneticButton>
          <MagneticButton href="#flip-score" variant="secondary">
            See How It Works
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  );
}

function DealShowcase() {
  return (
    <section className="relative z-10 px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.035em]">Example Flipbot opportunities</h2>
          <p className="mt-2 text-sm text-slate-400">Representative listings show how Flipbot compares potential deals.</p>
        </div>
        <DealTicker direction="left" deals={demoDeals} />
        <DealTicker direction="right" deals={secondaryDemoDeals} className="mt-4" />
      </div>
    </section>
  );
}

function DealTicker({ direction, deals, className }: { direction: "left" | "right"; deals: DisplayDeal[]; className?: string }) {
  const reduceMotion = useReducedMotion();
  const track = [...deals, ...deals];
  const animate = direction === "left" ? { x: ["0%", "-50%"] } : { x: ["-50%", "0%"] };
  return (
    <div className={cn("ticker-mask overflow-hidden", className)}>
      <motion.div className="flex w-max gap-4" animate={reduceMotion ? undefined : animate} transition={{ duration: 64, repeat: Infinity, ease: "linear" }}>
        {track.map((deal, index) => (
          <MiniDealCard key={`${deal.id}-${direction}-${index}`} deal={deal} />
        ))}
      </motion.div>
    </div>
  );
}

function MiniDealCard({ deal }: { deal: DisplayDeal }) {
  return (
    <div className="flex w-[310px] shrink-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#060b16] p-3">
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-blue-950/20">
        <Image src={deal.image} alt={deal.title} fill sizes="96px" className="object-cover" loading="eager" unoptimized />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{deal.title}</p>
        <p className="mt-1 text-xs text-slate-500">{deal.marketplace}</p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-slate-300">£{deal.buyPrice} buy</span>
          <span className="text-blue-200">+£{deal.estimatedProfit} est.</span>
        </div>
      </div>
    </div>
  );
}

function VideoExplainers() {
  return (
    <section className="relative z-10 px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
        {videos.map((video, index) => (
          <Reveal key={video.title} delay={index * 0.06}>
            <SpotlightCard className="h-full p-4">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-blue-200/10 bg-[#06101e]">
                <Image src={video.image} alt={`${video.title} video thumbnail`} fill sizes="(min-width: 768px) 30vw, 92vw" className="object-cover" unoptimized />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,3,8,.82),rgba(7,26,68,.48),rgba(36,107,253,.12))]" />
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(76,141,255,.34),transparent_42%)]" />
                <div className="absolute left-4 top-4 rounded-full border border-blue-200/20 bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100 backdrop-blur">
                  {video.label}
                </div>
                <div className="absolute bottom-4 left-4 max-w-[70%]">
                  <p className="text-xl font-semibold leading-tight tracking-[-0.035em] text-white">{video.title.replace(" with Flipbot", "")}</p>
                  <p className="mt-1 text-sm font-semibold text-blue-100">{video.stat}</p>
                </div>
                <div className="absolute right-4 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-blue-100/30 bg-blue-500/30 text-blue-50 shadow-[0_0_40px_rgba(36,107,253,.36)] backdrop-blur">
                  <Play className="h-6 w-6 fill-current" />
                </div>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{video.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{video.description}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FlipScore() {
  const parts = [
    ["Profit", 40],
    ["ROI", 30],
    ["Demand", 15],
    ["Valuation Confidence", 15],
  ];
  return (
    <section id="flip-score" className="relative z-10 px-4 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Flip Score</p>
          <h2 className="mt-4 text-5xl font-semibold tracking-[-0.045em] md:text-6xl">A precise score for smarter buying decisions.</h2>
          <p className="mt-5 leading-7 text-slate-300">Flip Score gives you a clearer read on each product by weighing profit, ROI, demand and valuation confidence before you commit.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Exceptional Buy", "Strong Buy", "Possible Buy", "Risky", "Avoid"].map((label) => (
              <ProfitBadge key={label}>{label}</ProfitBadge>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <SpotlightCard className="p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Flip Score</p>
                <p className="mt-2 text-7xl font-semibold text-blue-100">84<span className="text-2xl text-slate-500">/100</span></p>
              </div>
              <ProfitBadge>Exceptional Buy</ProfitBadge>
            </div>
            <div className="mt-8 space-y-4">
              {parts.map(([label, points]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-blue-200">{points} points</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                    <motion.div className="h-full rounded-full bg-blue-400" initial={{ width: 0 }} whileInView={{ width: `${Number(points) * 2.1}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}

function ScannerSection() {
  return (
    <section id="scanner" className="relative z-10 px-4 pb-20 pt-8 md:pb-28 md:pt-12">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1fr]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Scanner</p>
          <h2 className="mt-4 text-5xl font-semibold tracking-[-0.045em] md:text-6xl">Found something while you&apos;re out? Check it before you buy it.</h2>
          <p className="mt-5 leading-7 text-slate-300">Take a photo, confirm the product and enter the asking price. Flipbot checks the expected resale value and shows the potential profit, ROI, demand and Flip Score.</p>
          <div className="mt-7">
            <MagneticButton href="#pricing">Scan an Item</MagneticButton>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <SpotlightCard className="mx-auto max-w-sm p-4">
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-blue-200/10 bg-[#030711] p-4">
              <div className="absolute inset-x-10 top-5 h-1 rounded-full bg-white/15" />
              <div className="relative mt-10 aspect-square overflow-hidden rounded-2xl border border-blue-200/15 bg-[#030711]">
                <Image src="https://i.ebayimg.com/images/g/pGAAAeSweFppwAVx/s-l500.jpg" alt="Dyson Airwrap Complete product photo" fill sizes="360px" className="object-cover" />
                <div className="absolute left-4 top-4 rounded-full border border-blue-100/20 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100 backdrop-blur">Scanned item</div>
              </div>
              <div className="mt-6 space-y-3">
                <Metric label="Confirm product" value="Dyson Airwrap Complete" />
                <Metric label="Asking price" value="£179" />
                <Metric label="Est. profit" value="+£83" hot />
                <ProfitBadge>Strong Buy</ProfitBadge>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}

function CexInstantBuy() {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow="" title="Open market profit or instant buyer speed." copy="Flipbot can help compare a higher open-market resale route against a faster instant-buyer exit, giving you a clearer security floor when speed and simplicity matter." />
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <SpotlightCard className="p-6 text-center">
            <ShoppingBag className="mx-auto h-7 w-7 text-blue-200" />
            <h3 className="mt-4 text-2xl font-semibold">Open market</h3>
            <p className="mt-3 text-slate-400">Potentially higher resale price</p>
          </SpotlightCard>
          <div className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">versus</div>
          <SpotlightCard className="p-6 text-center">
            <CircleDollarSign className="mx-auto h-7 w-7 text-blue-200" />
            <h3 className="mt-4 text-2xl font-semibold">Instant buyer</h3>
            <p className="mt-3 text-slate-400">Fast, simple profit exit</p>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

function Community() {
  return (
    <section className="relative z-10 px-4 py-20">
      <SpotlightCard className="mx-auto max-w-6xl p-8 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr_auto]">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-blue-200/20 bg-blue-400/10 text-blue-100">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] md:text-5xl">Flip with other resellers, not on your own.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">Join the Flipbot Discord to talk sourcing, share finds, learn from other resellers and keep up with product updates.</p>
          </div>
          <MagneticButton href="mailto:team@flipbot.me?subject=Flipbot%20community%20updates">Get community updates</MagneticButton>
        </div>
      </SpotlightCard>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="relative z-10 px-4 py-20 md:py-32">
      <SectionHeader eyebrow="Pricing" title="Membership tiers" copy="Plans and pricing are being finalised. No paid subscription is currently available." />
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <SpotlightCard key={plan.name} className={cn("p-6", plan.popular && "border-blue-200/25 shadow-[0_0_90px_rgba(36,107,253,.18)]")}>
            {plan.popular && <ProfitBadge>Most Popular</ProfitBadge>}
            <h3 className="mt-5 text-2xl font-semibold">{plan.name}</h3>
            <p className="mt-2 text-sm text-slate-400">{plan.positioning}</p>
            <p className="mt-8 text-4xl font-semibold">{plan.price}</p>
            <div className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <p key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="h-4 w-4 text-blue-200" />
                  {feature}
                </p>
              ))}
            </div>
            <MagneticButton className="mt-8 w-full" href="mailto:team@flipbot.me?subject=Flipbot%20launch%20updates">Get launch updates</MagneticButton>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    ["What is Flipbot?", "Flipbot is a deal-finding and valuation platform for UK resellers. It helps find resale opportunities and understand the numbers before buying."],
    ["How does Flipbot find deals?", "You set your source, category, budget and target returns. Flipbot searches supported listings and brings stronger opportunities to the top."],
    ["Where does Flipbot find deals?", "Flipbot is designed around Facebook Marketplace and eBay active listings, depending on production availability."],
    ["How does Flipbot estimate resale value?", "Flipbot uses available market evidence, including recent sold-price data, to estimate what similar products are likely to resell for."],
    ["What is Flip Score?", "Flip Score is a decision score that combines profit, ROI, demand and valuation confidence."],
    ["Can Flipbot guarantee profit?", "No. Flipbot provides estimates and decision support, not guaranteed profit or guaranteed resale values."],
    ["Can I use Flipbot while sourcing in person?", "Yes. The Scanner helps you check products you find in shops, charity shops, car boots and other sourcing situations."],
    ["What products does Flipbot support?", "Current categories include phones, laptops, consoles, cameras, bikes, audio, power tools, wearables, drones, TVs, monitors and more."],
    ["What is an instant-buyer comparison?", "It compares a possible open-market resale route against a faster instant-buyer exit for eligible products."],
    ["Does Flipbot work with eBay?", "Flipbot can use eBay listing and sold-market evidence, and supports secure eBay account connection for supported workflows."],
    ["How do credits work?", "Credits are monthly usage allowance across Flipbot tools. They are not stored cash."],
    ["Which plan should I choose?", "Starter is for getting started, Plus is for active resellers, and Pro is for serious sourcing volume."],
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="relative z-10 px-4 py-20">
      <SectionHeader eyebrow="FAQ" title="Questions before you start." copy="Concise answers based on confirmed Flipbot functionality." />
      <div className="mx-auto max-w-3xl divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-white/[0.025]">
        {faqs.map(([q, a], index) => (
          <div key={q}>
            <button className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}>
              {q}
              <ChevronDown className={cn("h-5 w-5 transition-transform", open === index && "rotate-180 text-blue-200")} />
            </button>
            <motion.div initial={false} animate={{ height: open === index ? "auto" : 0, opacity: open === index ? 1 : 0 }} className="overflow-hidden">
              <p className="px-5 pb-5 leading-7 text-slate-300">{a}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-4xl text-center">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">{eyebrow}</p> : null}
      <h2 className={cn("text-[clamp(2.4rem,5vw,4.9rem)] font-semibold leading-[0.98] tracking-[-0.045em]", eyebrow && "mt-4")}>{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">{copy}</p>
    </Reveal>
  );
}

function Metric({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={cn("mt-1 text-sm font-semibold", hot ? "text-blue-100" : "text-white")}>{value}</p>
    </div>
  );
}

function ProfitBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100">
      {children}
    </span>
  );
}

function Footer() {
  const columns = {
    Product: [{ label: "Deal Finder", href: "#flip-score" }, { label: "Scanner", href: "#scanner" }, { label: "Pricing", href: "#pricing" }, { label: "Flip Score", href: "#flip-score" }],
    Resources: [{ label: "Help", href: "mailto:team@flipbot.me?subject=Flipbot%20help" }, { label: "FAQ", href: "#faq" }, { label: "Community", href: "mailto:team@flipbot.me?subject=Flipbot%20community%20updates" }],
    Company: [{ label: "Contact", href: "mailto:team@flipbot.me" }],
    Legal: [{ label: "Terms", href: "/legal/terms" }, { label: "Privacy", href: "/legal/privacy" }, { label: "Cookies", href: "/legal/cookies" }, { label: "Acceptable use", href: "/legal/acceptable-use" }],
    Account: [{ label: "Log in", href: "/auth/sign-in" }, { label: "Create account", href: "/auth/sign-up" }],
  };
  return (
    <footer className="relative z-10 border-t border-white/[0.07] px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_repeat(5,1fr)]">
        <div>
          <p className="font-semibold">FLIPBOT</p>
          <p className="mt-3 max-w-xs text-sm text-slate-400">Find the flips everyone else misses.</p>
        </div>
        {Object.entries(columns).map(([title, links]) => (
          <div key={title}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
            <div className="mt-4 space-y-2">
              {links.map((link) => (
                <a key={link.label} href={link.href} className="block text-sm text-slate-400 hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
