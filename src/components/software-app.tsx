"use client";

import Image from "next/image";
import {
  Bell,
  Bookmark,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Cog,
  Cookie,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  FileText,
  Gauge,
  HelpCircle,
  Home,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  PackagePlus,
  Phone,
  Search,
  Settings,
  Scale,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  appDeals,
  appUser,
  crmColumns,
  instantBuyerDeals,
  marketplaceConnections,
  tasks,
  type AppDeal,
} from "@/lib/app-data";
import { faqItems, helpTopics, policyDocuments, policyOrder, type HelpTopicId, type PolicyId } from "@/lib/flipbot-copy";
import { cn } from "@/lib/utils";

type PageId =
  | "home"
  | "facebook"
  | "ebay"
  | "instant"
  | "scanner"
  | "crm"
  | "saved"
  | "autolister"
  | "account"
  | "settings"
  | "community"
  | "help"
  | PolicyId;

type TaskStatus = "open" | "complete";
type Priority = "Low" | "Medium" | "High";
type CrmStage = "Watching" | "Contacted" | "Negotiating" | "Purchased" | "Listed" | "Sold" | "Passed";

type DealFilter = {
  query: string;
  location: string;
  radius: number;
  category: string;
  minProfit: number;
  maxPrice: number;
  flipEase: "Easy flip" | "Balanced" | "High upside";
  instantBuyerCheck: boolean;
  risk: "Any" | AppDeal["risk"];
  demand: string;
  sort: "highest-roi" | "highest-profit" | "newest" | "lowest-risk" | "lowest-price";
};

type AppTask = {
  id: string;
  title: string;
  deal: string;
  due: string;
  priority: Priority;
  notes: string;
  status: TaskStatus;
};

type CrmDeal = {
  dealId: string;
  stage: CrmStage;
  note: string;
  actualSalePrice?: number;
  actualProfit?: number;
};

type ListingDraft = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  status: "Draft" | "Ready" | "Needs images" | "Published placeholder";
  image: string;
};

type UserSettings = {
  currency: string;
  region: string;
  defaultMarketplace: "Facebook" | "eBay";
  defaultDistance: number;
  minProfit: number;
  maxPurchase: number;
  riskTolerance: "Low" | "Medium" | "High";
  emailAlerts: boolean;
  quietHours: string;
  compactCards: boolean;
  reducedMotion: boolean;
  density: "Comfortable" | "Compact";
};

type AccountProfile = {
  name: string;
  username: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  memberSince: string;
};

type ScannerResult = {
  imageUrl: string;
  productName: string;
  category: string;
  condition: string;
  purchasePrice: number;
  resale: number;
  fees: number;
  shipping: number;
  instantBuyer: number;
};

type ToastState = {
  title: string;
  detail?: string;
};

type ProductFinderSearchInput = {
  source: "Facebook" | "eBay";
  query: string;
  category: string;
  maximumBuyPrice: number;
  minimumProfit: number;
  location: string;
  radius: number;
  fullValidation?: boolean;
};

type PendingMarketplaceSearch = {
  searchId: string;
  input: ProductFinderSearchInput;
};

const pendingMarketplaceStorageKey = "flipbot.pendingMarketplaceSearch";
const fullValidationConsumedStorageKey = "flipbot.fullValidationNextSearchConsumed";

const navItems: Array<{ id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "facebook", label: "Product Finder", icon: Search },
  { id: "scanner", label: "Scanner", icon: Camera },
  { id: "saved", label: "Saved Deals", icon: Bookmark },
  { id: "community", label: "Community", icon: Users },
  { id: "help", label: "Help", icon: HelpCircle },
];

const pageLabels: Record<PageId, string> = {
  home: "Home",
  facebook: "Product Finder",
  ebay: "Product Finder",
  instant: "Product Finder",
  scanner: "Scanner",
  crm: "CRM Board",
  saved: "Saved Deals",
  autolister: "Auto Lister",
  account: "Account",
  settings: "Settings",
  community: "Community",
  help: "Help",
  privacy: "Privacy Policy",
  cookies: "Cookie Policy",
  terms: "Terms of Service",
  "acceptable-use": "Acceptable Use",
  subscriptions: "Subscriptions & Credits",
};

function isPolicyPage(id: PageId): id is PolicyId {
  return policyOrder.includes(id as PolicyId);
}

const defaultFilter: DealFilter = {
  query: "",
  location: "",
  radius: 15,
  category: "Any",
  minProfit: 20,
  maxPrice: 0,
  flipEase: "Balanced",
  instantBuyerCheck: false,
  risk: "Any",
  demand: "Any",
  sort: "highest-roi",
};

const initialTasks: AppTask[] = tasks.map((task, index) => ({
  id: `task-${index}`,
  title: task.title,
  deal: task.deal,
  due: task.due,
  priority: index === 0 ? "High" : "Medium",
  notes: "",
  status: "open",
}));

const initialCrmDeals: CrmDeal[] = crmColumns.flatMap((column) =>
  column.dealIds.map((dealId) => ({
    dealId,
    stage: column.title as CrmStage,
    note: "",
  })),
);

const initialSettings: UserSettings = {
  currency: "GBP",
  region: "United Kingdom",
  defaultMarketplace: "Facebook",
  defaultDistance: 15,
  minProfit: 40,
  maxPurchase: 500,
  riskTolerance: "Medium",
  emailAlerts: true,
  quietHours: "22:00-08:00",
  compactCards: false,
  reducedMotion: false,
  density: "Comfortable",
};

const initialAccountProfile: AccountProfile = {
  name: appUser.name,
  username: "oliverflips",
  email: appUser.email,
  phone: "",
  location: "Brighton, United Kingdom",
  bio: "Finding stronger resale opportunities with Flipbot.",
  emailVerified: true,
  phoneVerified: false,
  memberSince: "August 2026",
};

const crmStages: CrmStage[] = ["Watching", "Contacted", "Negotiating", "Purchased", "Listed", "Sold", "Passed"];
const categories = [
  "Any",
  "Phones",
  "Laptops",
  "PC Consoles",
  "Handhelds & VR",
  "Cameras & Lenses",
  "Tablets, iPads & Surface",
  "Monitors",
  "Bikes & E-bikes",
  "Audio",
  "Power Tools",
  "Wearables & GPS",
  "Drones & Action Cameras",
  "TVs & Projectors",
  "DJ & Music Equipment",
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function computeProfit(cost: number, resale: number, fees: number, shipping = 0) {
  return resale - cost - fees - shipping;
}

function computeRoi(cost: number, profit: number) {
  return cost > 0 ? Math.round((profit / cost) * 100) : 0;
}

function getDealUrl(deal: AppDeal) {
  if (deal.listingUrl) return deal.listingUrl;
  return `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(deal.title)}`;
}

export function FlipbotSoftwareApp() {
  const [activePage, setActivePage] = useState<PageId>("home");
  const [helpTopic, setHelpTopic] = useState<HelpTopicId | null>(null);
  const [lightMode, setLightMode] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<AppDeal | null>(null);
  const [savedDealIds, setSavedDealIds] = useState<string[]>(["sony-xm5", "macbook-m2"]);
  const [dismissedDealIds, setDismissedDealIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<"Facebook" | "eBay" | "Instant Buyer", DealFilter>>({
    Facebook: { ...defaultFilter },
    eBay: { ...defaultFilter },
    "Instant Buyer": { ...defaultFilter, maxPrice: 700 },
  });
  const [tasksState, setTasksState] = useState<AppTask[]>(initialTasks);
  const [crmDeals, setCrmDeals] = useState<CrmDeal[]>(initialCrmDeals);
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [accountProfile, setAccountProfile] = useState<AccountProfile>(initialAccountProfile);
  const [drafts, setDrafts] = useState<ListingDraft[]>([
    {
      id: "draft-sony",
      title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
      description: "Clean headphones, tested audio, light cosmetic signs of use. Includes case where available.",
      price: 219.99,
      condition: "Very good",
      category: "Electronics",
      status: "Ready",
      image: appDeals[2].image,
    },
  ]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const pageTitle = pageLabels[activePage];
  const allDeals = useMemo(() => [...appDeals, ...instantBuyerDeals], []);

  function showToast(title: string, detail?: string) {
    setToast({ title, detail });
    window.setTimeout(() => setToast(null), 2400);
  }

  function selectPage(id: PageId) {
    setActivePage(id);
    setMobileNavOpen(false);
  }

  function openHelp(topic?: HelpTopicId) {
    setHelpTopic(topic ?? null);
    selectPage("help");
  }

  function saveDeal(deal: AppDeal) {
    setSavedDealIds((ids) => (ids.includes(deal.id) ? ids : [deal.id, ...ids]));
    showToast("Deal saved", `${deal.title} is now in Saved Deals.`);
  }

  function unsaveDeal(dealId: string) {
    setSavedDealIds((ids) => ids.filter((id) => id !== dealId));
    showToast("Deal removed", "The saved deal list has been updated.");
  }

  function addToCrm(deal: AppDeal, stage: CrmStage = "Watching") {
    setCrmDeals((items) => {
      const existing = items.find((item) => item.dealId === deal.id);
      if (existing) {
        return items.map((item) => (item.dealId === deal.id ? { ...item, stage } : item));
      }
      return [{ dealId: deal.id, stage, note: "" }, ...items];
    });
    showToast("CRM updated", `${deal.title} moved to ${stage}.`);
  }

  function updateCrm(dealId: string, update: Partial<CrmDeal>) {
    setCrmDeals((items) => items.map((item) => (item.dealId === dealId ? { ...item, ...update } : item)));
  }

  function removeFromCrm(dealId: string) {
    setCrmDeals((items) => items.filter((item) => item.dealId !== dealId));
    showToast("Removed from CRM", "The pipeline has been updated.");
  }

  function addTask(task: Omit<AppTask, "id" | "status">) {
    setTasksState((items) => [{ ...task, id: uid("task"), status: "open" }, ...items]);
    showToast("Task added", task.title);
  }

  function saveScannerResult(result: ScannerResult) {
    const profit = computeProfit(result.purchasePrice, result.resale, result.fees, result.shipping);
    const deal: AppDeal = {
      id: uid("scan"),
      title: result.productName,
      image: result.imageUrl,
      marketplace: "Facebook",
      category: result.category,
      location: "Scanner",
      age: "Just now",
      cost: result.purchasePrice,
      resale: result.resale,
      fees: result.fees + result.shipping,
      profit,
      roi: computeRoi(result.purchasePrice, profit),
      risk: profit > 70 ? "Low" : profit > 25 ? "Medium" : "High",
      rating: profit > 70 ? "Exceptional Buy" : profit > 25 ? "Strong Buy" : "Risky",
      demand: "High",
    };
    saveDeal(deal);
    addToCrm(deal);
  }

  const savedDeals = useMemo(
    () => savedDealIds.map((id) => allDeals.find((deal) => deal.id === id)).filter(Boolean) as AppDeal[],
    [allDeals, savedDealIds],
  );

  return (
    <main className={cn("min-h-screen bg-[#020308] text-white", lightMode && "theme-light")}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_40%_0%,rgba(36,107,253,.18),transparent_34rem)]" />
      <div className="blue-grid pointer-events-none fixed inset-0 opacity-35" />
      <div className="relative flex min-h-screen">
        <Sidebar activePage={activePage} setActivePage={selectPage} profile={accountProfile} />
        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur md:hidden">
            <div className="h-full w-[320px] max-w-[86vw] border-r border-white/[0.08] bg-[#05070d] p-4">
              <button className="mb-4 ml-auto grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08]" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
                <X className="h-5 w-5" />
              </button>
              <NavList activePage={activePage} onChange={selectPage} />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1 md:pl-[280px]">
          <TopBar
            pageTitle={pageTitle}
            onOpenMenu={() => setMobileNavOpen(true)}
            query={globalQuery}
            setQuery={setGlobalQuery}
            onSearch={() => {
              setFilters((current) => ({ ...current, Facebook: { ...current.Facebook, query: globalQuery } }));
              selectPage("facebook");
            }}
            onSettings={() => selectPage("settings")}
            onNotify={() => showToast("You're all caught up", "No new notifications.")}
            lightMode={lightMode}
            onToggleTheme={() => setLightMode((current) => !current)}
          />
          <div className="mx-auto max-w-[1440px] px-4 pb-28 pt-24 sm:px-6 md:pb-10 lg:px-8">
            {activePage === "home" ? (
              <HomePage
                onPageChange={selectPage}
                onSelectDeal={setSelectedDeal}
                allDeals={allDeals}
              />
            ) : null}
            {activePage === "facebook" ? (
              <FinderPage
                marketplace="Facebook"
                deals={appDeals}
                filter={filters.Facebook}
                setFilter={(filter) => setFilters((current) => ({ ...current, Facebook: filter }))}
                savedDealIds={savedDealIds}
                dismissedDealIds={dismissedDealIds}
                onSelectDeal={setSelectedDeal}
                onSaveDeal={saveDeal}
                onUnsaveDeal={unsaveDeal}
                onResetDismissed={() => setDismissedDealIds([])}
                onHelp={() => openHelp("product-finder")}
              />
            ) : null}
            {activePage === "ebay" ? (
              <FinderPage
                marketplace="eBay"
                deals={appDeals}
                filter={filters.eBay}
                setFilter={(filter) => setFilters((current) => ({ ...current, eBay: filter }))}
                savedDealIds={savedDealIds}
                dismissedDealIds={dismissedDealIds}
                onSelectDeal={setSelectedDeal}
                onSaveDeal={saveDeal}
                onUnsaveDeal={unsaveDeal}
                onResetDismissed={() => setDismissedDealIds([])}
                onHelp={() => openHelp("product-finder")}
              />
            ) : null}
            {activePage === "instant" ? (
              <FinderPage
                marketplace="Instant Buyer"
                deals={instantBuyerDeals}
                filter={filters["Instant Buyer"]}
                setFilter={(filter) => setFilters((current) => ({ ...current, "Instant Buyer": filter }))}
                savedDealIds={savedDealIds}
                dismissedDealIds={dismissedDealIds}
                onSelectDeal={setSelectedDeal}
                onSaveDeal={saveDeal}
                onUnsaveDeal={unsaveDeal}
                onResetDismissed={() => setDismissedDealIds([])}
                onHelp={() => openHelp("product-finder")}
              />
            ) : null}
            {activePage === "scanner" ? <ScannerPage onSaveResult={saveScannerResult} onCreateDraft={(draft) => setDrafts((items) => [draft, ...items])} onToast={showToast} onHelp={() => openHelp("scanner")} /> : null}
            {activePage === "crm" ? (
              <CrmPage
                crmDeals={crmDeals}
                allDeals={allDeals}
                tasks={tasksState}
                onSelectDeal={setSelectedDeal}
                onUpdateCrm={updateCrm}
                onRemoveCrm={removeFromCrm}
                onAddTask={addTask}
              />
            ) : null}
            {activePage === "saved" ? (
              <SavedDealsPage
                onPageChange={selectPage}
                savedDeals={savedDeals}
                onSelectDeal={setSelectedDeal}
                onUnsaveDeal={unsaveDeal}
                onHelp={() => openHelp("saved-deals")}
              />
            ) : null}
            {activePage === "autolister" ? <AutoListerPage drafts={drafts} setDrafts={setDrafts} onToast={showToast} /> : null}
            {activePage === "account" ? <AccountPage profile={accountProfile} setProfile={setAccountProfile} settings={settings} onToast={showToast} onPageChange={selectPage} /> : null}
            {activePage === "settings" ? <SettingsPage settings={settings} setSettings={setSettings} onToast={showToast} onPageChange={selectPage} /> : null}
            {activePage === "community" ? <CommunityPage /> : null}
            {activePage === "help" ? <HelpPage onPageChange={selectPage} initialTopic={helpTopic} onSupport={() => showToast("Support link needed", "Connect your support destination to activate this button.")} /> : null}
            {isPolicyPage(activePage) ? <PolicyPage id={activePage} onBack={() => selectPage("help")} onNavigate={selectPage} /> : null}
          </div>
        </div>
      </div>
      <MobileBottomNav activePage={activePage} onChange={selectPage} onMore={() => setMobileNavOpen(true)} />
      <DealDrawer
        deal={selectedDeal}
        crmEntry={selectedDeal ? crmDeals.find((item) => item.dealId === selectedDeal.id) : undefined}
        isSaved={selectedDeal ? savedDealIds.includes(selectedDeal.id) : false}
        onClose={() => setSelectedDeal(null)}
        onSaveDeal={saveDeal}
        onUnsaveDeal={unsaveDeal}
        onAddToCrm={addToCrm}
        onUpdateCrm={updateCrm}
        onAddTask={addTask}
        onOpenListing={(deal) => window.open(getDealUrl(deal), "_blank", "noopener,noreferrer")}
        onToast={showToast}
      />
      <Toast toast={toast} />
    </main>
  );
}

function Sidebar({ activePage, setActivePage, profile }: { activePage: PageId; setActivePage: (id: PageId) => void; profile: AccountProfile }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-white/[0.08] bg-[#04070d]/95 p-4 backdrop-blur-xl md:block">
      <div className="flex h-full flex-col">
        <div className="mb-5 flex items-center gap-3 px-2">
          <FlipbotLogoMark />
          <p className="font-semibold tracking-[0.12em]">FLIPBOT</p>
        </div>
        <NavList activePage={activePage} onChange={setActivePage} />
        <div className="mt-auto space-y-3">
          <UsagePanel />
          <button onClick={() => setActivePage("account")} className={cn("flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition hover:bg-white/[0.05]", activePage === "account" && "border-blue-300/25 bg-blue-500/10")}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-500/15 text-sm font-semibold text-blue-100">{profile.name.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0"><span className="block truncate text-sm font-semibold">{profile.name}</span><span className="block truncate text-xs text-slate-500">@{profile.username} · Account</span></span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function FlipbotLogoMark() {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-blue-300/20 bg-[#071525] shadow-[0_0_28px_rgba(36,107,253,.18)]">
      <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
        <defs>
          <linearGradient id="flipbot-app-logo-blue" x1="10" x2="54" y1="6" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4c8dff" />
            <stop offset="1" stopColor="#155cff" />
          </linearGradient>
        </defs>
        <path d="M16.5 17.5A22 22 0 0 1 41 10.8l-.7-5.2 12.2 9.2-14 5.3 1-5.1a17 17 0 0 0-18.6 5.4" fill="none" stroke="url(#flipbot-app-logo-blue)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
        <path d="M47.5 46.5A22 22 0 0 1 23 53.2l.7 5.2-12.2-9.2 14-5.3-1 5.1a17 17 0 0 0 18.6-5.4" fill="none" stroke="url(#flipbot-app-logo-blue)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
        <rect x="18" y="25" width="28" height="20" rx="7" fill="#020a18" stroke="#1b4fb8" strokeWidth="1.4" />
        <circle cx="32" cy="14" r="3.5" fill="#020a18" />
        <path d="M32 23v-7M14 31.5v7M50 31.5v7" stroke="#020a18" strokeLinecap="round" strokeWidth="5" />
        <path d="M24 34.5a4 4 0 0 1 8 0M34 34.5a4 4 0 0 1 8 0" fill="none" stroke="#246bfd" strokeLinecap="round" strokeWidth="3.8" />
        <path d="M41.5 41.5 52 37.5l5.5 13.8L47 55.5z" fill="#246bfd" stroke="#dbeafe" strokeLinejoin="round" strokeWidth="1.5" />
        <circle cx="49.5" cy="42.5" r="1.7" fill="#dbeafe" />
        <path d="M49.8 46v7.2M46.6 47.3c1.9-1.4 6.6-1.2 6.4 1.4-.2 2.5-6.1 1.2-6.2 3.6-.1 2.1 4.7 2.3 6.8.7" stroke="#fff" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </span>
  );
}

function NavList({ activePage, onChange }: { activePage: PageId; onChange: (id: PageId) => void }) {
  return (
    <nav>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Workspace</p>
      <div className="space-y-1">{navItems.slice(0, 4).map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300",
            (activePage === item.id || (item.id === "facebook" && ["ebay", "instant"].includes(activePage))) && "bg-blue-500/12 text-blue-100 ring-1 ring-blue-200/10",
          )}
        >
          <item.icon className="h-4 w-4" />
          <span className="min-w-0 truncate">{item.label}</span>
        </button>
      ))}</div>
      <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Support</p>
      <div className="space-y-1">{navItems.slice(4).map((item) => (
        <button key={item.id} onClick={() => onChange(item.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white", activePage === item.id && "bg-white/[0.05] text-white")}><item.icon className="h-4 w-4" />{item.label}</button>
      ))}</div>
      <div className="mt-5 border-t border-white/[0.07] pt-4 md:hidden">
        <button onClick={() => onChange("account")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300"><User className="h-4 w-4" />Account & usage</button>
        <button onClick={() => onChange("settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300"><Settings className="h-4 w-4" />Preferences</button>
      </div>
    </nav>
  );
}

function MobileBottomNav({ activePage, onChange, onMore }: { activePage: PageId; onChange: (id: PageId) => void; onMore: () => void }) {
  const items: Array<{ id?: PageId; label: string; icon: React.ComponentType<{ className?: string }>; action?: () => void }> = [
    { id: "home", label: "Home", icon: Home },
    { id: "facebook", label: "Find", icon: Search },
    { id: "scanner", label: "Scan", icon: Camera },
    { id: "saved", label: "Saved", icon: Bookmark },
    { label: "More", icon: Menu, action: onMore },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.09] bg-[#03060c]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">{items.map((item) => {
        const active = item.id === activePage || (item.id === "facebook" && ["ebay", "instant"].includes(activePage));
        return <button key={item.label} onClick={item.action ?? (() => item.id && onChange(item.id))} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] text-slate-500", active && "text-blue-200")}><item.icon className={cn("h-5 w-5", item.label === "Scan" && "h-6 w-6")} /><span>{item.label}</span></button>;
      })}</div>
    </nav>
  );
}

