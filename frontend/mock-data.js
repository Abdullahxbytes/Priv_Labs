/**
 * PrivacyLens — Official Mock Data Fixture & Contracts
 * Strictly adheres to frozen fields in docs/API_CONTRACT.md and docs/FRONTEND_HANDOFF.md.
 *
 * FROZEN FIELDS (11 top-level fields):
 * - app: App metadata (appId, name, developer, icon, rating, category, storeUrl).
 * - score: Deterministically calculated backend privacy score (0-100).
 * - riskLevel: "LOW" | "MODERATE" | "HIGH" | "VERY HIGH".
 * - sourceStatus: { permissions, dataSafety, privacyPolicy, aiAnalysis }
 *                 ("available" | "unavailable" | "failed" | "cached")
 * - permissions: Requested capabilities and neutral explanations.
 * - dataCollected: Data collection findings from disclosures.
 * - dataShared: Data sharing findings with third parties.
 * - mismatches: Possible inconsistencies between declarations.
 * - positiveFindings: Documented privacy protections (encryption, deletion, etc.).
 * - summary: 3-5 consumer-friendly summary bullet points.
 * - evidence: Verifiable excerpts and source references.
 */

export const mockSearchResults = [
  {
    appId: "com.spotify.music",
    name: "Spotify: Music and Podcasts",
    title: "Spotify: Music and Podcasts",
    developer: "Spotify AB",
    category: "Music & Audio",
    rating: 4.4,
    icon: "https://play-lh.googleusercontent.com/IzQgYCcnCFCD08GR-3bdtcT8xzOvrNkC84avGT5CwTX2VIqmTmKKJcP_Cd4JoBOdmCMlTndlOzV6hrthg2fOWA",
  },
  {
    appId: "com.spotify.tv.android",
    name: "Spotify: Music & Podcasts for Android TV",
    title: "Spotify: Music & Podcasts for Android TV",
    developer: "Spotify AB",
    category: "Music & Audio",
    rating: 3.9,
    icon: "https://play-lh.googleusercontent.com/7ghCqs4kKYrQpTECddnejlSeAXgpdiiKlIghuDR869MpF5msXdPsd3gqjC6lstD_NfJkmP0LAUJTty7UACcrLw",
  },
  {
    appId: "fm.anchor.android",
    name: "Spotify for Creators",
    title: "Spotify for Creators",
    developer: "Spotify AB",
    category: "Podcasts & Creation",
    rating: 3.7,
    icon: "https://play-lh.googleusercontent.com/LsJlnsamYWU2b65Jv47LjqbzJgfLTui6WZr35WT8-iiUY_ujGEz-CrE-YdmT6O6WiREKvAP3W4QdMxAAICkv3DM",
  },
  {
    appId: "com.spotify.s4a",
    name: "Spotify for Artists",
    title: "Spotify for Artists",
    developer: "Spotify AB",
    category: "Business",
    rating: 3.5,
    icon: "https://play-lh.googleusercontent.com/wCwpVbMQLgoGMLyH8ouQUdWsq9W6-kpDPnwM-RteYiNQScIKE9h_Dzza8vCwMlQEzGkt90NqlkK_tygXlwWrwQ",
  },
  {
    appId: "com.spotify.kids",
    name: "Spotify Kids",
    title: "Spotify Kids",
    developer: "Spotify AB",
    category: "Parenting / Kids",
    rating: 2.7,
    icon: "https://play-lh.googleusercontent.com/eHoIAThfti0VN4XgyTcfckOMApiY1ZADrpm3YxYJGWrz04p8Rrq5wrofFFZHANDC6qLAZI5MqQUPKYiJ0bAmwrw",
  },
  {
    appId: "org.thoughtcrime.securesms",
    name: "Signal Private Messenger",
    title: "Signal Private Messenger",
    developer: "Signal Foundation",
    category: "Communication",
    rating: 4.8,
    icon: "https://play-lh.googleusercontent.com/fL5nK5_G3sWl6j42N9jR1yq_mX1XlS9aB0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z=w240-h480-rw",
  },
];

