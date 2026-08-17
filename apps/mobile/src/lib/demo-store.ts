import { Platform } from "react-native";
import type { PosterWithChildren } from "./posters";

const STORAGE_KEY = "demo-posters";
const STORAGE_VERSION_KEY = "demo-posters-version";
const CURRENT_VERSION = 3; // Increment this when demo data structure changes

// Demo page visual data for each demo poster
export const DEMO_PAGES_DATA: Record<string, {
  brand: string;
  headline: string;
  bgColor: string;
  specs: { label: string; value: string }[];
  footer: string;
  iscover?: boolean;
  subtitle?: string;
  japanese?: string;
}> = {
  "demo-0": {
    brand: "JDM PERFORMANCE TUNER",
    headline: "MIDSHIP MADNESS!\nTRACK-READY SPYDER",
    bgColor: "#d4a017",
    iscover: true,
    subtitle: "YELLOW STORM",
    japanese: "黄色い嵐",
    specs: [
      { label: "YEAR", value: "1999 MR2 Spyder" },
      { label: "ENGINE", value: "1ZZ-FE 1.8L" },
      { label: "SUSPENSION", value: "BC Racing" },
      { label: "WHEELS", value: "Enkei RPF1" },
      { label: "POWER", value: "138 WHP" },
    ],
    footer: "CANYON CARVER • WEEKEND WARRIOR",
  },
  "demo-1": {
    brand: "BUILDSHEET",
    headline: "SUSPENSION\nSPEC SHEET",
    bgColor: "#1a1a2e",
    specs: [
      { label: "COILOVERS", value: "BC Racing BR Series" },
      { label: "SPRING RATE F", value: "10K" },
      { label: "SPRING RATE R", value: "8K" },
      { label: "SWAY BAR", value: "Whiteline 22mm" },
      { label: "END LINKS", value: "Cusco Adjustable" },
    ],
    footer: "TRACK READY • STREET COMPLIANT",
  },
  "demo-2": {
    brand: "BUILDSHEET",
    headline: "WHEEL &\nTIRE SETUP",
    bgColor: "#2d1f3d",
    specs: [
      { label: "WHEELS", value: "Enkei RPF1 17x9" },
      { label: "OFFSET", value: "+35mm" },
      { label: "TIRES", value: "Advan A052 255/40" },
      { label: "LUG NUTS", value: "Muteki SR48" },
      { label: "SPACERS", value: "15mm Rear" },
    ],
    footer: "LIGHTWEIGHT • AGGRESSIVE",
  },
  "demo-3": {
    brand: "BUILDSHEET",
    headline: "ENGINE\nMODIFICATIONS",
    bgColor: "#3d1f1f",
    specs: [
      { label: "INTAKE", value: "AEM Cold Air" },
      { label: "EXHAUST", value: "Borla Cat-Back" },
      { label: "HEADER", value: "PPE Headers" },
      { label: "TUNE", value: "Custom Dyno" },
      { label: "POWER", value: "+45 WHP" },
    ],
    footer: "NATURALLY ASPIRATED • RELIABLE",
  },
};

// Initial demo posters - 4 varied pages (cover + 3 spec sheets)
const INITIAL_DEMO_POSTERS: PosterWithChildren[] = [
  {
    id: "demo-0",
    car_id: "demo",
    template_id: null,
    facet: "overall",
    image_url: null,
    image_source: null,
    display_order: 0,
    created_at: new Date().toISOString(),
    callouts: [],
    template: null,
  },
  {
    id: "demo-1",
    car_id: "demo",
    template_id: null,
    facet: "suspension",
    image_url: null,
    image_source: null,
    display_order: 1,
    created_at: new Date().toISOString(),
    callouts: [],
    template: null,
  },
  {
    id: "demo-2",
    car_id: "demo",
    template_id: null,
    facet: "wheels",
    image_url: null,
    image_source: null,
    display_order: 2,
    created_at: new Date().toISOString(),
    callouts: [],
    template: null,
  },
  {
    id: "demo-3",
    car_id: "demo",
    template_id: null,
    facet: "engine",
    image_url: null,
    image_source: null,
    display_order: 3,
    created_at: new Date().toISOString(),
    callouts: [],
    template: null,
  },
];

// For backwards compatibility
export const DEMO_POSTER = INITIAL_DEMO_POSTERS[0];

// Load from localStorage if available (web only)
function loadFromStorage(): PosterWithChildren[] {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      // Check version - if outdated, reset to fresh demo data
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (storedVersion !== String(CURRENT_VERSION)) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
        return INITIAL_DEMO_POSTERS;
      }
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignore errors
    }
  }
  return INITIAL_DEMO_POSTERS;
}

// Save to localStorage (web only)
function saveToStorage(posters: PosterWithChildren[]) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posters));
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
    } catch (e) {
      // Ignore errors
    }
  }
}

// In-memory store for demo posters created during the session
let demoPosters: PosterWithChildren[] = loadFromStorage();
let listeners: (() => void)[] = [];

let cachedPosters: PosterWithChildren[] = demoPosters;

export function getDemoPosters(): PosterWithChildren[] {
  return cachedPosters;
}

export function addDemoPoster(facet: string, imageUrl?: string | null): PosterWithChildren {
  const newPoster: PosterWithChildren = {
    id: `demo-${Date.now()}`,
    car_id: "demo",
    template_id: null,
    facet,
    image_url: imageUrl ?? null,
    image_source: imageUrl ? "upload" : null,
    display_order: demoPosters.length,
    created_at: new Date().toISOString(),
    callouts: [],
    template: null,
  };
  
  demoPosters = [...demoPosters, newPoster];
  cachedPosters = demoPosters;
  saveToStorage(demoPosters);
  notifyListeners();
  return newPoster;
}

export function removeDemoPoster(posterId: string): void {
  demoPosters = demoPosters.filter((p) => p.id !== posterId);
  cachedPosters = demoPosters;
  saveToStorage(demoPosters);
  notifyListeners();
}

export function reorderDemoPosters(posterIds: string[]): void {
  const reordered = posterIds
    .map((id) => demoPosters.find((p) => p.id === id))
    .filter(Boolean) as PosterWithChildren[];
  demoPosters = reordered;
  cachedPosters = demoPosters;
  saveToStorage(demoPosters);
  notifyListeners();
}

export function subscribeToDemoPosters(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyListeners() {
  listeners.forEach((l) => l());
}