function TopBar({
  pageTitle,
  onOpenMenu,
  query,
  setQuery,
  onSearch,
  onSettings,
  onNotify,
  lightMode,
  onToggleTheme,
}: {
  pageTitle: string;
  onOpenMenu: () => void;
  query: string;
  setQuery: (value: string) => void;
  onSearch: () => void;
  onSettings: () => void;
  onNotify: () => void;
  lightMode: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.08] bg-[#02050b]/85 backdrop-blur-xl md:left-[280px]">
      <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] md:hidden" onClick={onOpenMenu} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Flipbot</p>
          <h1 className="truncate text-xl font-semibold">{pageTitle}</h1>
        </div>
        <form
          className="ml-auto hidden min-w-[280px] max-w-md flex-1 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-sm text-slate-400 lg:flex"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <Search className="h-4 w-4" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search deals and products..." className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-500" />
          <button type="submit" className="rounded-lg border border-white/[0.08] px-2 py-1 text-[11px] hover:text-white">Search</button>
        </form>
        <TokenPill />
        <button onClick={onNotify} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] text-slate-300 hover:text-white" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
        <button onClick={onToggleTheme} className="relative flex h-10 w-[58px] shrink-0 items-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-1.5 text-slate-300 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500" aria-label={lightMode ? "Switch to dark mode" : "Switch to light mode"} title={lightMode ? "Switch to dark mode" : "Switch to light mode"}>
          <span className={cn("absolute left-1.5 grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform duration-200", lightMode && "translate-x-[22px]")}>{lightMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</span>
        </button>
        <button onClick={onSettings} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] text-slate-300 hover:text-white" aria-label="Settings">
          <Cog className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function HomePage({
  onPageChange,
  onSelectDeal,
  allDeals,
}: {
  onPageChange: (id: PageId) => void;
  onSelectDeal: (deal: AppDeal) => void;
  allDeals: AppDeal[];
}) {
  const recentDeals = allDeals.filter((deal) => deal.marketplace !== "Instant Buyer").slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-blue-300/15 bg-[linear-gradient(135deg,rgba(15,30,58,.92),rgba(5,9,18,.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-9">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Find your next deal.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Search Marketplace and eBay for resale opportunities, or scan something you&apos;ve already found.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <GlowButton className="min-h-12 px-6" onClick={() => onPageChange("facebook")}><Search className="mr-2 inline h-4 w-4" />Find Deals</GlowButton>
            <GhostButton className="min-h-12 px-6" onClick={() => onPageChange("scanner")}><Camera className="mr-2 inline h-4 w-4" />Scan an Item</GhostButton>
          </div>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Panel title="Recently saved deals" action="View saved" onAction={() => onPageChange("saved")}>
          <div className="grid gap-3 md:grid-cols-3">{recentDeals.map((deal) => <CompactDealCard key={deal.id} deal={deal} onClick={() => onSelectDeal(deal)} />)}</div>
        </Panel>
        <Panel title="Pick up where you left off">
          <button onClick={() => onPageChange("facebook")} className="group w-full rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:border-blue-300/20 hover:bg-white/[0.045]">
            <p className="text-sm font-semibold">Brighton electronics</p><p className="mt-1 text-sm text-slate-500">Facebook Marketplace · £250 max · £40+ profit</p><p className="mt-4 text-sm font-semibold text-blue-200">Run again →</p>
          </button>
          <div className="mt-3 grid grid-cols-2 gap-3"><MetricBox label="Current plan" value="Pro" /><MetricBox label="Usage resets" value={appUser.resetDate} /></div>
        </Panel>
      </div>
    </div>
  );
}

function FinderPage({
  marketplace,
  deals,
  filter,
  setFilter,
  savedDealIds,
  dismissedDealIds,
  onSelectDeal,
  onSaveDeal,
  onUnsaveDeal,
  onResetDismissed,
  onHelp,
}: {
  marketplace: "Facebook" | "eBay" | "Instant Buyer";
  deals: AppDeal[];
  filter: DealFilter;
  setFilter: (filter: DealFilter) => void;
  savedDealIds: string[];
  dismissedDealIds: string[];
  onSelectDeal: (deal: AppDeal) => void;
  onSaveDeal: (deal: AppDeal) => void;
  onUnsaveDeal: (dealId: string) => void;
  onResetDismissed: () => void;
  onHelp: () => void;
}) {
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchStage, setSearchStage] = useState(0);
  const [source, setSource] = useState<"Facebook" | "eBay">(marketplace === "Facebook" ? "Facebook" : "eBay");
  const [validation, setValidation] = useState<string | null>(null);
  const [fullValidationNextSearch, setFullValidationNextSearch] = useState(true);
  const [resultDeals, setResultDeals] = useState<AppDeal[]>(marketplace === "Instant Buyer" ? deals : []);
  const [pendingMarketplaceSearch, setPendingMarketplaceSearch] = useState<PendingMarketplaceSearch | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem(pendingMarketplaceStorageKey) || "null") as PendingMarketplaceSearch | null;
    } catch {
      return null;
    }
  });
  const searchStages = ["Finding listings", "Matching products", "Checking market values", "Calculating potential", "Ranking deals"];
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFullValidationNextSearch(window.sessionStorage.getItem(fullValidationConsumedStorageKey) !== "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!searching) return;
    const timer = window.setInterval(() => setSearchStage((current) => {
      return Math.min(current + 1, searchStages.length - 2);
    }), 850);
    return () => window.clearInterval(timer);
  }, [searching, searchStages.length]);
  useEffect(() => {
    if (pendingMarketplaceSearch) {
      window.localStorage.setItem(pendingMarketplaceStorageKey, JSON.stringify(pendingMarketplaceSearch));
    } else {
      window.localStorage.removeItem(pendingMarketplaceStorageKey);
    }
  }, [pendingMarketplaceSearch]);
  useEffect(() => {
    if (!pendingMarketplaceSearch) return;
    let cancelled = false;
    let checking = false;
    const check = async () => {
      if (checking || cancelled) return;
      checking = true;
      try {
        const payload = await pollMarketplaceSearch(pendingMarketplaceSearch.searchId);
        if (cancelled || payload.status === "pending") return;
        if (payload.status === "failed") throw new Error(payload.message || payload.error || "Marketplace search failed.");
        setPendingMarketplaceSearch(null);
        setResultDeals(payload.deals || []);
        setSearchStage(searchStages.length - 1);
        setHasSearched(true);
        setValidation(payload.message || null);
      } catch (error) {
        if (!cancelled) setValidation(error instanceof Error ? error.message : "Marketplace results could not be checked.");
      } finally {
        checking = false;
      }
    };
    const timer = window.setInterval(() => void check(), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pendingMarketplaceSearch, searchStages.length]);
  const previewDeals = resultDeals.filter((deal) => deal.title.startsWith("Preview — "));
  const auditDeals = resultDeals.filter((deal) => Boolean(deal.rejectionReason));
  const filteredDeals = hasSearched
    ? (auditDeals.length ? auditDeals : previewDeals.length ? previewDeals : applyFilters(resultDeals.filter((deal) => deal.marketplace === source), filter))
      .filter((deal) => !dismissedDealIds.includes(deal.id))
    : [];

  async function runSearch() {
    const message = getSearchValidation(source, filter);
    if (message) {
      setValidation(message);
      setHasSearched(false);
      return;
    }
    setValidation(null);
    setHasSearched(false);
    setSearchStage(0);
    setSearching(true);
    try {
      const searchInput: ProductFinderSearchInput = {
        source,
        query: filter.query,
        category: filter.category,
        maximumBuyPrice: filter.maxPrice,
        minimumProfit: filter.minProfit,
        location: filter.location,
        radius: filter.radius,
        fullValidation: source === "Facebook" && fullValidationNextSearch,
      };
      const response = await fetch("/api/product-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchInput),
      });
      const payload = await response.json() as { deals?: AppDeal[]; error?: string; status?: "pending" | "complete"; searchId?: string };
      if (!response.ok) throw new Error(payload.error || "Product Finder could not complete this search.");
      if (searchInput.fullValidation) {
        setFullValidationNextSearch(false);
        window.sessionStorage.setItem(fullValidationConsumedStorageKey, "true");
      }
      if (payload.status === "pending" && payload.searchId) {
        setPendingMarketplaceSearch({ searchId: payload.searchId, input: searchInput });
        setResultDeals([]);
        setHasSearched(false);
        setValidation("Facebook Marketplace is collecting up to 100 listings. Flipbot will check automatically and this search will survive a reload.");
        return;
      }
      setPendingMarketplaceSearch(null);
      setResultDeals(payload.deals || []);
      setSearchStage(searchStages.length - 1);
      setHasSearched(true);
    } catch (error) {
      setResultDeals([]);
      setValidation(error instanceof Error ? error.message : "Product Finder could not complete this search.");
      setHasSearched(false);
    } finally {
      setSearching(false);
    }
  }

  async function pollMarketplaceSearch(searchId: string) {
    const response = await fetch("/api/product-finder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchId }),
    });
    const payload = await response.json() as { deals?: AppDeal[]; error?: string; message?: string; status?: "pending" | "complete" | "partial" | "failed" };
    if (response.status === 202) return payload;
    if (!response.ok) throw new Error(payload.error || "Product Finder could not complete this search.");
    return payload;
  }

  async function checkPendingMarketplaceSearch() {
    if (!pendingMarketplaceSearch) return;
    setValidation(null);
    setSearching(true);
    setSearchStage(3);
    try {
      const payload = await pollMarketplaceSearch(pendingMarketplaceSearch.searchId);
      if (payload.status === "pending") {
        setValidation(payload.message || "Facebook Marketplace is still collecting listings. Flipbot will keep checking automatically.");
        return;
      }
      if (payload.status === "failed") throw new Error(payload.message || payload.error || "Marketplace search failed.");
      setPendingMarketplaceSearch(null);
      setResultDeals(payload.deals || []);
      setSearchStage(searchStages.length - 1);
      setHasSearched(true);
    } catch (error) {
      setValidation(error instanceof Error ? error.message : "Marketplace results are still being prepared.");
      setHasSearched(false);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Product Finder" copy="Search Marketplace and eBay for products within your budget and minimum profit target." />
      <ContextHelp title="Not sure what to enter?" copy="Leave the optional product field blank to browse a whole category. A standard search uses 10 credits; the eligible CEX check adds 5." onHelp={onHelp} />
      {source === "Facebook" && fullValidationNextSearch ? <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.08] p-4"><p className="text-sm font-semibold text-amber-100">20-item SoldComps test armed for the next search only</p><p className="mt-1 text-sm leading-6 text-slate-400">Bright Data will return at most 20 listings. Only listings matching the product/category, price, city and radius will be sent to SoldComps and allowed into the results. Flipbot then returns to normal mode.</p></div> : null}
      <GuidedSearchPanel
        source={source}
        setSource={setSource}
        filter={filter}
        setFilter={setFilter}
        validation={validation}
        onRunSearch={runSearch}
        onReset={() => {
          setFilter({ ...defaultFilter });
          setResultDeals([]);
          setHasSearched(false);
          setValidation(null);
          setPendingMarketplaceSearch(null);
        }}
      />
      {searching ? <SearchProgress stages={searchStages} active={searchStage} /> : null}
      {!searching ? <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel title={hasSearched ? `${filteredDeals.length} opportunities` : "Your results will appear here"} action={dismissedDealIds.length ? "Restore hidden" : undefined} onAction={onResetDismissed}>
          {pendingMarketplaceSearch && !hasSearched ? <div className="mb-5 rounded-2xl border border-blue-300/20 bg-blue-500/[0.07] p-4"><p className="text-sm font-semibold text-blue-50">Marketplace search running</p><p className="mt-2 text-sm leading-6 text-slate-400">Flipbot is tracking this search in Supabase, checking Bright Data automatically, then validating the strongest products against database valuations and SoldComps. You can safely reload this page.</p><GhostButton className="mt-4" onClick={checkPendingMarketplaceSearch}>Check Results Now</GhostButton></div> : null}
          {!hasSearched && !pendingMarketplaceSearch ? <EmptyState title="Find your first opportunity." copy="Choose a category, set your budget and minimum profit, and Flipbot will look for listings worth investigating." action="Start a Search" onAction={runSearch} /> : null}
          {hasSearched ? <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{source} · {filter.category}</p><p className="mt-1 text-xs text-slate-500">Up to £{filter.maxPrice} · £{filter.minProfit}+ estimated profit{source !== "eBay" ? ` · ${filter.radius} mile radius` : ""}</p></div><div className="flex gap-2"><GhostButton onClick={() => setHasSearched(false)}>Edit Search</GhostButton><GhostButton onClick={runSearch}>Run Again</GhostButton></div></div> : null}
          <div className="space-y-3">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isSaved={savedDealIds.includes(deal.id)}
                onView={() => onSelectDeal(deal)}
                onSave={() => (savedDealIds.includes(deal.id) ? onUnsaveDeal(deal.id) : onSaveDeal(deal))}
              />
            ))}
          </div>
          {hasSearched && filteredDeals.length === 0 ? (
            <EmptyState
              title="No deals match this search."
              copy="Try lowering minimum profit, increasing your budget, expanding the location radius, or editing the search."
              action="Edit Search"
              onAction={() => {
                setFilter({ ...filter, minProfit: 20, query: "" });
                setHasSearched(false);
              }}
            />
          ) : null}
        </Panel>
        <Panel title="Sort results"><Select value={filter.sort} onChange={(value) => setFilter({ ...filter, sort: value as DealFilter["sort"] })} options={[["highest-roi", "Best Deals"], ["highest-profit", "Estimated Profit"], ["newest", "Newest"], ["lowest-risk", "Lowest Risk"]]} /></Panel>
      </div> : null}
    </div>
  );
}

