export type AppDeal = {
  id: string;
  title: string;
  image: string;
  marketplace: "Facebook" | "eBay" | "Instant Buyer";
  category: string;
  location: string;
  age: string;
  cost: number;
  resale: number;
  fees: number;
  profit: number;
  roi: number;
  risk: "Low" | "Medium" | "High";
  rating: "Exceptional Buy" | "Strong Buy" | "Possible Buy" | "Risky" | "Avoid";
  demand: string;
  listingUrl?: string;
  rejectionReason?: string;
  buyer?: string;
  payout?: number;
  payoutSpeed?: string;
};

export const appUser = {
  plan: "Starter",
  tokensUsed: 0,
  tokensLimit: 10000,
  scansUsed: 0,
  scansLimit: 50,
  searchesUsed: 0,
  searchesLimit: 400,
  resetDate: "monthly",
};

export const appDeals: AppDeal[] = [
  {
    id: "macbook-m2",
    title: "MacBook Air M2",
    image: "https://i.ebayimg.com/images/g/f5EAAeSwws5qa22S/s-l500.jpg",
    marketplace: "Facebook",
    category: "Laptops",
    location: "London",
    age: "18 min",
    cost: 410,
    resale: 610,
    fees: 58,
    profit: 142,
    roi: 35,
    risk: "Low",
    rating: "Exceptional Buy",
    demand: "Very high",
  },
  {
    id: "dyson-airwrap",
    title: "Dyson Airwrap Complete",
    image: "https://i.ebayimg.com/images/g/pGAAAeSweFppwAVx/s-l500.jpg",
    marketplace: "Facebook",
    category: "Wearables & GPS",
    location: "Hove",
    age: "31 min",
    cost: 180,
    resale: 305,
    fees: 38,
    profit: 87,
    roi: 48,
    risk: "Medium",
    rating: "Strong Buy",
    demand: "High",
  },
  {
    id: "sony-xm5",
    title: "Sony WH-1000XM5",
    image: "https://i.ebayimg.com/images/g/NPQAAeSw6z1qeend/s-l500.jpg",
    marketplace: "Facebook",
    category: "Audio",
    location: "Brighton",
    age: "12 min",
    cost: 115,
    resale: 225,
    fees: 28,
    profit: 82,
    roi: 71,
    risk: "Low",
    rating: "Exceptional Buy",
    demand: "High",
  },
  {
    id: "switch-oled",
    title: "Nintendo Switch OLED",
    image: "https://i.ebayimg.com/images/g/0c4AAeSwY5dqexwU/s-l500.jpg",
    marketplace: "eBay",
    category: "Handhelds & VR",
    location: "UK",
    age: "24 min",
    cost: 140,
    resale: 215,
    fees: 23,
    profit: 52,
    roi: 37,
    risk: "Medium",
    rating: "Strong Buy",
    demand: "Very high",
  },
  {
    id: "canon-r10",
    title: "Canon EOS R10",
    image: "https://i.ebayimg.com/images/g/ZlAAAeSwC-Fqey8M/s-l500.jpg",
    marketplace: "eBay",
    category: "Cameras & Lenses",
    location: "UK",
    age: "43 min",
    cost: 420,
    resale: 590,
    fees: 52,
    profit: 118,
    roi: 28,
    risk: "Low",
    rating: "Strong Buy",
    demand: "High",
  },
  {
    id: "road-bike",
    title: "Planet X Carbon Road Frameset",
    image: "https://i.ebayimg.com/images/g/8~0AAeSwpoNqeyl5/s-l500.jpg",
    marketplace: "eBay",
    category: "Bikes & E-bikes",
    location: "UK",
    age: "1 hr",
    cost: 80,
    resale: 370,
    fees: 48,
    profit: 242,
    roi: 303,
    risk: "High",
    rating: "Exceptional Buy",
    demand: "Active",
  },
];

export const instantBuyerDeals: AppDeal[] = [
  {
    ...appDeals[2],
    id: "sony-xm5-instant",
    marketplace: "Instant Buyer",
    buyer: "CEX",
    payout: 168,
    payoutSpeed: "Same day",
    profit: 31,
    roi: 27,
  },
  {
    ...appDeals[0],
    id: "macbook-instant",
    marketplace: "Instant Buyer",
    buyer: "Back Market",
    payout: 545,
    payoutSpeed: "2-4 days",
    profit: 77,
    roi: 19,
  },
  {
    ...appDeals[3],
    id: "switch-instant",
    marketplace: "Instant Buyer",
    buyer: "musicMagpie",
    payout: 186,
    payoutSpeed: "2 days",
    profit: 24,
    roi: 17,
  },
];

export const crmColumns = [
  { title: "Watching", dealIds: ["sony-xm5", "canon-r10"] },
  { title: "Contacted", dealIds: ["dyson-airwrap"] },
  { title: "Purchased", dealIds: ["macbook-m2"] },
  { title: "Listed", dealIds: ["switch-oled"] },
  { title: "Sold", dealIds: ["road-bike"] },
];

export const tasks = [
  { title: "Message seller about Sony accessories", deal: "Sony WH-1000XM5", due: "Today" },
  { title: "Photograph MacBook for listing", deal: "MacBook Air M2", due: "Tomorrow" },
  { title: "Check CEX payout terms", deal: "Nintendo Switch OLED", due: "Today" },
];

export const marketplaceConnections = [
  { name: "eBay", status: "Connected", detail: "Ready for listing drafts" },
  { name: "Facebook Marketplace", status: "Not connected", detail: "Finder only" },
  { name: "Vinted", status: "Coming soon", detail: "Draft support planned" },
  { name: "Depop", status: "Coming soon", detail: "Draft support planned" },
  { name: "Gumtree", status: "Coming soon", detail: "Research only" },
];

export const analytics = {
  potentialProfit: 723,
  realisedProfit: 286,
  averageRoi: 48,
  dealsInProgress: 12,
  soldThisMonth: 5,
  bestCategory: "Electronics",
};