export const mockPrivacyReport = {
  app: {
    appId: "com.spotify.music",
    name: "Spotify: Music and Podcasts",
    title: "Spotify: Music and Podcasts",
    developer: "Spotify AB",
    category: "Music & Audio",
    rating: 4.3,
    icon: "https://play-lh.googleusercontent.com/IzQgYCcnCFCD08GR-3bdtcT8xzOvrNkC84avGT5CwTX2VIqmTmKKJcP_Cd4JoBOdmCMlTndlOzV6hrthg2fOWA",
    storeUrl: "https://play.google.com/store/apps/details?id=com.spotify.music",
  },
  score: 74,
  riskLevel: "MODERATE", // "LOW" | "MODERATE" | "HIGH" | "VERY HIGH"
  sourceStatus: {
    permissions: "available",
    dataSafety: "available",
    privacyPolicy: "available",
    aiAnalysis: "available",
  },
  summary: [
    "The app requests precise location access, but store declarations describe approximate location only.",
    "Data collection for advertising and personalized recommendations is disclosed in the privacy policy.",
    "Information may be shared with third-party advertising and analytics partners.",
    "User account and personal data deletion mechanisms are documented and available.",
  ],
  mismatches: [
    {
      id: "mismatch-1",
      type: "PERMISSION_DISCLOSURE_MISMATCH",
      severity: "MODERATE",
      title: "Precise Location Not Clearly Disclosed in Data Safety",
      explanation:
        "The app requests ACCESS_FINE_LOCATION capable of accessing exact GPS coordinates, but Google Play Data Safety declarations disclose approximate location only.",
      sources: ["permissions", "dataSafety", "privacyPolicy"],
      evidenceIds: ["evidence-1"],
    },
  ],
  permissions: [
    {
      raw: "android.permission.ACCESS_FINE_LOCATION",
      name: "Precise Location",
      category: "location",
      risk: "HIGH",
      expected: false,
      explanation: "Allows the app to read exact satellite GPS coordinates down to a few meters.",
    },
    {
      raw: "android.permission.RECORD_AUDIO",
      name: "Microphone Access",
      category: "microphone",
      risk: "MODERATE",
      expected: true,
      explanation: "Allows capturing audio when voice search is actively tapped.",
    },
    {
      raw: "android.permission.BLUETOOTH_CONNECT",
      name: "Nearby Devices",
      category: "nearby_devices",
      risk: "LOW",
      expected: true,
      explanation: "Connects to wireless headphones, smart speakers, and car receivers.",
    },
    {
      raw: "android.permission.READ_PHONE_STATE",
      name: "Phone State",
      category: "phone",
      risk: "LOW",
      expected: true,
      explanation: "Detects incoming calls to pause music playback automatically.",
    },
    {
      raw: "android.permission.READ_MEDIA_IMAGES",
      name: "Photos & Media",
      category: "photos",
      risk: "LOW",
      expected: true,
      explanation: "Accesses stored images when you upload a playlist cover or scan a music code.",
    },
    {
      raw: "android.permission.FOREGROUND_SERVICE",
      name: "Background Playback",
      category: "system",
      risk: "LOW",
      expected: true,
      explanation: "Allows audio streaming continuously when your screen is locked.",
    },
  ],
  dataCollected: [
    {
      type: "personal_information",
      label: "Personal Information",
      purposes: ["Account functionality", "Communication"],
      source: ["dataSafety"],
      status: "found",
    },
    {
      type: "location",
      label: "Location Information",
      purposes: ["Regional music licensing", "Localized advertising"],
      source: ["privacyPolicy"],
      status: "found",
    },
    {
      type: "app_activity",
      label: "App Activity & Audio Queries",
      purposes: ["Voice search functionality", "Personalized recommendations"],
      source: ["privacyPolicy"],
      status: "found",
    },
    {
      type: "device_identifiers",
      label: "Device Identifiers & Diagnostics",
      purposes: ["Crash reporting", "Fraud prevention", "Analytics"],
      source: ["dataSafety"],
      status: "found",
    },
  ],
  dataShared: [
    {
      type: "device_identifiers",
      label: "Device & Advertising Identifiers",
      recipients: ["Advertising Partners", "Analytics Providers"],
      purposes: ["Cross-service advertising measurement", "Ad campaign optimization"],
      source: ["privacyPolicy"],
      status: "found",
    },
    {
      type: "personal_information",
      label: "General Demographics & Country Code",
      recipients: ["Content Partners", "Music Labels"],
      purposes: ["Royalty calculations", "Regional licensing compliance"],
      source: ["dataSafety"],
      status: "found",
    },
    {
      type: "diagnostics",
      label: "Crash Diagnostics",
      recipients: ["Cloud Infrastructure Providers"],
      purposes: ["Stability monitoring", "Bug remediation"],
      source: ["dataSafety"],
      status: "found",
    },
  ],
  positiveFindings: [
    {
      id: "positive-1",
      title: "Data Encrypted in Transit",
      explanation:
        "Data sent between your phone and company servers uses modern encryption (TLS/HTTPS).",
      evidenceIds: ["evidence-2"],
    },
    {
      id: "positive-2",
      title: "Data Deletion Available",
      explanation:
        "The company provides a documented pathway for users to permanently delete their account and personal information.",
      evidenceIds: ["evidence-3"],
    },
    {
      id: "positive-3",
      title: "No Contacts or SMS Permissions",
      explanation:
        "The application does not request access to read your personal address book contacts or SMS text messages.",
      evidenceIds: [],
    },
  ],
  evidence: [
    {
      id: "evidence-1",
      source: "privacyPolicy",
      category: "location",
      status: "found",
      excerpt:
        "We may collect and use your precise location data (such as GPS, Wi-Fi access points, and cell tower signals) to provide location-specific advertising, concert recommendations, and regional content availability.",
      sourceUrl: "https://www.spotify.com/us/legal/privacy-policy/",
    },
    {
      id: "evidence-2",
      source: "dataSafety",
      category: "security",
      status: "found",
      excerpt: "Data is encrypted in transit using industry-standard protocols.",
      sourceUrl: null,
    },
    {
      id: "evidence-3",
      source: "privacyPolicy",
      category: "deletion",
      status: "found",
      excerpt:
        "You may request permanent deletion of your account and associated personal data at any time.",
      sourceUrl: "https://www.spotify.com/us/legal/privacy-policy/",
    },
  ],
};