function SearchProgress({ stages, active }: { stages: string[]; active: number }) {
  const descriptions = ["Looking for opportunities that match your search.", "Identifying products and important variants.", "Comparing likely resale values.", "Working out estimated profit, ROI and demand.", "Bringing the strongest opportunities to the top."];
  return <Panel><div className="mx-auto max-w-2xl py-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Searching</p><h3 className="mt-2 text-2xl font-semibold">Finding deals worth investigating</h3><div className="mt-7 space-y-3">{stages.map((stage, index) => <div key={stage} className={cn("flex gap-3 rounded-2xl border p-4 transition", index === active ? "border-blue-300/25 bg-blue-500/10" : index < active ? "border-emerald-300/15 bg-emerald-400/[0.04]" : "border-white/[0.06] opacity-45")}><span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold", index <= active ? "bg-blue-500/20 text-blue-100" : "bg-white/[0.06] text-slate-500")}>{index < active ? <Check className="h-4 w-4" /> : index + 1}</span><div><p className="font-semibold">{stage}</p><p className="mt-1 text-sm text-slate-400">{descriptions[index]}</p></div></div>)}</div></div></Panel>;
}

function applyFilters(deals: AppDeal[], filter: DealFilter) {
  const result = deals.filter((deal) => {
    const text = `${deal.title} ${deal.category} ${deal.location} ${deal.demand}`.toLowerCase();
    return (
      (!filter.query || text.includes(filter.query.toLowerCase())) &&
      (filter.category === "Any" || deal.category === filter.category) &&
      deal.profit >= filter.minProfit &&
      deal.cost <= filter.maxPrice &&
      (!filter.location || deal.location.toLowerCase().includes(filter.location.toLowerCase()) || deal.location === "UK")
    );
  });
  return [...result].sort((a, b) => filter.sort === "highest-profit" ? b.profit - a.profit : filter.sort === "highest-roi" ? calculateFlipScore(b).score - calculateFlipScore(a).score : filter.sort === "lowest-price" ? a.cost - b.cost : filter.sort === "lowest-risk" ? ["Low", "Medium", "High"].indexOf(a.risk) - ["Low", "Medium", "High"].indexOf(b.risk) : a.age.localeCompare(b.age));
}

function getSearchValidation(marketplace: "Facebook" | "eBay" | "Instant Buyer", filter: DealFilter) {
  if (marketplace === "Facebook" && !filter.location.trim()) return "Add a target location so FlipBot knows where to search Facebook Marketplace.";
  if (filter.category === "Any") return "Choose a category so FlipBot can compare against relevant resale prices.";
  if (!filter.maxPrice || filter.maxPrice <= 0) return "Add the maximum amount you are willing to spend.";
  if (filter.minProfit < 0) return "Minimum profit cannot be below zero.";
  return null;
}

