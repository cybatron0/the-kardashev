// THE KARDASHEV — Core Data Module (improved density + accuracy)

const PRODUCTION_DATA = [
  { country: "United States", code: "US", production: 21.1, lat: 31.0, lng: -100.0 },
  { country: "Saudi Arabia", code: "SA", production: 11.4, lat: 24.0, lng: 45.0 },
  { country: "Russia", code: "RU", production: 10.7, lat: 61.0, lng: 90.0 },
  { country: "Canada", code: "CA", production: 6.2, lat: 56.0, lng: -106.0 },
  { country: "Iran", code: "IR", production: 5.2, lat: 32.0, lng: 53.0 },
  { country: "Iraq", code: "IQ", production: 4.4, lat: 33.0, lng: 44.0 },
  { country: "China", code: "CN", production: 4.3, lat: 35.0, lng: 105.0 },
  { country: "United Arab Emirates", code: "AE", production: 4.2, lat: 24.0, lng: 54.0 },
  { country: "Brazil", code: "BR", production: 3.9, lat: -14.0, lng: -51.0 },
  { country: "Kuwait", code: "KW", production: 2.8, lat: 29.3, lng: 47.5 },
  { country: "Kazakhstan", code: "KZ", production: 2.1, lat: 48.0, lng: 68.0 },
  { country: "Norway", code: "NO", production: 2.0, lat: 62.0, lng: 10.0 },
  { country: "Qatar", code: "QA", production: 1.8, lat: 25.3, lng: 51.2 },
  { country: "Mexico", code: "MX", production: 1.8, lat: 23.0, lng: -102.0 },
  { country: "Nigeria", code: "NG", production: 1.8, lat: 9.0, lng: 8.0 }
];