/**
 * Partial report fixture representing an app where privacy policy was unavailable
 * (Demonstrating graceful handling of incomplete/nullable retrieval sources).
 */
export const mockPartialReport = {
  app: {
    appId: "com.example.utility",
    name: "Simple Note Pad",
    title: "Simple Note Pad",
    developer: "Independent Developer",
    category: "Productivity",
    rating: null, // Nullable rating
    icon: null, // Nullable icon (fallback required)
    storeUrl: "https://play.google.com/store/apps/details?id=com.example.utility",
  },
  score: 62,
  riskLevel: "MODERATE",
  sourceStatus: {
    permissions: "available",
    dataSafety: "available",
    privacyPolicy: "unavailable", // Unavailable policy
    aiAnalysis: "unavailable",
  },
  summary: [
    "Privacy policy could not be found or retrieved for this application.",
    "Report is calculated based on Google Play Store declarations and requested app permissions.",
    "The app does not request high-risk permissions such as location or camera.",
    "Missing disclosures are not proof of safety; proceed with standard caution.",
  ],
  mismatches: [
    {
      id: "mismatch-1",
      type: "INSUFFICIENT_INFORMATION",
      severity: null,
      title: "Privacy Policy Unavailable",
      explanation:
        "The developer has not published a reachable privacy policy URL. Analysis is limited to store listing declarations.",
      sources: ["privacyPolicy"],
      evidenceIds: [],
    },
  ],
  permissions: [
    {
      raw: "android.permission.INTERNET",
      name: "Internet Access",
      category: "network",
      risk: "LOW",
      expected: true,
      explanation: "Allows syncing notes with online cloud storage.",
    },
  ],
  dataCollected: [],
  dataShared: [],
  positiveFindings: [
    {
      id: "positive-1",
      title: "No Invasive Permissions Requested",
      explanation: "The app does not request access to location, camera, microphone, or contacts.",
      evidenceIds: [],
    },
  ],
  evidence: [],
};

/**
 * Returns mock report for a given appId, adapting dynamically if needed.
 */
export function getReportForApp(appId, appMeta = {}) {
  let baseReport = JSON.parse(JSON.stringify(mockPrivacyReport));

  if (appId === "com.example.utility" || appId === "partial") {
    return JSON.parse(JSON.stringify(mockPartialReport));
  }

  // Inject known metadata if provided
  if (appMeta.name) baseReport.app.name = appMeta.name;
  if (appMeta.name) baseReport.app.title = appMeta.name;
  if (appMeta.developer !== undefined) baseReport.app.developer = appMeta.developer;
  if (appMeta.icon !== undefined) baseReport.app.icon = appMeta.icon;
  if (appMeta.rating !== undefined) baseReport.app.rating = appMeta.rating;
  if (appMeta.category !== undefined) baseReport.app.category = appMeta.category;
  if (appId) baseReport.app.appId = appId;
  baseReport.app.storeUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId || "com.spotify.music")}`;

  return baseReport;
}