function GuidedSearchPanel({
  source,
  setSource,
  filter,
  setFilter,
  validation,
  onRunSearch,
  onReset,
}: {
  source: "Facebook" | "eBay";
  setSource: (source: "Facebook" | "eBay") => void;
  filter: DealFilter;
  setFilter: (filter: DealFilter) => void;
  validation: string | null;
  onRunSearch: () => void;
  onReset: () => void;
}) {
  const searchCredits = filter.instantBuyerCheck ? 15 : 10;
  const radiusOptions = [5, 10, 15, 25, 50, 100];

  return (
    <Panel title="Search criteria">
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="lg:col-span-2 xl:col-span-3">
          <FieldLabel>Where should Flipbot search?</FieldLabel>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <SourceButton active={source === "Facebook"} onClick={() => setSource("Facebook")}>Facebook Marketplace</SourceButton>
            <SourceButton active={source === "eBay"} onClick={() => setSource("eBay")}>eBay</SourceButton>
          </div>
        </div>

        <label>
          <FieldLabel>Category</FieldLabel>
          <Select value={filter.category} onChange={(value) => setFilter({ ...filter, category: value })} options={categories} />
        </label>
        <label className="lg:col-span-1 xl:col-span-2">
          <span className="mb-2 flex items-center justify-between gap-3">
            <FieldLabel>What are you looking for?</FieldLabel>
            <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-100">Optional</span>
          </span>
          <Input value={filter.query} onChange={(value) => setFilter({ ...filter, query: value })} placeholder="e.g. iPhone 15, PS5, MacBook Air" />
        </label>

        <div>
          <NumberField label="Maximum buy price" value={filter.maxPrice} onChange={(value) => setFilter({ ...filter, maxPrice: value })} />
          <p className="mt-1 text-xs text-slate-500">The most you&apos;re willing to pay.</p>
        </div>
        <div>
          <NumberField label="Minimum profit" value={filter.minProfit} onChange={(value) => setFilter({ ...filter, minProfit: value })} />
          <p className="mt-1 text-xs text-slate-500">Hide opportunities below this estimate.</p>
        </div>

        {source === "Facebook" ? (
          <>
            <label>
              <FieldLabel>Location</FieldLabel>
              <Input value={filter.location} onChange={(value) => setFilter({ ...filter, location: value })} placeholder="Brighton, London, Manchester..." />
            </label>
            <div className="lg:col-span-2 xl:col-span-3">
              <FieldLabel>Location radius</FieldLabel>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {radiusOptions.map((radius) => (
                  <button key={radius} type="button" onClick={() => setFilter({ ...filter, radius })} className={cn("min-h-11 rounded-xl border px-2 text-sm font-semibold transition duration-200", filter.radius === radius ? "border-blue-300/40 bg-blue-500/15 text-blue-50 shadow-[0_0_20px_rgba(36,107,253,.12)]" : "border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/[0.15] hover:text-white")}>{radius} mi</button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {validation ? <p className="mt-5 rounded-xl border border-red-300/15 bg-red-400/[0.06] p-3 text-sm text-red-100">{validation}</p> : null}

      <button type="button" onClick={() => setFilter({ ...filter, instantBuyerCheck: !filter.instantBuyerCheck })} className={cn("mt-6 flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition duration-200", filter.instantBuyerCheck ? "border-blue-300/45 bg-blue-500/15 shadow-[0_0_32px_rgba(36,107,253,.2)]" : "border-blue-300/20 bg-blue-500/[0.06] hover:border-blue-300/35 hover:bg-blue-500/10")}>
        <span>
          <span className="flex flex-wrap items-center gap-2 font-semibold text-blue-50"><Sparkles className="h-4 w-4 text-blue-200" />Check CEX when eligible <span className="rounded-full border border-blue-200/20 bg-blue-400/15 px-2 py-0.5 text-xs text-blue-100">+5 credits</span></span>
          <span className="mt-1 block text-xs leading-5 text-slate-400">Add an indicative CEX instant-buy comparison to eligible results.</span>
        </span>
        <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition", filter.instantBuyerCheck ? "bg-blue-500 shadow-[0_0_18px_rgba(36,107,253,.6)]" : "bg-white/[0.12]")}><span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition", filter.instantBuyerCheck ? "left-6" : "left-1")} /></span>
      </button>

      <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center">
        <GlowButton className="min-h-12 px-7" onClick={onRunSearch}><span className="flex items-center gap-3"><span>Find Deals</span><span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">{searchCredits} credits</span></span></GlowButton>
        <GhostButton onClick={onReset}>Reset</GhostButton>
        <p className="text-xs text-slate-500 sm:ml-auto">Search: 10 credits{filter.instantBuyerCheck ? " + CEX: 5 credits" : ""}</p>
      </div>
    </Panel>
  );
}

function SourceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-xl border px-3 py-3 text-left text-sm font-semibold transition", active ? "border-blue-200/30 bg-blue-500/15 text-blue-50" : "border-white/[0.08] bg-white/[0.025] text-slate-300 hover:bg-white/[0.05]")}>
      {children}
    </button>
  );
}

function DealCard({
  deal,
  isSaved,
  onView,
  onSave,
}: {
  deal: AppDeal;
  isSaved: boolean;
  onView: () => void;
  onSave: () => void;
}) {
  const analysis = calculateFlipScore(deal);
  return (
    <article className="rounded-3xl border border-white/[0.08] bg-[#080c14] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200/20 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[132px_1fr_auto] lg:items-start">
        <Image src={deal.image} alt={deal.title} width={132} height={132} sizes="132px" className="aspect-square w-full rounded-2xl object-cover sm:w-[132px]" unoptimized />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><Badge tone="blue">{deal.marketplace}</Badge><span className="text-xs text-slate-500">{deal.location} · {deal.age}</span></div>
          <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{deal.title}</h3>
          {deal.rejectionReason ? <><div className="mt-3 flex flex-wrap items-center gap-3"><ClassificationBadge label="Avoid" /></div><div className="mt-4 rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-3"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-red-200">Why it was rejected</p><p className="mt-2 text-sm leading-6 text-slate-300">{deal.rejectionReason}</p></div><div className="mt-3 text-sm text-slate-400">Listed price: <strong className="text-white">{deal.cost > 0 ? `£${deal.cost}` : "Unavailable / zero"}</strong></div></> : <><div className="mt-3 flex flex-wrap items-center gap-3"><ClassificationBadge label={analysis.classification} /><span className="text-sm text-slate-400">Flip Score <strong className="ml-1 text-white">{analysis.score} / 100</strong></span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><MetricBox label="Buy" value={`£${deal.cost}`} /><MetricBox label="Est. resale" value={`£${deal.resale - 10}–£${deal.resale + 10}`} /><MetricBox label="Est. profit" value={`£${deal.profit}`} hot /><MetricBox label="ROI" value={`${deal.roi}%`} hot /></div><div className="mt-3 flex gap-4 text-xs text-slate-500"><span>Demand <strong className="text-slate-300">{normaliseDemand(deal.demand)}</strong></span><span>Valuation confidence <strong className="text-slate-300">{analysis.confidence}</strong></span></div></>}
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-40 lg:grid-cols-1">
          <GlowButton onClick={onView}>View Analysis</GlowButton>
          <GhostButton onClick={() => window.open(getDealUrl(deal), "_blank", "noopener,noreferrer")}>Open Listing</GhostButton>
          <GhostButton onClick={onSave}>{isSaved ? <><Check className="mr-2 inline h-4 w-4" />Saved</> : <><Bookmark className="mr-2 inline h-4 w-4" />Save</>}</GhostButton>
        </div>
      </div>
    </article>
  );
}

function ReasonBlock({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">{copy}</p>
    </div>
  );
}

function calculateFlipScore(deal: AppDeal) {
  const profitScore = Math.min(40, Math.max(0, Math.round((deal.profit / 160) * 40)));
  const roiScore = Math.min(30, Math.max(0, Math.round((deal.roi / 80) * 30)));
  const demand = normaliseDemand(deal.demand);
  const demandScore = demand === "High" ? 15 : demand === "Medium" ? 9 : 4;
  const confidenceScore = deal.risk === "Low" ? 15 : deal.risk === "Medium" ? 10 : 5;
  const score = Math.min(100, profitScore + roiScore + demandScore + confidenceScore);
  const classification: AppDeal["rating"] = score >= 85 ? "Exceptional Buy" : score >= 70 ? "Strong Buy" : score >= 55 ? "Possible Buy" : score >= 40 ? "Risky" : "Avoid";
  const confidence = confidenceScore >= 15 ? "High" : confidenceScore >= 10 ? "Medium" : "Low";
  return {
    score,
    classification,
    confidence,
    breakdown: { profit: profitScore, roi: roiScore, demand: demandScore, confidence: confidenceScore },
    nextAction: score >= 70 ? "Verify the exact model and condition, then contact the seller while the numbers still work." : score >= 55 ? "Check comparable sales and negotiate before deciding." : "Only proceed if the price comes down or stronger evidence supports the resale estimate.",
    reason: `The £${deal.cost} asking price sits below Flipbot's estimated resale range of £${deal.resale - 10}–£${deal.resale + 10}. After estimated selling costs, the deal could leave around £${deal.profit} profit at roughly ${deal.roi}% ROI. Demand appears ${demand.toLowerCase()} and valuation confidence is ${confidence.toLowerCase()}.`,
  };
}

function normaliseDemand(value: string): "Low" | "Medium" | "High" { return ["Very high", "High", "Active"].includes(value) ? "High" : value === "Low" ? "Low" : "Medium"; }

function ClassificationBadge({ label }: { label: AppDeal["rating"] }) {
  const tone = label === "Exceptional Buy" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : label === "Strong Buy" ? "border-blue-300/20 bg-blue-500/12 text-blue-100" : label === "Possible Buy" ? "border-amber-300/20 bg-amber-400/10 text-amber-100" : "border-red-300/20 bg-red-400/10 text-red-100";
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

function DealDrawer({
  deal,
  crmEntry,
  isSaved,
  onClose,
  onSaveDeal,
  onUnsaveDeal,
  onAddToCrm,
  onUpdateCrm,
  onAddTask,
  onOpenListing,
  onToast,
}: {
  deal: AppDeal | null;
  crmEntry?: CrmDeal;
  isSaved: boolean;
  onClose: () => void;
  onSaveDeal: (deal: AppDeal) => void;
  onUnsaveDeal: (dealId: string) => void;
  onAddToCrm: (deal: AppDeal, stage?: CrmStage) => void;
  onUpdateCrm: (dealId: string, update: Partial<CrmDeal>) => void;
  onAddTask: (task: Omit<AppTask, "id" | "status">) => void;
  onOpenListing: (deal: AppDeal) => void;
  onToast: (title: string, detail?: string) => void;
}) {
  if (!deal) return null;
  return (
    <DealDrawerContent
      key={`${deal.id}-${crmEntry?.note ?? ""}`}
      deal={deal}
      crmEntry={crmEntry}
      isSaved={isSaved}
      onClose={onClose}
      onSaveDeal={onSaveDeal}
      onUnsaveDeal={onUnsaveDeal}
      onAddToCrm={onAddToCrm}
      onUpdateCrm={onUpdateCrm}
      onAddTask={onAddTask}
      onOpenListing={onOpenListing}
      onToast={onToast}
    />
  );
}

function DealDrawerContent({
  deal,
  crmEntry,
  isSaved,
  onClose,
  onSaveDeal,
  onUnsaveDeal,
  onAddToCrm,
  onUpdateCrm,
  onAddTask,
  onOpenListing,
  onToast,
}: {
  deal: AppDeal;
  crmEntry?: CrmDeal;
  isSaved: boolean;
  onClose: () => void;
  onSaveDeal: (deal: AppDeal) => void;
  onUnsaveDeal: (dealId: string) => void;
  onAddToCrm: (deal: AppDeal, stage?: CrmStage) => void;
  onUpdateCrm: (dealId: string, update: Partial<CrmDeal>) => void;
  onAddTask: (task: Omit<AppTask, "id" | "status">) => void;
  onOpenListing: (deal: AppDeal) => void;
  onToast: (title: string, detail?: string) => void;
}) {
  const [cost, setCost] = useState(deal.cost);
  const [resale, setResale] = useState(deal.resale);
  const [fees, setFees] = useState(deal.fees);
  const [note, setNote] = useState(crmEntry?.note ?? "");
  const profit = computeProfit(cost, resale, fees);
  const roi = computeRoi(cost, profit);
  const analysis = calculateFlipScore({ ...deal, cost, resale, fees, profit, roi });
  const summary = `${deal.title}: buy GBP ${cost}, resale GBP ${resale}, est profit GBP ${profit}, ROI ${roi}%.`;

  return (
    <div className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm">
      <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-white/[0.08] bg-[#05070d] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Deal Analysis</p><h2 className="mt-1 text-2xl font-semibold">Is this worth buying?</h2></div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08]" aria-label="Close deal drawer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
          <Image src={deal.image} alt={deal.title} width={520} height={290} sizes="(max-width: 640px) 92vw, 520px" className="aspect-[16/9] w-full object-cover" />
          <div className="p-5"><div className="flex flex-wrap items-center gap-2"><Badge tone="blue">{deal.marketplace}</Badge><ClassificationBadge label={analysis.classification} /></div><h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">{deal.title}</h3><div className="mt-2 flex items-center gap-2 text-sm text-slate-400">Flip Score <strong className="text-lg text-white">{analysis.score} / 100</strong></div></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><MetricBox label="Buy price" value={`£${cost}`} /><MetricBox label="Est. resale" value={`£${resale - 10}–£${resale + 10}`} /><MetricBox label="Est. profit" value={`£${profit}`} hot /><MetricBox label="ROI" value={`${roi}%`} hot /></div>
        <div className="mt-4 flex flex-wrap gap-2"><GlowButton onClick={() => onOpenListing(deal)}>Open Original Listing</GlowButton><GhostButton onClick={() => (isSaved ? onUnsaveDeal(deal.id) : onSaveDeal(deal))}>{isSaved ? "Saved" : "Save Deal"}</GhostButton></div>
        <Panel title="Why Flipbot likes this deal" className="mt-5"><p className="text-sm leading-7 text-slate-300">{analysis.reason}</p><p className="mt-3 text-sm font-semibold text-blue-200">{analysis.nextAction}</p></Panel>
        <Panel title="Profit breakdown" className="mt-5">
          <div className="space-y-2 text-sm"><div className="flex justify-between text-slate-400"><span>Purchase price</span><strong className="text-white">−£{cost}</strong></div><div className="flex justify-between text-slate-400"><span>Estimated resale value</span><strong className="text-white">£{resale}</strong></div><div className="flex justify-between text-slate-400"><span>Estimated selling fees & costs</span><strong className="text-white">−£{fees}</strong></div><div className="mt-3 flex justify-between border-t border-white/[0.08] pt-3"><span>Estimated profit</span><strong className="text-emerald-200">£{profit}</strong></div></div>
          <details className="mt-4 rounded-xl border border-white/[0.07] p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-300">Adjust assumptions</summary><div className="mt-3 grid grid-cols-3 gap-3"><NumberField label="Purchase" value={cost} onChange={setCost} /><NumberField label="Resale" value={resale} onChange={setResale} /><NumberField label="Fees" value={fees} onChange={setFees} /></div></details>
        </Panel>
        <Panel title="Score breakdown" className="mt-5"><div className="space-y-3"><ScoreRow label="Profit" value={analysis.breakdown.profit} max={40} /><ScoreRow label="ROI" value={analysis.breakdown.roi} max={30} /><ScoreRow label="Demand" value={analysis.breakdown.demand} max={15} /><ScoreRow label="Valuation Confidence" value={analysis.breakdown.confidence} max={15} /><div className="flex justify-between border-t border-white/[0.08] pt-3 text-sm"><span>Total</span><strong>{analysis.score} / 100</strong></div></div><p className="mt-4 text-xs leading-5 text-slate-500">Flip Score helps compare opportunities. It is not a guaranteed outcome.</p></Panel>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><ReasonBlock title="Demand" copy={`${normaliseDemand(deal.demand)}. Similar products show consistent buyer interest in the available market evidence.`} /><ReasonBlock title="Valuation Confidence" copy={`${analysis.confidence}. This reflects how strongly the available product and market evidence supports Flipbot's resale estimate.`} /></div>
        <Panel title="Market Evidence" className="mt-5"><p className="text-sm text-slate-300">Recent comparable sales support a likely resale value near £{resale}. Exact value still depends on variant, condition and included accessories.</p><div className="mt-3 grid grid-cols-3 gap-2">{[resale - 18, resale - 4, resale + 11].map((price, index) => <div key={price} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="font-semibold">£{price}</p><p className="mt-1 text-xs text-slate-500">{index === 0 ? "Good" : "Very good"} · Sold</p></div>)}</div></Panel>
        {["Audio", "Laptops", "Handhelds & VR", "Phones"].includes(deal.category) ? <Panel title="Instant Buy" className="mt-5"><div className="grid grid-cols-2 gap-3"><MetricBox label="Open market · est. resale" value={`£${resale}`} /><MetricBox label="CEX · indicative offer" value={`£${Math.round(resale * .78)}`} /></div><p className="mt-3 text-xs leading-5 text-slate-500">CEX availability and final value depend on the exact product and condition.</p></Panel> : null}
        <Panel title="CRM and notes" className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <FieldLabel>CRM stage</FieldLabel>
              <Select
                value={crmEntry?.stage ?? "Watching"}
                onChange={(value) => (crmEntry ? onUpdateCrm(deal.id, { stage: value as CrmStage }) : onAddToCrm(deal, value as CrmStage))}
                options={crmStages}
              />
            </label>
            <label>
              <FieldLabel>Add linked task</FieldLabel>
              <GhostButton className="w-full" onClick={() => onAddTask({ title: `Follow up ${deal.title}`, deal: deal.title, due: "Today", priority: "Medium", notes: summary })}>Create task</GhostButton>
            </label>
          </div>
          <label className="mt-3 block">
            <FieldLabel>Deal note</FieldLabel>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] p-3 text-sm outline-none focus:border-blue-200/40" placeholder="Add seller details, condition notes, negotiation angle..." />
          </label>
          <div className="mt-3 flex justify-end">
            <GhostButton onClick={() => onUpdateCrm(deal.id, { note })}>Save note</GhostButton>
          </div>
        </Panel>
        <Panel title="Risk checklist" className="mt-5">
          {["Confirm exact model", "Check condition carefully", "Check missing accessories", "Compare sold prices", "Verify postage or collection cost"].map((item) => (
            <p key={item} className="flex items-center gap-2 py-2 text-sm text-slate-300"><ShieldCheck className="h-4 w-4 text-blue-200" />{item}</p>
          ))}
        </Panel>
        <div className="mt-5 flex flex-wrap gap-3">
          <GlowButton onClick={() => (isSaved ? onUnsaveDeal(deal.id) : onSaveDeal(deal))}>{isSaved ? "Unsave deal" : "Save deal"}</GlowButton>
          <GhostButton onClick={() => onAddToCrm(deal)}>Add to CRM</GhostButton>
          <GhostButton onClick={() => {
            void navigator.clipboard?.writeText(summary);
            onToast("Summary copied", summary);
          }}><Copy className="mr-2 inline h-4 w-4" />Copy summary</GhostButton>
          <GhostButton onClick={() => onOpenListing(deal)}>Open search</GhostButton>
        </div>
      </motion.aside>
    </div>
  );
}

function TaskManager({
  tasks,
  onAdd,
  onUpdate,
  onDelete,
  compact = false,
}: {
  tasks: AppTask[];
  onAdd: (task: Omit<AppTask, "id" | "status">) => void;
  onUpdate: (task: AppTask) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<"All" | "Today" | "Upcoming" | "Completed">("All");
  const [editingTask, setEditingTask] = useState<AppTask | null>(null);
  const [creating, setCreating] = useState(false);
  const visibleTasks = tasks.filter((task) => {
    if (filter === "Completed") return task.status === "complete";
    if (filter === "Today") return task.status === "open" && task.due.toLowerCase() === "today";
    if (filter === "Upcoming") return task.status === "open" && task.due.toLowerCase() !== "today";
    return true;
  });

  return (
    <Panel title="To-do list" action="Add task" onAction={() => setCreating(true)}>
      <div className="mb-3 flex flex-wrap gap-2">
        {(["All", "Today", "Upcoming", "Completed"] as const).map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={cn("rounded-full border px-3 py-1.5 text-xs", filter === item ? "border-blue-200/30 bg-blue-500/10 text-blue-100" : "border-white/[0.08] text-slate-400")}>{item}</button>
        ))}
      </div>
      <div className={cn("space-y-3", compact && "max-h-[420px] overflow-y-auto pr-1")}>
        {visibleTasks.map((task) => (
          <div key={task.id} className={cn("rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3", task.status === "complete" && "opacity-55")}>
            <div className="flex items-start gap-3">
              <button onClick={() => onUpdate({ ...task, status: task.status === "complete" ? "open" : "complete" })} className="mt-0.5 grid h-6 w-6 place-items-center rounded-lg border border-blue-200/20 text-blue-100">
                {task.status === "complete" ? <Check className="h-4 w-4" /> : null}
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500">{task.deal} - {task.due} - {task.priority}</p>
                {task.notes ? <p className="mt-2 text-xs text-slate-400">{task.notes}</p> : null}
              </div>
              <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-white" aria-label={`Edit ${task.title}`}><Edit3 className="h-4 w-4" /></button>
              <button onClick={() => onDelete(task.id)} className="text-slate-500 hover:text-red-200" aria-label={`Delete ${task.title}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {visibleTasks.length === 0 ? <EmptyState title="No tasks here" copy="Add a task or switch to another task view." /> : null}
      </div>
      {(creating || editingTask) ? (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setCreating(false);
            setEditingTask(null);
          }}
          onSave={(task) => {
            if ("id" in task) onUpdate(task);
            else onAdd(task);
            setCreating(false);
            setEditingTask(null);
          }}
        />
      ) : null}
    </Panel>
  );
}

function TaskModal({ task, onClose, onSave }: { task: AppTask | null; onClose: () => void; onSave: (task: AppTask | Omit<AppTask, "id" | "status">) => void }) {
  const [form, setForm] = useState({
    title: task?.title ?? "",
    deal: task?.deal ?? "",
    due: task?.due ?? "Today",
    priority: task?.priority ?? "Medium",
    notes: task?.notes ?? "",
  });
  return (
    <Modal title={task ? "Edit task" : "Add task"} onClose={onClose}>
      <div className="space-y-3">
        <label><FieldLabel>Task title</FieldLabel><Input value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Message seller, check sold comps..." /></label>
        <label><FieldLabel>Related deal</FieldLabel><Input value={form.deal} onChange={(value) => setForm({ ...form, deal: value })} placeholder="Product or deal name" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><FieldLabel>Due</FieldLabel><Input value={form.due} onChange={(value) => setForm({ ...form, due: value })} placeholder="Today, Tomorrow, Friday" /></label>
          <label><FieldLabel>Priority</FieldLabel><Select value={form.priority} onChange={(value) => setForm({ ...form, priority: value as Priority })} options={["Low", "Medium", "High"]} /></label>
        </div>
        <label><FieldLabel>Notes</FieldLabel><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-24 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] p-3 text-sm outline-none focus:border-blue-200/40" /></label>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GlowButton onClick={() => {
            if (!form.title.trim()) return;
            onSave(task ? { ...task, ...form, priority: form.priority as Priority } : { ...form, priority: form.priority as Priority });
          }}>{task ? "Save changes" : "Add task"}</GlowButton>
        </div>
      </div>
    </Modal>
  );
}

function ScannerPage({ onSaveResult, onCreateDraft, onToast, onHelp }: { onSaveResult: (result: ScannerResult) => void; onCreateDraft: (draft: ListingDraft) => void; onToast: (title: string, detail?: string) => void; onHelp: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"capture" | "analysing" | "confirm" | "price" | "result">("capture");
  const [analysisStage, setAnalysisStage] = useState(0);
  const [preview, setPreview] = useState<string>(appDeals[2].image);
  const [result, setResult] = useState<ScannerResult>({ imageUrl: appDeals[2].image, productName: "Sony WH-1000XM5", category: "Audio", condition: "Very good", purchasePrice: 115, resale: 225, fees: 28, shipping: 0, instantBuyer: 168 });

  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (step !== "analysing") return;
    const timer = window.setInterval(() => setAnalysisStage((current) => {
      if (current >= 2) { window.clearInterval(timer); setStep("confirm"); return current; }
      return current + 1;
    }), 650);
    return () => window.clearInterval(timer);
  }, [step]);

  const profit = computeProfit(result.purchasePrice, result.resale, result.fees, result.shipping);
  const roi = computeRoi(result.purchasePrice, profit);
  const scannedDeal: AppDeal = { id: "scanner-preview", title: result.productName, image: result.imageUrl, marketplace: "Facebook", category: result.category, location: "Scanner", age: "Just now", cost: result.purchasePrice, resale: result.resale, fees: result.fees + result.shipping, profit, roi, risk: profit > 70 ? "Low" : profit > 25 ? "Medium" : "High", rating: profit > 70 ? "Strong Buy" : profit > 25 ? "Possible Buy" : "Risky", demand: "High" };
  const analysis = calculateFlipScore(scannedDeal);

  function beginAnalysis() { setAnalysisStage(0); setStep("analysing"); }
  function resetScanner() { setStep("capture"); setAnalysisStage(0); }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Scan an Item" copy="Take a photo of something you're considering buying and Flipbot will help identify it and check the resale potential." />
      <ContextHelp title="Get a stronger match" copy="Show the full item, include model markings and keep faces, addresses and documents out of the photo." onHelp={onHelp} />
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const url = URL.createObjectURL(file); setPreview(url); setResult((current) => ({ ...current, imageUrl: url })); beginAnalysis(); }} />

      {step === "capture" ? <Panel><div className="mx-auto max-w-xl py-5 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] border border-blue-300/20 bg-blue-500/10 shadow-[0_0_45px_rgba(36,107,253,.15)]"><Camera className="h-8 w-8 text-blue-100" /></div><h2 className="mt-6 text-2xl font-semibold">Ready to check an item?</h2><p className="mt-2 text-sm leading-6 text-slate-400">Get the full product in frame and include any logos or model markings.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><GlowButton className="min-h-12" onClick={() => fileInputRef.current?.click()}><Camera className="mr-2 inline h-4 w-4" />Take Photo</GlowButton><GhostButton className="min-h-12" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 inline h-4 w-4" />Upload Photo</GhostButton></div><button onClick={beginAnalysis} className="mt-4 text-sm font-semibold text-blue-200 hover:text-white">Try with a sample item</button><div className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left"><p className="text-sm font-semibold">For the best match</p><ul className="mt-3 space-y-2 text-sm text-slate-400"><li>· Show the full product.</li><li>· Include logos or model markings.</li><li>· Avoid glare and heavy shadows.</li><li>· Take another angle if important details aren&apos;t visible.</li></ul></div></div></Panel> : null}

      {step === "analysing" ? <Panel><div className="mx-auto max-w-lg py-10"><div className="mx-auto h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><motion.div className="h-full rounded-full bg-blue-500" animate={{ width: `${(analysisStage + 1) * 33.33}%` }} /></div><div className="mt-7 space-y-3">{["Identifying product...", "Checking product details...", "Preparing valuation..."].map((label, index) => <div key={label} className={cn("flex items-center gap-3 rounded-2xl border p-4", index === analysisStage ? "border-blue-300/25 bg-blue-500/10" : index < analysisStage ? "border-emerald-300/15" : "border-white/[0.06] opacity-45")}><span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06]">{index < analysisStage ? <Check className="h-4 w-4 text-emerald-200" /> : index + 1}</span><span className="font-semibold">{label}</span></div>)}</div></div></Panel> : null}

      {step === "confirm" ? <Panel><div className="grid gap-5 md:grid-cols-[260px_1fr]"><Image src={preview} alt={result.productName} width={520} height={390} sizes="(max-width: 768px) 90vw, 260px" className="aspect-[4/3] w-full rounded-2xl object-cover" unoptimized={preview.startsWith("blob:")} /><div><Badge tone="teal">Match confidence · High</Badge><h2 className="mt-4 text-2xl font-semibold">Is this the right product?</h2><p className="mt-2 text-lg text-white">{result.productName}</p><p className="mt-1 text-sm text-slate-400">{result.category} · {result.condition}</p><p className="mt-4 text-xs leading-5 text-slate-500">Match Confidence describes how confident Flipbot is that the Scanner identified the correct product.</p><div className="mt-6 flex flex-col gap-2 sm:flex-row"><GlowButton onClick={() => setStep("price")}>Yes, Continue</GlowButton><GhostButton onClick={resetScanner}>Choose Another Match</GhostButton></div></div></div></Panel> : null}

      {step === "price" ? <Panel><div className="mx-auto max-w-md py-5 text-center"><p className="text-sm font-semibold text-blue-200">{result.productName}</p><h2 className="mt-2 text-3xl font-semibold">How much are they asking?</h2><p className="mt-2 text-sm text-slate-400">Enter what you&apos;d need to pay for the item.</p><div className="mx-auto mt-7 max-w-xs text-left"><NumberField label="Asking price" value={result.purchasePrice} onChange={(purchasePrice) => setResult({ ...result, purchasePrice })} /></div><div className="mt-6 flex justify-center gap-2"><GlowButton onClick={() => setStep("result")}>Check This Deal</GlowButton><GhostButton onClick={() => setStep("confirm")}>Back</GhostButton></div></div></Panel> : null}

      {step === "result" ? <div className="space-y-5"><Panel><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Scanner result</p><h2 className="mt-2 text-2xl font-semibold">{result.productName}</h2><div className="mt-3 flex flex-wrap items-center gap-3"><ClassificationBadge label={analysis.classification} /><span className="text-sm text-slate-400">Flip Score <strong className="text-white">{analysis.score} / 100</strong></span></div></div><Image src={preview} alt={result.productName} width={116} height={116} className="h-28 w-28 rounded-2xl object-cover" unoptimized={preview.startsWith("blob:")} /></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><MetricBox label="Asking price" value={`£${result.purchasePrice}`} /><MetricBox label="Est. resale" value={`£${result.resale - 10}–£${result.resale + 10}`} /><MetricBox label="Est. profit" value={`£${profit}`} hot /><MetricBox label="ROI" value={`${roi}%`} hot /></div></Panel><div className="grid gap-4 sm:grid-cols-2"><ReasonBlock title="Demand" copy="High. Buyer interest appears consistent for this product." /><ReasonBlock title="Valuation Confidence" copy={`${analysis.confidence}. Market evidence supports the estimated resale range. This is separate from Scanner Match Confidence.`} /></div><Panel title="Instant Buy"><div className="grid grid-cols-2 gap-3"><MetricBox label="Open market · est. resale" value={`£${result.resale}`} /><MetricBox label="CEX · indicative offer" value={`£${result.instantBuyer}`} /></div><p className="mt-3 text-xs text-slate-500">CEX availability and final value depend on the exact product and condition.</p></Panel><div className="flex flex-col gap-2 sm:flex-row"><GlowButton onClick={() => { onSaveResult(result); onToast("Saved", `${result.productName} is in Saved Deals.`); }}>Save Deal</GlowButton><GhostButton onClick={resetScanner}>Scan Another Item</GhostButton><GhostButton onClick={() => { onCreateDraft({ id: uid("draft"), title: result.productName, description: `${result.condition} ${result.productName}.`, price: result.resale, condition: result.condition, category: result.category, status: "Draft", image: result.imageUrl }); onToast("Draft created", "A listing draft was saved for later."); }}>Create Draft</GhostButton></div></div> : null}
    </div>
  );
}

function CrmPage({
  crmDeals,
  allDeals,
  tasks,
  onSelectDeal,
  onUpdateCrm,
  onRemoveCrm,
  onAddTask,
}: {
  crmDeals: CrmDeal[];
  allDeals: AppDeal[];
  tasks: AppTask[];
  onSelectDeal: (deal: AppDeal) => void;
  onUpdateCrm: (dealId: string, update: Partial<CrmDeal>) => void;
  onRemoveCrm: (dealId: string) => void;
  onAddTask: (task: Omit<AppTask, "id" | "status">) => void;
}) {
  const analytics = useMemo(() => {
    const active = crmDeals.filter((item) => !["Sold", "Passed"].includes(item.stage));
    const realised = crmDeals.reduce((sum, item) => sum + (item.actualProfit ?? 0), 0);
    const potential = active.reduce((sum, item) => sum + (allDeals.find((deal) => deal.id === item.dealId)?.profit ?? 0), 0);
    const avg = crmDeals.length ? Math.round(crmDeals.reduce((sum, item) => sum + (allDeals.find((deal) => deal.id === item.dealId)?.roi ?? 0), 0) / crmDeals.length) : 0;
    return { active: active.length, realised, potential, avg, sold: crmDeals.filter((item) => item.stage === "Sold").length };
  }, [allDeals, crmDeals]);

  return (
    <div className="space-y-5">
      <PageHeader title="CRM Board / Analytics" copy="Move deals through a practical pipeline, add notes, log actual sale prices, and calculate realised profit." />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Potential profit" value={`GBP ${analytics.potential}`} icon={CircleDollarSign} />
        <StatCard label="Realised profit" value={`GBP ${analytics.realised}`} icon={CheckCircle2} />
        <StatCard label="Active deals" value={String(analytics.active)} icon={ClipboardList} />
        <StatCard label="Average ROI" value={`${analytics.avg}%`} icon={Gauge} />
        <StatCard label="Sold" value={String(analytics.sold)} icon={PackagePlus} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Panel title="Deal pipeline">
          <div className="grid gap-4 overflow-x-auto pb-2 xl:grid-cols-4 2xl:grid-cols-7">
            {crmStages.map((stage) => {
              const entries = crmDeals.filter((item) => item.stage === stage);
              return (
                <div key={stage} className="min-w-[240px] rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold">{stage}</p>
                    <span className="rounded-full bg-white/[0.06] px-2 py-1 text-xs text-slate-400">{entries.length}</span>
                  </div>
                  <div className="space-y-3">
                    {entries.map((entry) => {
                      const deal = allDeals.find((item) => item.id === entry.dealId);
                      if (!deal) return null;
                      return <CrmCard key={entry.dealId} deal={deal} entry={entry} onClick={() => onSelectDeal(deal)} onUpdate={(update) => onUpdateCrm(entry.dealId, update)} onRemove={() => onRemoveCrm(entry.dealId)} onAddTask={() => onAddTask({ title: `Follow up ${deal.title}`, deal: deal.title, due: "Today", priority: "Medium", notes: entry.note })} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <TaskManager tasks={tasks} onAdd={onAddTask} onUpdate={() => undefined} onDelete={() => undefined} compact />
      </div>
    </div>
  );
}

function SavedDealsPage({
  onPageChange,
  savedDeals,
  onSelectDeal,
  onUnsaveDeal,
  onHelp,
}: {
  onPageChange: (id: PageId) => void;
  savedDeals: AppDeal[];
  onSelectDeal: (deal: AppDeal) => void;
  onUnsaveDeal: (dealId: string) => void;
  onHelp: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("roi");
  const filteredSaved = savedDeals
    .filter((deal) => `${deal.title} ${deal.marketplace} ${deal.category}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sort === "profit" ? b.profit - a.profit : b.roi - a.roi));

  return (
    <div className="space-y-5">
      <PageHeader title="Saved Deals" copy="Keep the opportunities you want to come back to." />
      <ContextHelp title="Saved research, not a reservation" copy="External listings can be edited, sold or removed. Recheck the live listing and current evidence before buying." onHelp={onHelp} />
      <div>
        <Panel title="Saved opportunities">
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <Input value={query} onChange={setQuery} placeholder="Search saved deals..." />
            <Select value={sort} onChange={setSort} options={[["roi", "Highest ROI"], ["profit", "Highest profit"]]} />
          </div>
          <div className="space-y-3">
            {filteredSaved.map((deal) => (
              <SavedDealRow key={deal.id} deal={deal} onClick={() => onSelectDeal(deal)} onUnsave={() => onUnsaveDeal(deal.id)} />
            ))}
          </div>
          {filteredSaved.length === 0 ? <div className="rounded-3xl border border-dashed border-white/[0.1] p-8 text-center"><Bookmark className="mx-auto h-7 w-7 text-slate-500" /><h3 className="mt-4 text-xl font-semibold">No saved deals yet.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Save opportunities from Product Finder or Scanner and they&apos;ll appear here.</p><div className="mt-5 flex justify-center gap-2"><GlowButton onClick={() => onPageChange("facebook")}>Find Deals</GlowButton><GhostButton onClick={() => onPageChange("scanner")}>Scan an Item</GhostButton></div></div> : null}
        </Panel>
      </div>
    </div>
  );
}

function AutoListerPage({ drafts, setDrafts, onToast }: { drafts: ListingDraft[]; setDrafts: React.Dispatch<React.SetStateAction<ListingDraft[]>>; onToast: (title: string, detail?: string) => void }) {
  const [selectedId, setSelectedId] = useState(drafts[0]?.id ?? "");
  const selected = drafts.find((draft) => draft.id === selectedId) ?? drafts[0];

  function updateDraft(update: Partial<ListingDraft>) {
    if (!selected) return;
    setDrafts((items) => items.map((draft) => (draft.id === selected.id ? { ...draft, ...update } : draft)));
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Auto Lister" copy="Edit listing drafts, check marketplace connection status, and prepare products for publishing." action="New draft" onAction={() => {
        const draft = { id: uid("draft"), title: "Untitled listing", description: "", price: 0, condition: "Good", category: "Electronics", status: "Needs images" as const, image: appDeals[0].image };
        setDrafts((items) => [draft, ...items]);
        setSelectedId(draft.id);
      }} />
      <div className="grid gap-5 xl:grid-cols-[320px_1fr_360px]">
        <Panel title="Drafts">
          <div className="space-y-2">
            {drafts.map((draft) => (
              <button key={draft.id} onClick={() => setSelectedId(draft.id)} className={cn("w-full rounded-2xl border p-3 text-left", selected?.id === draft.id ? "border-blue-200/25 bg-blue-500/10" : "border-white/[0.08] bg-white/[0.025]")}>
                <p className="truncate text-sm font-semibold">{draft.title}</p>
                <p className="mt-1 text-xs text-slate-500">{draft.status}</p>
              </button>
            ))}
          </div>
        </Panel>
        {selected ? (
          <Panel title="Listing editor" action="Save draft" onAction={() => onToast("Draft saved", selected.title)}>
            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <Image src={selected.image} alt={selected.title} width={260} height={200} sizes="260px" className="aspect-[4/3] w-full rounded-2xl object-cover" unoptimized={selected.image.startsWith("blob:")} />
              <div className="space-y-3">
                <label><FieldLabel>Title</FieldLabel><Input value={selected.title} onChange={(value) => updateDraft({ title: value })} /></label>
                <label><FieldLabel>Description</FieldLabel><textarea value={selected.description} onChange={(event) => updateDraft({ description: event.target.value })} className="min-h-28 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] p-3 text-sm outline-none focus:border-blue-200/40" /></label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <NumberField label="Price" value={selected.price} onChange={(value) => updateDraft({ price: value })} />
                  <label><FieldLabel>Condition</FieldLabel><Select value={selected.condition} onChange={(value) => updateDraft({ condition: value })} options={["New", "Very good", "Good", "Used", "Needs repair"]} /></label>
                  <label><FieldLabel>Status</FieldLabel><Select value={selected.status} onChange={(value) => updateDraft({ status: value as ListingDraft["status"] })} options={["Draft", "Ready", "Needs images", "Published placeholder"]} /></label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <GhostButton onClick={() => setDrafts((items) => [{ ...selected, id: uid("draft"), title: `${selected.title} copy` }, ...items])}>Duplicate</GhostButton>
                  <GhostButton onClick={() => setDrafts((items) => items.filter((draft) => draft.id !== selected.id))}>Delete</GhostButton>
                  <GlowButton onClick={() => onToast("Publishing disabled", "Connect a marketplace account before publishing.")}>Publish placeholder</GlowButton>
                </div>
              </div>
            </div>
          </Panel>
        ) : null}
        <Panel title="Connections">
          <div className="space-y-3">
            {marketplaceConnections.map((connection) => (
              <ConnectionCard key={connection.name} {...connection} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AccountPage({ profile, setProfile, settings, onToast, onPageChange }: { profile: AccountProfile; setProfile: React.Dispatch<React.SetStateAction<AccountProfile>>; settings: UserSettings; onToast: (title: string, detail?: string) => void; onPageChange: (id: PageId) => void }) {
  const [section, setSection] = useState<"profile" | "security" | "connections" | "billing">("profile");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"number" | "verify">("number");
  const [phoneDraft, setPhoneDraft] = useState(profile.phone);
  const [phoneCode, setPhoneCode] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  function saveProfile() {
    if (!draft.name.trim()) return setProfileError("Enter your name.");
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(draft.username)) return setProfileError("Username must be 3–24 characters using letters, numbers or underscores.");
    if (!/^\S+@\S+\.\S+$/.test(draft.email)) return setProfileError("Enter a valid email address.");
    setProfile({ ...draft, name: draft.name.trim(), username: draft.username.toLowerCase(), emailVerified: draft.email === profile.email ? profile.emailVerified : false });
    setProfileError(null);
    setEditing(false);
    onToast("Profile saved", "Your account details were updated.");
  }

  function startPhoneVerification() {
    if (!/^\+?[0-9\s()-]{8,20}$/.test(phoneDraft.trim())) {
      onToast("Check the phone number", "Include a valid mobile number and country code.");
      return;
    }
    setPhoneStep("verify");
    onToast("Verification code sent", "For this dashboard prototype, use 123456.");
  }

  function verifyPhone() {
    if (phoneCode !== "123456") {
      onToast("Incorrect code", "Check the code and try again.");
      return;
    }
    setProfile((current) => ({ ...current, phone: phoneDraft.trim(), phoneVerified: true }));
    setPhoneOpen(false);
    setPhoneStep("number");
    setPhoneCode("");
    onToast("Phone connected", "Your mobile number is now verified.");
  }

  function updatePassword() {
    if (!passwords.current) return onToast("Enter your current password", "Your existing password is required.");
    if (passwords.next.length < 8) return onToast("Password is too short", "Use at least 8 characters.");
    if (passwords.next !== passwords.confirm) return onToast("Passwords do not match", "Re-enter the new password.");
    setPasswords({ current: "", next: "", confirm: "" });
    onToast("Password updated", "Your other sessions will remain active in this prototype.");
  }

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: UserRound },
    { id: "security" as const, label: "Security", icon: LockKeyhole },
    { id: "connections" as const, label: "Connections", icon: ExternalLink },
    { id: "billing" as const, label: "Plan & Usage", icon: CreditCard },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="Account" copy="Manage your profile, contact details, security, connections and Flipbot plan." />
      <Panel className="overflow-hidden p-0">
        <div className="relative border-b border-white/[0.07] bg-[radial-gradient(circle_at_10%_0%,rgba(36,107,253,.22),transparent_28rem)] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[26px] border border-blue-300/20 bg-blue-500/15 text-3xl font-semibold text-blue-100 shadow-[0_0_35px_rgba(36,107,253,.18)]">{profile.name.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-2xl font-semibold">{profile.name}</h2><Badge tone="blue">{appUser.plan}</Badge></div><p className="mt-1 text-sm text-blue-200">@{profile.username}</p><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{profile.bio}</p><p className="mt-2 text-xs text-slate-500">Member since {profile.memberSince}</p></div>
            <GhostButton onClick={() => { setSection("profile"); setDraft(profile); setEditing(true); }}>Edit profile</GhostButton>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-4">{tabs.map((tab) => <button key={tab.id} onClick={() => setSection(tab.id)} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.04] hover:text-white", section === tab.id && "bg-blue-500/12 text-blue-100 ring-1 ring-blue-200/10")}><tab.icon className="h-4 w-4" />{tab.label}</button>)}</div>
      </Panel>

      {section === "profile" ? (
        <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <Panel title="Profile details" action={editing ? undefined : "Edit"} onAction={() => { setDraft(profile); setEditing(true); }}>
            {editing ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label><FieldLabel>Display name</FieldLabel><Input value={draft.name} onChange={(name) => setDraft({ ...draft, name })} placeholder="Your name" /></label>
                  <label><FieldLabel>Username</FieldLabel><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">@</span><input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value.replace(/[^a-zA-Z0-9_]/g, "") })} className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-8 pr-3 text-sm outline-none focus:border-blue-200/40" /></div></label>
                  <label><FieldLabel>Email address</FieldLabel><Input value={draft.email} onChange={(email) => setDraft({ ...draft, email })} placeholder="you@example.com" /></label>
                  <label><FieldLabel>Location</FieldLabel><Input value={draft.location} onChange={(location) => setDraft({ ...draft, location })} placeholder="Brighton, United Kingdom" /></label>
                </div>
                <label><FieldLabel>About you</FieldLabel><textarea value={draft.bio} maxLength={160} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} className="min-h-24 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] p-3 text-sm outline-none focus:border-blue-200/40" /><p className="mt-1 text-right text-xs text-slate-500">{draft.bio.length} / 160</p></label>
                {profileError ? <p className="rounded-xl border border-red-300/20 bg-red-400/[0.07] p-3 text-sm text-red-200">{profileError}</p> : null}
                <div className="flex justify-end gap-2"><GhostButton onClick={() => { setDraft(profile); setProfileError(null); setEditing(false); }}>Cancel</GhostButton><GlowButton onClick={saveProfile}>Save changes</GlowButton></div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2"><InputPreview label="Display name" value={profile.name} /><InputPreview label="Username" value={`@${profile.username}`} /><InputPreview label="Email" value={profile.email} /><InputPreview label="Location" value={profile.location} /><InputPreview label="Currency" value={settings.currency} /><InputPreview label="Region" value={settings.region} /></div>
            )}
          </Panel>
          <div className="space-y-5">
            <Panel title="Contact details">
              <AccountContactRow icon={Mail} label="Email" value={profile.email} verified={profile.emailVerified} action={profile.emailVerified ? undefined : "Verify"} onAction={() => { setProfile((current) => ({ ...current, emailVerified: true })); onToast("Email verified", "Your email is now marked as verified in this prototype."); }} />
              <div className="my-4 h-px bg-white/[0.07]" />
              <AccountContactRow icon={Phone} label="Mobile" value={profile.phone || "Not connected"} verified={profile.phoneVerified} action={profile.phone ? "Change" : "Connect"} onAction={() => { setPhoneDraft(profile.phone); setPhoneStep("number"); setPhoneCode(""); setPhoneOpen(true); }} />
              {profile.phone ? <button onClick={() => { setProfile((current) => ({ ...current, phone: "", phoneVerified: false })); onToast("Phone removed", "Your mobile number was disconnected."); }} className="mt-4 text-xs font-semibold text-slate-500 hover:text-red-200">Remove mobile number</button> : null}
            </Panel>
            <Panel title="Sourcing defaults"><p className="text-sm text-slate-400">{settings.defaultMarketplace} · {settings.defaultDistance} mile radius · £{settings.minProfit}+ minimum profit</p><GhostButton className="mt-4" onClick={() => onPageChange("settings")}>Edit preferences</GhostButton></Panel>
          </div>
        </div>
      ) : null}

      {section === "security" ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Change password"><div className="space-y-3"><label><FieldLabel>Current password</FieldLabel><input type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm outline-none focus:border-blue-200/40" /></label><label><FieldLabel>New password</FieldLabel><input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm outline-none focus:border-blue-200/40" /></label><label><FieldLabel>Confirm new password</FieldLabel><input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm outline-none focus:border-blue-200/40" /></label><GlowButton onClick={updatePassword}>Update password</GlowButton></div></Panel>
          <Panel title="Account protection"><div className="space-y-4"><SecurityStatus title="Email verified" copy={profile.email} complete={profile.emailVerified} /><SecurityStatus title="Mobile connected" copy={profile.phone || "Add a recovery and verification number."} complete={profile.phoneVerified} /><SecurityStatus title="Two-step verification" copy="Available when production authentication is connected." complete={false} /></div></Panel>
          <Panel title="Active session"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">This browser</p><p className="mt-1 text-sm text-slate-400">Windows · United Kingdom · Active now</p></div><Badge tone="teal">Current</Badge></div><GhostButton className="mt-5" onClick={() => onToast("Other sessions signed out", "Only this browser remains active in the prototype.")}>Sign out other sessions</GhostButton></Panel>
          <Panel title="Sign out"><p className="text-sm leading-6 text-slate-400">Sign out when you are finished on a shared device.</p><GhostButton className="mt-4" onClick={() => onToast("Signed out", "Authentication is not connected, so this prototype remains open.")}><LogOut className="mr-2 inline h-4 w-4" />Sign out</GhostButton></Panel>
        </div>
      ) : null}

      {section === "connections" ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Marketplace connections"><ConnectionCard name="eBay" status="Connected" detail="Your eBay account is available for supported account-connected workflows." /><p className="mt-4 text-xs leading-5 text-slate-500">Facebook Marketplace is used as a Product Finder research source and is not connected to your Facebook account.</p></Panel>
          <Panel title="Community connection"><div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">Discord</p><p className="mt-1 text-sm text-slate-400">Join the Flipbot reseller community.</p></div><Badge>Not linked</Badge></div><a href="https://discord.gg/YVZCYFUAW" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-semibold text-slate-200 hover:bg-white/[0.06]">Open Discord <ExternalLink className="h-4 w-4" /></a></div></Panel>
          <Panel title="Connection privacy"><p className="text-sm leading-7 text-slate-400">Connected services use their own terms and privacy practices. Flipbot should request only the access needed for the feature and let you disconnect supported accounts.</p><GhostButton className="mt-4" onClick={() => onPageChange("privacy")}>Read Privacy Policy</GhostButton></Panel>
        </div>
      ) : null}

      {section === "billing" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <Panel title="Current plan"><div className="flex flex-col gap-4 rounded-2xl border border-blue-300/20 bg-blue-500/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between"><div><Badge tone="blue">Current plan</Badge><p className="mt-3 text-2xl font-semibold">Pro</p><p className="mt-1 text-sm text-slate-400">£79.99 per month · Renews 1 September</p></div><GhostButton onClick={() => onToast("Billing portal pending", "Connect Stripe to manage the live subscription.")}>Manage subscription</GhostButton></div><div className="mt-5 grid grid-cols-3 gap-2">{[["Starter", "£19.99"], ["Plus", "£49.99"], ["Pro", "£79.99"]].map(([plan, price]) => <div key={plan} className={cn("rounded-2xl border p-3", plan === "Pro" ? "border-blue-300/25 bg-blue-500/10" : "border-white/[0.07] bg-white/[0.02]")}><p className="text-sm font-semibold">{plan}</p><p className="mt-1 text-lg font-semibold">{price}</p><p className="text-xs text-slate-500">per month</p></div>)}</div><p className="mt-4 text-xs leading-5 text-slate-500">Plan allowances and the billing portal must be confirmed against the live Stripe configuration before launch.</p></Panel>
          <Panel title="Current usage"><UsageBars /><p className="mt-4 text-xs text-slate-500">Usage resets {appUser.resetDate}.</p></Panel>
          <Panel title="Credits"><p className="text-sm leading-7 text-slate-400">A standard Product Finder search uses 10 credits. Enabling the eligible CEX check adds 5 credits. Credits are a service allowance, not cash.</p><GhostButton className="mt-4" onClick={() => onPageChange("subscriptions")}>Credits & cancellation terms</GhostButton></Panel>
          <Panel title="Billing help"><p className="text-sm leading-7 text-slate-400">For a billing problem, include your account email, date and a short description. Never send your password or full card number.</p><GhostButton className="mt-4" onClick={() => onPageChange("help")}>Visit Help centre</GhostButton></Panel>
        </div>
      ) : null}

      {phoneOpen ? (
        <Modal title={phoneStep === "number" ? "Connect mobile number" : "Verify your number"} onClose={() => setPhoneOpen(false)}>
          {phoneStep === "number" ? <div className="space-y-4"><p className="text-sm leading-6 text-slate-400">Add a mobile number for account recovery and future security checks. Include the country code.</p><label><FieldLabel>Mobile number</FieldLabel><Input value={phoneDraft} onChange={setPhoneDraft} placeholder="+44 7700 900000" /></label><div className="flex justify-end gap-2"><GhostButton onClick={() => setPhoneOpen(false)}>Cancel</GhostButton><GlowButton onClick={startPhoneVerification}>Send code</GlowButton></div></div> : <div className="space-y-4"><p className="text-sm leading-6 text-slate-400">Enter the six-digit code sent to {phoneDraft}. For this prototype, use <strong className="text-white">123456</strong>.</p><label><FieldLabel>Verification code</FieldLabel><Input value={phoneCode} onChange={(value) => setPhoneCode(value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label><div className="flex justify-end gap-2"><GhostButton onClick={() => setPhoneStep("number")}>Back</GhostButton><GlowButton onClick={verifyPhone}>Verify number</GlowButton></div></div>}
        </Modal>
      ) : null}
    </div>
  );
}