// All coords are [lat, lng] for Leaflet
const PIPELINES = [
  // ——— OIL ———
  {
    id: "keystone",
    name: "Keystone Pipeline",
    type: "oil",
    status: "operating",
    capacity: "590,000 bpd",
    length: "3,456 km",
    operator: "TC Energy",
    countries: ["Canada", "USA"],
    coords: [
      [50.95, -104.05], [49.0, -104.0], [46.8, -101.5], [44.4, -97.5],
      [41.2, -97.0], [36.1, -95.9], [29.8, -95.0]
    ]
  },
  {
    id: "dakota-access",
    name: "Dakota Access Pipeline",
    type: "oil",
    status: "operating",
    capacity: "570,000 bpd",
    length: "1,886 km",
    operator: "Energy Transfer",
    countries: ["USA"],
    coords: [
      [47.5, -103.5], [46.8, -100.8], [45.5, -97.0], [43.5, -96.0],
      [41.5, -93.5], [40.5, -91.0]
    ]
  },
  {
    id: "trans-mountain",
    name: "Trans Mountain Pipeline",
    type: "oil",
    status: "operating",
    capacity: "890,000 bpd",
    length: "1,150 km",
    operator: "Trans Mountain Corp",
    countries: ["Canada"],
    coords: [
      [53.5, -114.1], [52.9, -117.5], [52.1, -119.3], [50.7, -121.0], [49.3, -122.8]
    ]
  },
  {
    id: "enbridge-mainline",
    name: "Enbridge Mainline",
    type: "oil",
    status: "operating",
    capacity: "2.85 million bpd",
    length: "5,353 km",
    operator: "Enbridge",
    countries: ["Canada", "USA"],
    coords: [
      [53.5, -114.1], [53.5, -110.0], [52.0, -105.0], [49.9, -97.0],
      [48.0, -92.0], [46.5, -86.0], [42.5, -83.5]
    ]
  },
  {
    id: "colonial",
    name: "Colonial Pipeline",
    type: "oil",
    status: "operating",
    capacity: "2.5 million bpd",
    length: "8,850 km (system)",
    operator: "Colonial Pipeline Co.",
    countries: ["USA"],
    coords: [
      [29.8, -95.4], [30.2, -93.2], [30.0, -90.1], [30.7, -86.8],
      [33.8, -84.4], [39.0, -77.0], [40.7, -74.0]
    ]
  },
  {
    id: "druzhba",
    name: "Druzhba Pipeline",
    type: "oil",
    status: "operating",
    capacity: "1.2 million bpd",
    length: "5,327 km",
    operator: "Transneft",
    countries: ["Russia", "Belarus", "Poland", "Germany", "Ukraine", "Czechia", "Hungary"],
    coords: [
      [54.7, 52.3], [53.2, 44.0], [52.3, 37.6], [52.4, 32.0],
      [52.2, 24.0], [52.2, 21.0], [52.5, 14.4]
    ]
  },
  {
    id: "btc",
    name: "Baku–Tbilisi–Ceyhan (BTC)",
    type: "oil",
    status: "operating",
    capacity: "1.2 million bpd",
    length: "1,768 km",
    operator: "BP / SOCAR",
    countries: ["Azerbaijan", "Georgia", "Turkey"],
    coords: [
      [40.4, 49.9], [41.3, 47.5], [41.7, 44.8], [41.6, 41.6],
      [39.5, 36.8], [36.8, 35.3]
    ]
  },
  {
    id: "east-west",
    name: "East-West Pipeline (Petroline)",
    type: "oil",
    status: "operating",
    capacity: "5 million bpd",
    length: "1,200 km",
    operator: "Saudi Aramco",
    countries: ["Saudi Arabia"],
    coords: [
      [26.3, 50.1], [26.0, 47.0], [25.5, 44.0], [24.0, 41.0], [22.5, 38.5]
    ]
  },
  {
    id: "sumed",
    name: "SUMED Pipeline",
    type: "oil",
    status: "operating",
    capacity: "2.5 million bpd",
    length: "320 km",
    operator: "SUMED",
    countries: ["Egypt"],
    coords: [[29.0, 33.0], [30.0, 31.2], [31.2, 29.9]]
  },
  {
    id: "trans-alaska",
    name: "Trans-Alaska Pipeline System",
    type: "oil",
    status: "operating",
    capacity: "2.1 million bpd (design)",
    length: "1,287 km",
    operator: "Alyeska Pipeline",
    countries: ["USA"],
    coords: [
      [70.3, -148.5], [68.0, -149.0], [64.8, -147.7], [61.2, -149.9], [61.1, -146.3]
    ]
  },
  {
    id: "cpc",
    name: "Caspian Pipeline Consortium (CPC)",
    type: "oil",
    status: "operating",
    capacity: "1.4 million bpd",
    length: "1,510 km",
    operator: "CPC",
    countries: ["Kazakhstan", "Russia"],
    coords: [[47.1, 51.9], [45.0, 45.0], [44.7, 37.5]]
  },
  {
    id: "espo",
    name: "Eastern Siberia–Pacific Ocean (ESPO)",
    type: "oil",
    status: "operating",
    capacity: "1.6 million bpd",
    length: "4,857 km",
    operator: "Transneft",
    countries: ["Russia"],
    coords: [
      [56.0, 100.0], [55.0, 110.0], [52.0, 120.0], [48.5, 135.0], [42.8, 132.0]
    ]
  },

  // ——— GAS ———
  {
    id: "nord-stream",
    name: "Nord Stream (legacy)",
    type: "gas",
    status: "damaged/idle",
    capacity: "55 bcm/y",
    length: "1,224 km",
    operator: "Nord Stream AG",
    countries: ["Russia", "Germany"],
    coords: [[60.5, 28.0], [55.5, 15.0], [54.5, 13.5]]
  },
  {
    id: "power-of-siberia",
    name: "Power of Siberia",
    type: "gas",
    status: "operating",
    capacity: "38 bcm/y",
    length: "~3,000 km",
    operator: "Gazprom / CNPC",
    countries: ["Russia", "China"],
    coords: [
      [60.0, 120.0], [55.0, 125.0], [50.0, 127.0], [45.0, 128.0], [40.0, 120.0]
    ]
  },
  {
    id: "yamal-europe",
    name: "Yamal–Europe",
    type: "gas",
    status: "operating",
    capacity: "33 bcm/y",
    length: "4,196 km",
    operator: "Gazprom",
    countries: ["Russia", "Belarus", "Poland", "Germany"],
    coords: [[67.0, 70.0], [55.0, 30.0], [52.5, 20.0], [52.5, 13.5]]
  },
  {
    id: "turkstream",
    name: "TurkStream",
    type: "gas",
    status: "operating",
    capacity: "31.5 bcm/y",
    length: "930 km",
    operator: "Gazprom",
    countries: ["Russia", "Turkey"],
    coords: [[44.5, 36.5], [41.5, 30.0], [41.0, 29.0]]
  },
  {
    id: "blue-stream",
    name: "Blue Stream",
    type: "gas",
    status: "operating",
    capacity: "16 bcm/y",
    length: "1,213 km",
    operator: "Gazprom / BOTAŞ",
    countries: ["Russia", "Turkey"],
    coords: [[44.5, 38.0], [42.0, 35.0], [41.0, 31.0]]
  }
];