function AccountContactRow({ icon: Icon, label, value, verified, action, onAction }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; verified: boolean; action?: string; onAction: () => void }) {
  return <div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10"><Icon className="h-4 w-4 text-blue-200" /></span><div className="min-w-0 flex-1"><p className="text-xs text-slate-500">{label}</p><p className="truncate text-sm font-semibold">{value}</p></div><div className="flex items-center gap-2">{verified ? <Badge tone="teal">Verified</Badge> : <Badge>Not verified</Badge>}{action ? <button onClick={onAction} className="text-sm font-semibold text-blue-200 hover:text-white">{action}</button> : null}</div></div>;
}

function SecurityStatus({ title, copy, complete }: { title: string; copy: string; complete: boolean }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", complete ? "bg-emerald-400/15 text-emerald-200" : "bg-white/[0.06] text-slate-500")}>{complete ? <Check className="h-4 w-4" /> : "·"}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p></div></div>;
}

function SettingsPage({ settings, setSettings, onToast, onPageChange }: { settings: UserSettings; setSettings: React.Dispatch<React.SetStateAction<UserSettings>>; onToast: (title: string, detail?: string) => void; onPageChange: (id: PageId) => void }) {
  const [draft, setDraft] = useState(settings);
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" copy="Configure sourcing defaults, notifications and display preferences." action="Save settings" onAction={() => { setSettings(draft); onToast("Settings saved", "Your app preferences were updated."); }} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="General">
          <div className="grid gap-3 sm:grid-cols-2">
            <label><FieldLabel>Currency</FieldLabel><Select value={draft.currency} onChange={(value) => setDraft({ ...draft, currency: value })} options={["GBP", "USD", "EUR"]} /></label>
            <label><FieldLabel>Region</FieldLabel><Input value={draft.region} onChange={(value) => setDraft({ ...draft, region: value })} /></label>
            <label><FieldLabel>Default marketplace</FieldLabel><Select value={draft.defaultMarketplace} onChange={(value) => setDraft({ ...draft, defaultMarketplace: value as UserSettings["defaultMarketplace"] })} options={["Facebook", "eBay"]} /></label>
            <NumberField label="Default distance" value={draft.defaultDistance} onChange={(value) => setDraft({ ...draft, defaultDistance: value })} />
          </div>
        </Panel>
        <Panel title="Deal preferences">
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="Minimum profit" value={draft.minProfit} onChange={(value) => setDraft({ ...draft, minProfit: value })} />
            <NumberField label="Max purchase" value={draft.maxPurchase} onChange={(value) => setDraft({ ...draft, maxPurchase: value })} />
            <label><FieldLabel>Risk tolerance</FieldLabel><Select value={draft.riskTolerance} onChange={(value) => setDraft({ ...draft, riskTolerance: value as UserSettings["riskTolerance"] })} options={["Low", "Medium", "High"]} /></label>
          </div>
        </Panel>
        <Panel title="Notifications and display">
          <Toggle label="Email alerts" checked={draft.emailAlerts} onChange={(value) => setDraft({ ...draft, emailAlerts: value })} />
          <Toggle label="Compact cards" checked={draft.compactCards} onChange={(value) => setDraft({ ...draft, compactCards: value })} />
          <Toggle label="Reduced motion" checked={draft.reducedMotion} onChange={(value) => setDraft({ ...draft, reducedMotion: value })} />
          <label className="mt-3 block"><FieldLabel>Quiet hours</FieldLabel><Input value={draft.quietHours} onChange={(value) => setDraft({ ...draft, quietHours: value })} /></label>
        </Panel>
        <Panel title="Security">
          <div className="space-y-4 text-sm leading-6 text-slate-400">
            <div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-blue-200" /><p>Keep your sign-in details private and use a unique password. Password and active-session controls will appear here when authentication is connected.</p></div>
            <GhostButton onClick={() => onToast("Security controls pending", "Connect authentication to manage passwords and active sessions.")}>Manage sign-in security</GhostButton>
          </div>
        </Panel>
        <Panel title="Privacy & legal">
          <p className="text-sm leading-6 text-slate-400">Read the policies that explain Flipbot’s estimates, data use, subscriptions and acceptable use.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <PolicyLink label="Privacy Policy" onClick={() => onPageChange("privacy")} />
            <PolicyLink label="Cookie Policy" onClick={() => onPageChange("cookies")} />
            <PolicyLink label="Terms of Service" onClick={() => onPageChange("terms")} />
            <PolicyLink label="Subscriptions & Credits" onClick={() => onPageChange("subscriptions")} />
          </div>
        </Panel>
        <Panel title="Your data & account">
          <p className="text-sm leading-6 text-slate-400">Data access, correction and deletion requests will use the support route once the final contact destination is connected.</p>
          <div className="mt-4 flex flex-wrap gap-2"><GhostButton onClick={() => onToast("Support link needed", "Connect the privacy request destination before launch.")}>Request my data</GhostButton><GhostButton onClick={() => onToast("Account deletion not connected", "Add the verified deletion flow before launch.")}>Delete account</GhostButton></div>
        </Panel>
      </div>
      <div className="flex justify-end gap-2">
        <GhostButton onClick={() => setDraft(initialSettings)}>Reset defaults</GhostButton>
        <GlowButton onClick={() => { setSettings(draft); onToast("Settings saved", "Your app preferences were updated."); }}>Save settings</GlowButton>
      </div>
    </div>
  );
}

function CrmCard({ deal, entry, onClick, onUpdate, onRemove, onAddTask }: { deal: AppDeal; entry: CrmDeal; onClick: () => void; onUpdate: (update: Partial<CrmDeal>) => void; onRemove: () => void; onAddTask: () => void }) {
  const [salePrice, setSalePrice] = useState(entry.actualSalePrice ?? deal.resale);
  const actualProfit = computeProfit(deal.cost, salePrice, deal.fees);
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-3">
      <button onClick={onClick} className="w-full text-left">
        <p className="text-sm font-semibold">{deal.title}</p>
        <p className="mt-1 text-xs text-blue-100">GBP {deal.profit} - {deal.roi}% ROI</p>
        <p className="mt-1 text-xs text-slate-500">{deal.marketplace}</p>
      </button>
      <div className="mt-3 space-y-2">
        <Select value={entry.stage} onChange={(stage) => onUpdate({ stage: stage as CrmStage })} options={crmStages} />
        {entry.stage === "Sold" ? (
          <div className="grid gap-2">
            <NumberField label="Actual sale" value={salePrice} onChange={setSalePrice} />
            <SmallButton onClick={() => onUpdate({ actualSalePrice: salePrice, actualProfit })}>Log GBP {actualProfit} profit</SmallButton>
          </div>
        ) : null}
        <div className="flex gap-2">
          <SmallButton onClick={onAddTask}>Task</SmallButton>
          <SmallButton onClick={onRemove}>Remove</SmallButton>
        </div>
      </div>
    </div>
  );
}