const REFINERIES = [
  { id: "jamnagar", name: "Jamnagar Refinery", capacity: "1.24 Mb/d", operator: "Reliance", lat: 22.4, lng: 69.9, country: "India" },
  { id: "paraguana", name: "Paraguaná Complex", capacity: "0.94 Mb/d", operator: "PDVSA", lat: 11.7, lng: -70.2, country: "Venezuela" },
  { id: "ulsan", name: "Ulsan Refinery", capacity: "0.84 Mb/d", operator: "SK Energy", lat: 35.5, lng: 129.3, country: "South Korea" },
  { id: "baytown", name: "Baytown Refinery", capacity: "0.56 Mb/d", operator: "ExxonMobil", lat: 29.7, lng: -95.0, country: "USA" },
  { id: "ras-tanura", name: "Ras Tanura", capacity: "0.55 Mb/d", operator: "Saudi Aramco", lat: 26.7, lng: 50.1, country: "Saudi Arabia" },
  { id: "port-arthur", name: "Port Arthur", capacity: "0.63 Mb/d", operator: "Motiva", lat: 29.9, lng: -93.9, country: "USA" },
  { id: "rotterdam", name: "Pernis (Rotterdam)", capacity: "0.40 Mb/d", operator: "Shell", lat: 51.9, lng: 4.3, country: "Netherlands" },
  { id: "singapore", name: "Singapore Refining", capacity: "0.29 Mb/d", operator: "SRC / Chevron", lat: 1.3, lng: 103.7, country: "Singapore" },
  { id: "yanbu", name: "Yanbu Refinery", capacity: "0.40 Mb/d", operator: "Saudi Aramco", lat: 24.1, lng: 38.1, country: "Saudi Arabia" },
  { id: "gulf-coast", name: "ExxonMobil Baton Rouge", capacity: "0.52 Mb/d", operator: "ExxonMobil", lat: 30.5, lng: -91.2, country: "USA" },
  { id: "daesan", name: "Daesan Complex", capacity: "0.65 Mb/d", operator: "Hyundai", lat: 36.9, lng: 126.4, country: "South Korea" },
  { id: "ningbo", name: "Zhenhai Refinery", capacity: "0.46 Mb/d", operator: "Sinopec", lat: 29.9, lng: 121.6, country: "China" }
];