function SavedDealRow({ deal, onClick, onUnsave }: { deal: AppDeal; onClick: () => void; onUnsave: () => void }) {
  const analysis = calculateFlipScore(deal);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 lg:flex-row lg:items-center">
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-4 text-left">
        <Image src={deal.image} alt={deal.title} width={80} height={80} sizes="80px" className="h-20 w-20 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{deal.title}</p>
          <p className="mt-1 text-xs text-slate-500">{deal.marketplace} · Saved recently · Listing available</p>
          <div className="mt-2"><ClassificationBadge label={analysis.classification} /></div>
        </div>
      </button>
      <div className="grid grid-cols-4 gap-2 lg:w-[360px]"><MetricBox label="Buy" value={`£${deal.cost}`} /><MetricBox label="Est. resale" value={`£${deal.resale}`} /><MetricBox label="Profit" value={`£${deal.profit}`} hot /><MetricBox label="Score" value={`${analysis.score}`} /></div>
      <div className="flex gap-2"><SmallButton onClick={onClick}>View Analysis</SmallButton><SmallButton onClick={() => window.open(getDealUrl(deal), "_blank", "noopener,noreferrer")}>Open Listing</SmallButton><SmallButton onClick={onUnsave}>Remove</SmallButton></div>
    </div>
  );
}

function CompactDealCard({ deal, onClick }: { deal: AppDeal; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-left hover:border-blue-200/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
      <div className="flex gap-3">
        <Image src={deal.image} alt={deal.title} width={96} height={96} sizes="80px" loading="eager" className="h-20 w-20 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{deal.title}</p>
          <p className="mt-1 text-xs text-slate-500">{deal.marketplace} · {deal.category}</p>
          <p className="mt-2 text-sm text-blue-100">£{deal.profit} profit · {deal.roi}% ROI</p>
        </div>
      </div>
    </button>
  );
}

function PageHeader({ title, copy, action, onAction }: { title: string; copy: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h2 className="text-4xl font-semibold tracking-[-0.045em] md:text-5xl">{title}</h2>
        <p className="mt-3 max-w-3xl text-slate-400">{copy}</p>
      </div>
      {action ? <GlowButton onClick={onAction}>{action}</GlowButton> : null}
    </div>
  );
}

function ContextHelp({ title, copy, onHelp }: { title: string; copy: string; onHelp: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-blue-300/15 bg-blue-500/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3"><HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-200" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{copy}</p></div></div>
      <button onClick={onHelp} className="shrink-0 text-left text-sm font-semibold text-blue-200 hover:text-white">Read the guide →</button>
    </div>
  );
}

function PolicyLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-left text-sm font-semibold text-slate-300 hover:border-blue-300/20 hover:text-white"><span>{label}</span><span className="text-blue-200">→</span></button>;
}

function CommunityPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Flipbot Community" copy="Talk sourcing, share finds, learn from other resellers and keep up with Flipbot updates." />
      <Panel>
        <div className="grid gap-8 py-5 md:grid-cols-[1fr_280px] md:items-center">
          <div>
            <Badge tone="blue">Hosted on Discord</Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em]">Learn with people who actually resell.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">The Flipbot community lives on Discord so the dashboard can stay focused on finding and analysing deals. Join the conversation to compare sourcing ideas, share useful finds and follow product updates.</p>
            <a href="https://discord.gg/YVZCYFUAW" target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(36,107,253,.2)] hover:bg-blue-500">Open Discord <ExternalLink className="h-4 w-4" /></a>
          </div>
          <div className="rounded-3xl border border-blue-300/15 bg-blue-500/[0.07] p-6 text-center"><Users className="mx-auto h-10 w-10 text-blue-200" /><p className="mt-4 text-lg font-semibold">One community, practical conversations.</p><p className="mt-2 text-xs leading-5 text-slate-400">Sourcing ideas · shared finds · reseller learning · Flipbot updates</p></div>
        </div>
      </Panel>
      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Community basics"><ul className="space-y-3 text-sm leading-6 text-slate-400"><li>• Be constructive and respect other resellers.</li><li>• Do not share private addresses, account details or payment information.</li><li>• Check any deal yourself before spending money.</li><li>• Report suspicious links or behaviour to the Discord moderators.</li></ul></Panel>
        <Panel title="A separate service"><p className="text-sm leading-7 text-slate-400">Discord is an independent third-party service with its own terms and privacy practices. Joining the server opens Discord in a new tab. References to Discord do not imply endorsement or ownership by Discord.</p></Panel>
      </div>
    </div>
  );
}

function HelpPage({ onPageChange, initialTopic, onSupport }: { onPageChange: (id: PageId) => void; initialTopic: HelpTopicId | null; onSupport: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<HelpTopicId | null>(initialTopic);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const normalized = query.trim().toLowerCase();
  const visibleTopics = helpTopics.filter((topic) => !normalized || `${topic.title} ${topic.summary} ${topic.intro}`.toLowerCase().includes(normalized));
  const visibleFaqs = faqItems.filter(([question, answer]) => !normalized || `${question} ${answer}`.toLowerCase().includes(normalized));
  const activeTopic = helpTopics.find((topic) => topic.id === selectedTopic);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Help centre" copy="Clear answers for finding, scanning and evaluating resale opportunities with Flipbot." />
      <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Product Finder, Scanner, credits, privacy..." className="min-h-14 w-full rounded-2xl border border-white/[0.09] bg-white/[0.035] pl-12 pr-4 text-sm outline-none transition focus:border-blue-300/35" /></div>

      {activeTopic ? (
        <HelpTopicView topic={activeTopic} onBack={() => setSelectedTopic(null)} onPageChange={onPageChange} />
      ) : (
        <>
          <section>
            <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Guides</p><h2 className="mt-1 text-2xl font-semibold">Choose a topic</h2></div><p className="text-xs text-slate-500">{visibleTopics.length} guides</p></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleTopics.map((topic) => <button key={topic.id} onClick={() => setSelectedTopic(topic.id)} className="group rounded-3xl border border-white/[0.08] bg-[#060911]/80 p-5 text-left transition hover:border-blue-300/25 hover:bg-blue-500/[0.055]"><div className="flex items-start justify-between gap-4"><HelpCircle className="h-5 w-5 text-blue-200" /><span className="text-sm text-blue-200 transition group-hover:translate-x-1">Open →</span></div><h3 className="mt-5 text-lg font-semibold">{topic.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{topic.summary}</p></button>)}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_330px]">
            <Panel title="Frequently asked questions">
              <div className="divide-y divide-white/[0.07]">
                {visibleFaqs.map(([question, answer]) => {
                  const index = faqItems.findIndex(([item]) => item === question);
                  const open = openFaq === index;
                  return <div key={question}><button onClick={() => setOpenFaq(open ? null : index)} className="flex w-full items-center justify-between gap-4 py-4 text-left"><span className="font-semibold">{question}</span><span className="text-xl text-blue-200">{open ? "−" : "+"}</span></button>{open ? <p className="pb-5 pr-8 text-sm leading-7 text-slate-400">{answer}</p> : null}</div>;
                })}
                {visibleFaqs.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No help answers match that search.</p> : null}
              </div>
            </Panel>
            <div className="space-y-5">
              <Panel title="Quick actions"><div className="grid gap-2"><GhostButton onClick={() => onPageChange("facebook")}>Open Product Finder</GhostButton><GhostButton onClick={() => onPageChange("scanner")}>Scan an Item</GhostButton><GhostButton onClick={() => onPageChange("saved")}>View Saved Deals</GhostButton></div></Panel>
              <Panel title="Still need help?"><MessageCircle className="h-7 w-7 text-blue-200" /><p className="mt-3 text-sm leading-6 text-slate-400">Tell support which feature you were using, what you expected and what happened. Never include your password or full payment-card details.</p><GlowButton className="mt-4 w-full" onClick={onSupport}>Contact Support</GlowButton><p className="mt-2 text-center text-[11px] text-slate-500">Support destination to be connected before launch.</p></Panel>
            </div>
          </section>
        </>
      )}

      <section>
        <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Policies</p><h2 className="mt-1 text-2xl font-semibold">Privacy, terms and billing</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{policyOrder.map((id) => { const doc = policyDocuments[id]; return <button key={id} onClick={() => onPageChange(id)} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:border-blue-300/20"><FileText className="h-5 w-5 text-blue-200" /><p className="mt-3 font-semibold">{doc.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{doc.description}</p></button>; })}</div>
      </section>
    </div>
  );
}

function HelpTopicView({ topic, onBack, onPageChange }: { topic: (typeof helpTopics)[number]; onBack: () => void; onPageChange: (id: PageId) => void }) {
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm font-semibold text-blue-200 hover:text-white">← All help topics</button>
      <Panel>
        <div className="max-w-3xl"><Badge tone="blue">Help guide</Badge><h2 className="mt-4 text-3xl font-semibold">{topic.title}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{topic.intro}</p></div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">{topic.sections.map((section) => <div key={section.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><h3 className="font-semibold">{section.title}</h3><p className="mt-2 text-sm leading-7 text-slate-400">{section.body}</p>{section.bullets ? <ul className="mt-3 space-y-2 text-sm text-slate-400">{section.bullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}</ul> : null}</div>)}</div>
        <div className="mt-6 flex flex-wrap gap-2">{topic.id === "product-finder" ? <GlowButton onClick={() => onPageChange("facebook")}>Open Product Finder</GlowButton> : null}{topic.id === "scanner" ? <GlowButton onClick={() => onPageChange("scanner")}>Scan an Item</GlowButton> : null}{topic.id === "saved-deals" ? <GlowButton onClick={() => onPageChange("saved")}>View Saved Deals</GlowButton> : null}{topic.id === "account" || topic.id === "credits" ? <GhostButton onClick={() => onPageChange("account")}>Account & Usage</GhostButton> : null}</div>
      </Panel>
    </div>
  );
}

function PolicyPage({ id, onBack, onNavigate }: { id: PolicyId; onBack: () => void; onNavigate: (id: PageId) => void }) {
  const document = policyDocuments[id];
  const Icon = id === "privacy" ? ShieldCheck : id === "cookies" ? Cookie : id === "subscriptions" ? CreditCard : id === "terms" ? Scale : FileText;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button onClick={onBack} className="text-sm font-semibold text-blue-200 hover:text-white">← Back to Help</button>
      <Panel>
        <div className="flex flex-col gap-5 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-start sm:justify-between"><div><Icon className="h-8 w-8 text-blue-200" /><h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">{document.title}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{document.description}</p><p className="mt-3 text-xs text-slate-500">{document.updated}</p></div><Badge tone="blue">Working draft</Badge></div>
        {document.draftNote ? <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/[0.07] p-4"><p className="text-sm font-semibold text-amber-100">Details required before publication</p><p className="mt-1 text-sm leading-6 text-amber-50/70">{document.draftNote}</p></div> : null}
        <div className="mt-8 space-y-9">{document.sections.map((section) => <section key={section.title} className="max-w-4xl"><h2 className="text-xl font-semibold">{section.title}</h2><div className="mt-3 space-y-3">{section.paragraphs.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-400">{paragraph}</p>)}</div>{section.bullets ? <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-400">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="text-blue-200">•</span><span>{bullet}</span></li>)}</ul> : null}</section>)}</div>
      </Panel>
      <div className="flex flex-wrap gap-2">{policyOrder.filter((policyId) => policyId !== id).map((policyId) => <GhostButton key={policyId} onClick={() => onNavigate(policyId)}>{policyDocuments[policyId].title}</GhostButton>)}</div>
    </div>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  return <div><div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-400">{label}</span><strong>{value} / {max}</strong></div><Progress value={(value / max) * 100} /></div>;
}

function Panel({ title, action, onAction, children, className }: { title?: string; action?: string; onAction?: () => void; children?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-white/[0.08] bg-[#060911]/80 p-4 shadow-[0_0_70px_rgba(0,0,0,.18)] backdrop-blur", className)}>
      {(title || action) ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? <h3 className="text-lg font-semibold">{title}</h3> : <span />}
          {action ? <button onClick={onAction} className="text-sm text-blue-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">{action}</button> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function StatCard({ label, value, icon: Icon, note }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; note?: string }) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold">{value}</p>
          {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
        </div>
        <Icon className="h-5 w-5 text-blue-200" />
      </div>
    </Panel>
  );
}

function MetricBox({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
      <p className={cn("text-lg font-semibold tracking-[-0.02em]", hot && "text-blue-100")}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  );
}

function TokenPill() {
  const remaining = appUser.tokensLimit - appUser.tokensUsed;
  return (
    <div className="hidden rounded-2xl border border-blue-200/10 bg-blue-500/[0.06] px-3 py-2 sm:block">
      <div className="flex items-center gap-2 text-xs text-blue-100">
        <Gauge className="h-4 w-4" />
        Usage {remaining.toLocaleString("en-GB")} / {appUser.tokensLimit.toLocaleString("en-GB")}
      </div>
      <Progress value={(remaining / appUser.tokensLimit) * 100} className="mt-2 w-32" />
    </div>
  );
}

function UsagePanel({ className }: { className?: string }) {
  const used = Math.round((appUser.tokensUsed / appUser.tokensLimit) * 100);
  return (
    <div className={cn("rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{appUser.plan}</p>
          <p className="mt-1 text-xs text-slate-500">Resets {appUser.resetDate}</p>
        </div>
        <WalletCards className="h-5 w-5 text-blue-200" />
      </div>
      <Progress value={100 - used} className="mt-4" />
      <p className="mt-2 text-xs text-slate-400">{remainingTokens()} / {appUser.tokensLimit.toLocaleString("en-GB")} tokens left</p>
    </div>
  );
}

function remainingTokens() {
  return (appUser.tokensLimit - appUser.tokensUsed).toLocaleString("en-GB");
}

function MiniUsage({ label, used, limit }: { label: string; used: number; limit: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold">{used} / {limit}</p>
      <Progress value={100 - (used / limit) * 100} className="mt-2" />
    </div>
  );
}

function UsageBars() {
  return (
    <div className="space-y-4">
      <MiniUsage label="Tokens" used={appUser.tokensUsed} limit={appUser.tokensLimit} />
      <MiniUsage label="Scans" used={appUser.scansUsed} limit={appUser.scansLimit} />
      <MiniUsage label="Searches" used={appUser.searchesUsed} limit={appUser.searchesLimit} />
    </div>
  );
}

function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/[0.08]", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-indigo-400" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "teal" }) {
  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
      tone === "blue" && "border-blue-200/20 bg-blue-400/10 text-blue-100",
      tone === "teal" && "border-teal-200/20 bg-teal-400/10 text-teal-100",
      tone === "neutral" && "border-white/[0.08] bg-white/[0.04] text-slate-300",
    )}>
      {children}
    </span>
  );
}

function GlowButton({ children, className, onClick, type = "button" }: { children: React.ReactNode; className?: string; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} className={cn("min-h-11 rounded-xl border border-blue-200/25 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(36,107,253,.2)] transition duration-200 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300", className)}>{children}</button>
  );
}

function GhostButton({ children, onClick, type = "button", className }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string }) {
  return (
    <button type={type} onClick={onClick} className={cn("min-h-11 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300", className)}>
      {children}
    </button>
  );
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-2.5 py-2 text-xs font-semibold text-slate-200 hover:border-blue-200/20 hover:bg-white/[0.06]">
      {children}
    </button>
  );
}

function EmptyState({ title, copy, action, onAction }: { title: string; copy: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] p-4 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{copy}</p>
      {action ? <GhostButton className="mt-3" onClick={onAction}>{action}</GhostButton> : null}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#060911] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08]" aria-label="Close modal"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed bottom-24 right-5 z-[90] max-w-sm rounded-2xl border border-blue-200/20 bg-[#07111f]/95 p-4 text-sm shadow-[0_0_50px_rgba(36,107,253,.22)] backdrop-blur md:bottom-5" role="status" aria-live="polite">
      <p className="font-semibold text-blue-50">{toast.title}</p>
      {toast.detail ? <p className="mt-1 text-slate-300">{toast.detail}</p> : null}
    </motion.div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">{children}</span>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-200/40" />;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <FieldLabel>{label}</FieldLabel>
      <input value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} type="number" className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm outline-none focus:border-blue-200/40" />
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<string | [string, string]> }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#08101d] px-3 text-sm outline-none focus:border-blue-200/40">
      {options.map((option) => {
        const optionValue = Array.isArray(option) ? option[0] : option;
        const label = Array.isArray(option) ? option[1] : option;
        return <option key={optionValue} value={optionValue}>{label}</option>;
      })}
    </select>
  );
}

function Toggle({ label, checked, onChange, compact = false }: { label?: string; checked: boolean; onChange: (checked: boolean) => void; compact?: boolean }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={cn("flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] text-sm", compact ? "px-2 py-1" : "w-full px-4 py-3")}>
      {label ? <span>{label}</span> : null}
      <span className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-blue-500" : "bg-white/[0.1]")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function InputPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ConnectionCard({ name, status, detail }: { name: string; status: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{name}</p>
        <Badge tone={status === "Connected" ? "blue" : "neutral"}>{status}</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