const FIELDS = [
  { id: "ghawar", name: "Ghawar Field", production: "~3.8 Mb/d", operator: "Saudi Aramco", lat: 25.4, lng: 49.6, country: "Saudi Arabia" },
  { id: "permian", name: "Permian Basin", production: "~6.0 Mb/d", operator: "Multiple", lat: 31.8, lng: -102.0, country: "USA" },
  { id: "burgan", name: "Burgan Field", production: "~1.2 Mb/d", operator: "KOC", lat: 29.0, lng: 47.9, country: "Kuwait" },
  { id: "safaniya", name: "Safaniya", production: "~1.0 Mb/d", operator: "Saudi Aramco", lat: 28.0, lng: 48.8, country: "Saudi Arabia" },
  { id: "cantarell", name: "Cantarell", production: "~0.15 Mb/d", operator: "Pemex", lat: 19.5, lng: -92.0, country: "Mexico" },
  { id: "samotlor", name: "Samotlor", production: "~0.4 Mb/d", operator: "Rosneft", lat: 61.1, lng: 76.7, country: "Russia" },
  { id: "troll", name: "Troll Field", production: "Gas + oil", operator: "Equinor", lat: 60.6, lng: 3.6, country: "Norway" },
  { id: "pre-salt", name: "Brazilian Pre-Salt", production: "~2.5+ Mb/d", operator: "Petrobras+", lat: -24.0, lng: -42.0, country: "Brazil" },
  { id: "eagle-ford", name: "Eagle Ford", production: "~1.1 Mb/d", operator: "Multiple", lat: 28.5, lng: -98.5, country: "USA" },
  { id: "bakken", name: "Bakken", production: "~1.2 Mb/d", operator: "Multiple", lat: 47.8, lng: -103.0, country: "USA" },
  { id: "tengiz", name: "Tengiz", production: "~0.6 Mb/d", operator: "TCO", lat: 46.1, lng: 53.4, country: "Kazakhstan" },
  { id: "kirkuk", name: "Kirkuk Fields", production: "~0.3 Mb/d", operator: "NOC / KRG", lat: 35.5, lng: 44.4, country: "Iraq" }
];

const POWER_PLANTS = [
  { id: "three-gorges", name: "Three Gorges Dam", capacity: "22.5 GW", type: "Hydro", lat: 30.8, lng: 111.0, country: "China" },
  { id: "itaipu", name: "Itaipu", capacity: "14 GW", type: "Hydro", lat: -25.4, lng: -54.6, country: "Brazil/Paraguay" },
  { id: "kashiwazaki", name: "Kashiwazaki-Kariwa", capacity: "8.2 GW", type: "Nuclear", lat: 37.4, lng: 138.6, country: "Japan" },
  { id: "bruce", name: "Bruce Nuclear", capacity: "6.4 GW", type: "Nuclear", lat: 44.3, lng: -81.6, country: "Canada" },
  { id: "taishan", name: "Taishan Nuclear", capacity: "3.5 GW", type: "Nuclear", lat: 21.9, lng: 112.9, country: "China" },
  { id: "grand-coulee", name: "Grand Coulee", capacity: "6.8 GW", type: "Hydro", lat: 47.96, lng: -118.98, country: "USA" },
  { id: "hanul", name: "Hanul Nuclear", capacity: "5.9 GW", type: "Nuclear", lat: 37.1, lng: 129.4, country: "South Korea" },
  { id: "zaporizhzhia", name: "Zaporizhzhia", capacity: "5.7 GW", type: "Nuclear", lat: 47.5, lng: 34.6, country: "Ukraine" }
];

const SAMPLE_HISTORY = {
  "United States": [12.5, 13.2, 15.0, 16.5, 18.0, 19.5, 20.4, 21.1],
  "Saudi Arabia": [10.2, 10.8, 11.0, 10.5, 11.2, 10.9, 11.0, 11.4],
  "Russia": [10.5, 10.8, 10.9, 10.6, 11.0, 10.8, 10.7, 10.7],
  "Canada": [4.0, 4.3, 4.6, 4.9, 5.3, 5.7, 5.9, 6.2],
  "default": [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7]
};

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];