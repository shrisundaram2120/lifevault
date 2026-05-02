const USERS_STORAGE_KEY = "lifevault-users-v1";
const LEGACY_STORAGE_KEYS = ["lifevault-data-v2", "lifevault-data-v1"];
const DEFAULT_PASSCODE = "1234";
const DEFAULT_GMAIL = "user@gmail.com";

const portalDefinitions = [
  { key: "diary", title: "Diary Portal", detail: "Book pages", accent: "accent-diary" },
  { key: "future", title: "Future Message Portal", detail: "Locked messages", accent: "accent-future" },
  { key: "legacy", title: "Legacy Instruction Portal", detail: "Asset instructions", accent: "accent-legacy" },
  { key: "memory", title: "Memory Portal", detail: "Memory cards", accent: "accent-memory" },
  { key: "goals", title: "Goal Portal", detail: "Progress tracker", accent: "accent-goals" },
];

const legacyAssetConfigs = {
  land: {
    label: "Land",
    fields: [
      ["location", "Land Location", "input"],
      ["size", "Total Acres / Cents / Sq.ft", "input"],
      ["surveyNumber", "Survey Number", "input"],
      ["owner", "Current Owner Name", "input"],
      ["shareCount", "How Many People Should Receive a Share?", "input"],
      ["beneficiaries", "Family Members / Beneficiaries", "textarea"],
      ["shareDistribution", "Share Percentage or Amount", "textarea"],
      ["conditions", "Additional Conditions or Instructions", "textarea"],
    ],
  },
  house: {
    label: "House",
    fields: [
      ["address", "House Location / Address", "textarea"],
      ["owner", "Current Owner Name", "input"],
      ["recipient", "Who Should Receive It?", "textarea"],
      ["shareDistribution", "Share Percentage for Each Family Member", "textarea"],
      ["maintenance", "Maintenance or Selling Instructions", "textarea"],
      ["notes", "Additional Notes", "textarea"],
    ],
  },
  property: {
    label: "Property",
    fields: [
      ["propertyType", "Property Type", "input"],
      ["location", "Location", "input"],
      ["value", "Value Estimate", "input"],
      ["beneficiaries", "Beneficiaries", "textarea"],
      ["shareDistribution", "Share Distribution", "textarea"],
      ["conditions", "Conditions", "textarea"],
    ],
  },
  item: {
    label: "Item",
    fields: [
      ["itemName", "Item Name", "input"],
      ["description", "Item Description", "textarea"],
      ["recipient", "Who Should Receive It?", "input"],
      ["reason", "Reason / Sentimental Value", "textarea"],
      ["instructions", "Special Instructions", "textarea"],
    ],
  },
  vehicle: {
    label: "Vehicle",
    fields: [
      ["vehicleName", "Vehicle Name / Model", "input"],
      ["number", "Registration Number", "input"],
      ["owner", "Current Owner Name", "input"],
      ["recipient", "Who Should Receive It?", "input"],
      ["instructions", "Transfer / Maintenance Instructions", "textarea"],
    ],
  },
  jewellery: {
    label: "Jewellery",
    fields: [
      ["description", "Jewellery Description", "textarea"],
      ["location", "Where It Is Kept", "input"],
      ["recipient", "Who Should Receive It?", "input"],
      ["reason", "Reason / Sentimental Value", "textarea"],
      ["instructions", "Special Instructions", "textarea"],
    ],
  },
  bank: {
    label: "Bank / Account Note",
    fields: [
      ["noteType", "Note Type", "input"],
      ["institution", "Bank / Institution Name", "input"],
      ["nominee", "Nominee / Trusted Person", "input"],
      ["instruction", "Instruction Note", "textarea"],
      ["caution", "Caution / Privacy Notes", "textarea"],
    ],
  },
  other: {
    label: "Other",
    fields: [
      ["belongingName", "Belonging Name", "input"],
      ["description", "Description", "textarea"],
      ["recipient", "Who Should Receive It?", "input"],
      ["instructions", "Instructions", "textarea"],
    ],
  },
};

const emptyVault = {
  emergency: {
    fullName: "",
    bloodGroup: "",
    allergies: "",
    medicalNotes: "",
    contactName: "",
    contactPhone: "",
    routine: "",
  },
  diaryProfile: null,
  diaryPages: [],
  futureMessages: [],
  legacyRecords: [],
  memories: [],
  goals: [],
};

let portal = loadPortal();
let activeEmail = portal.lastEmail || "";
let vault = getActiveAccount()?.vault || structuredClone(emptyVault);
let authMode = getActiveAccount() ? "login" : "join";
let activeSection = "dashboard";
let diaryPageIndex = 0;
let goalSuggestionDraft = [];

const lockScreen = document.getElementById("lockScreen");
const vaultScreen = document.getElementById("vaultScreen");
const unlockForm = document.getElementById("unlockForm");
const emergencyAccessBtn = document.getElementById("emergencyAccessBtn");
const authModeLabel = document.getElementById("authModeLabel");
const authTitle = document.getElementById("authTitle");
const rememberedUserBox = document.getElementById("rememberedUserBox");
const joinFields = document.getElementById("joinFields");
const nameInput = document.getElementById("nameInput");
const gmailInput = document.getElementById("gmailInput");
const secretTypeInput = document.getElementById("secretTypeInput");
const secretLabel = document.getElementById("secretLabel");
const passcodeInput = document.getElementById("passcodeInput");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const switchAuthBtn = document.getElementById("switchAuthBtn");
const authMessage = document.getElementById("authMessage");
const lockBtn = document.getElementById("lockBtn");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const sectionTitle = document.getElementById("sectionTitle");
const todayText = document.getElementById("todayText");
const recordCountText = document.getElementById("recordCountText");
const emergencyDialog = document.getElementById("emergencyDialog");
const emergencyDialogContent = document.getElementById("emergencyDialogContent");
const closeEmergencyDialog = document.getElementById("closeEmergencyDialog");

const sections = {
  dashboard: document.getElementById("dashboardSection"),
  emergency: document.getElementById("emergencySection"),
  diary: document.getElementById("diarySection"),
  future: document.getElementById("futureSection"),
  legacy: document.getElementById("legacySection"),
  memory: document.getElementById("memorySection"),
  goals: document.getElementById("goalsSection"),
  insights: document.getElementById("insightsSection"),
};

const sectionNames = {
  dashboard: "Overview",
  emergency: "Emergency",
  diary: "Diary Portal",
  future: "Future Message Portal",
  legacy: "Legacy Instruction Portal",
  memory: "Memory Portal",
  goals: "Goal Portal",
  insights: "Insights",
};

function loadPortal() {
  const saved = localStorage.getItem(USERS_STORAGE_KEY);

  if (saved) {
    try {
      return normalizePortal(JSON.parse(saved));
    } catch {
      return createEmptyPortal();
    }
  }

  const legacyVault = loadLegacyVault();
  if (!legacyVault) {
    return createEmptyPortal();
  }

  const portalData = createEmptyPortal();
  portalData.users[DEFAULT_GMAIL] = {
    name: "LifeVault User",
    gmail: DEFAULT_GMAIL,
    secretType: "passcode",
    secret: legacyVault.passcode || DEFAULT_PASSCODE,
    vault: normalizeVault(legacyVault),
  };
  portalData.lastEmail = DEFAULT_GMAIL;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(portalData));
  return portalData;
}

function createEmptyPortal() {
  return { lastEmail: "", users: {} };
}

function normalizePortal(saved) {
  const portalData = createEmptyPortal();
  portalData.lastEmail = saved.lastEmail || "";

  Object.values(saved.users || {}).forEach((user) => {
    if (!user.gmail) {
      return;
    }

    const gmail = user.gmail.trim().toLowerCase();
    portalData.users[gmail] = {
      name: user.name || "LifeVault User",
      gmail,
      secretType: user.secretType || "passcode",
      secret: user.secret || DEFAULT_PASSCODE,
      vault: normalizeVault(user.vault || emptyVault),
    };
  });

  if (!portalData.users[portalData.lastEmail]) {
    portalData.lastEmail = Object.keys(portalData.users)[0] || "";
  }

  return portalData;
}

function loadLegacyVault() {
  for (const key of LEGACY_STORAGE_KEYS) {
    const saved = localStorage.getItem(key);
    if (!saved) {
      continue;
    }

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeVault(saved) {
  const normalized = structuredClone(emptyVault);
  normalized.emergency = { ...normalized.emergency, ...(saved.emergency || {}) };
  normalized.diaryProfile = saved.diaryProfile ? normalizeDiaryProfile(saved.diaryProfile) : null;
  normalized.diaryPages = (saved.diaryPages || []).map(normalizeDiaryPage);
  normalized.futureMessages = (saved.futureMessages || []).map(normalizeFutureMessage);
  normalized.legacyRecords = (saved.legacyRecords || []).map(normalizeLegacyRecord);
  normalized.memories = (saved.memories || []).map(normalizeMemory);
  normalized.goals = (saved.goals || []).map(normalizeGoal);

  const hasNewPortalData = [
    normalized.diaryPages,
    normalized.futureMessages,
    normalized.legacyRecords,
    normalized.memories,
    normalized.goals,
  ].some((items) => items.length > 0);

  if (!hasNewPortalData) {
    migrateOldRecords(saved, normalized);
  }

  return normalized;
}

function migrateOldRecords(saved, normalized) {
  const oldRecords = [
    ...(saved.records || []),
    ...(saved.blackBoxEvents || []).map((item) => ({ ...item, type: "event", body: item.notes })),
    ...(saved.dreams || []).map((item) => ({ ...item, type: "event", body: item.notes, tags: item.keywords })),
    ...(saved.capsules || []).map((item) => ({ ...item, type: "future", message: item.message })),
    ...(saved.legacyNotes || []).map((item) => ({ ...item, type: "legacy", body: item.message })),
    ...(saved.memories || []).map((item) => ({ ...item, type: "memory", body: item.message })),
  ];

  oldRecords.forEach((record) => {
    const type = record.type || "event";

    if (type === "future") {
      normalized.futureMessages.push(normalizeFutureMessage({
        id: record.id,
        message: record.message || record.body,
        recipient: "Future Self",
        sender: "LifeVault User",
        openDate: record.unlockDate || record.createdAt,
        purpose: record.answers?.reasonToLock || "",
        createdAt: record.createdAt,
      }));
      return;
    }

    if (type === "legacy") {
      normalized.legacyRecords.push(normalizeLegacyRecord({
        id: record.id,
        title: record.title,
        preparedBy: "LifeVault User",
        overallNotes: record.body || record.message || "",
        assets: [{
          type: "other",
          fields: {
            belongingName: record.title || "Legacy note",
            description: record.body || "",
            recipient: record.answers?.recipient || "",
            instructions: record.answers?.instruction || "",
          },
        }],
        createdAt: record.createdAt,
      }));
      return;
    }

    if (type === "memory") {
      normalized.memories.push(normalizeMemory({
        id: record.id,
        title: record.title,
        memoryType: "Personal Memory",
        place: "",
        memoryDate: record.entryDate || record.createdAt,
        what: record.body,
        feeling: record.mood,
        feelingCategory: record.mood,
        importance: record.answers?.meaning || "",
        tags: record.tags,
        createdAt: record.createdAt,
      }));
      return;
    }

    normalized.diaryPages.push(normalizeDiaryPage({
      id: record.id,
      title: record.title,
      date: record.entryDate || record.createdAt,
      mood: record.mood,
      place: "",
      body: record.body || Object.values(record.answers || {}).join("\n\n"),
      tags: record.tags,
      createdAt: record.createdAt,
    }));
  });
}

function normalizeDiaryProfile(profile) {
  return {
    name: profile.name || "",
    age: profile.age || "",
    dob: normalizeDate(profile.dob || ""),
    place: profile.place || "",
    contact: profile.contact || "",
    intro: profile.intro || "",
    quote: profile.quote || "",
  };
}

function normalizeDiaryPage(page) {
  return {
    id: page.id || createId(),
    date: normalizeDate(page.date || page.entryDate || page.createdAt || todayDmy()),
    title: page.title || "Untitled Diary Entry",
    mood: page.mood || "Calm",
    place: page.place || "",
    body: page.body || page.diaryBody || "",
    tags: page.tags || "",
    attachment: page.attachment || "",
    createdAt: normalizeDate(page.createdAt || todayDmy()),
    updatedAt: normalizeDate(page.updatedAt || todayDmy()),
  };
}

function normalizeFutureMessage(message) {
  return {
    id: message.id || createId(),
    message: message.message || "",
    recipient: message.recipient || message.toWhom || "",
    sender: message.sender || message.senderName || "",
    openDate: normalizeDate(message.openDate || message.unlockDate || ""),
    openTime: message.openTime || "",
    purpose: message.purpose || "",
    privacy: message.privacy !== false,
    createdAt: normalizeDate(message.createdAt || todayDmy()),
    updatedAt: normalizeDate(message.updatedAt || todayDmy()),
  };
}

function normalizeLegacyRecord(record) {
  return {
    id: record.id || createId(),
    title: record.title || "Legacy Record",
    preparedBy: record.preparedBy || "",
    assets: (record.assets || []).map((asset) => ({
      type: asset.type || "other",
      fields: { ...(asset.fields || {}) },
    })),
    overallNotes: record.overallNotes || "",
    createdAt: normalizeDate(record.createdAt || todayDmy()),
    updatedAt: normalizeDate(record.updatedAt || todayDmy()),
  };
}

function normalizeMemory(memory) {
  return {
    id: memory.id || createId(),
    memoryType: memory.memoryType || memory.type || "",
    title: memory.title || "Untitled Memory",
    place: memory.place || "",
    memoryDate: normalizeDate(memory.memoryDate || memory.date || ""),
    people: memory.people || "",
    what: memory.what || memory.body || "",
    feeling: memory.feeling || "",
    feelingCategory: memory.feelingCategory || "Happy",
    importance: memory.importance || "",
    attachment: memory.attachment || "",
    tags: memory.tags || "",
    createdAt: normalizeDate(memory.createdAt || todayDmy()),
    updatedAt: normalizeDate(memory.updatedAt || todayDmy()),
  };
}

function normalizeGoal(goal) {
  return {
    id: goal.id || createId(),
    type: goal.type || "Career",
    text: goal.text || goal.goal || "",
    reason: goal.reason || "",
    targetDate: normalizeDate(goal.targetDate || ""),
    progress: goal.progress || "",
    measures: goal.measures || "",
    initiatives: goal.initiatives || "",
    suggestions: (goal.suggestions || []).map((suggestion) => ({
      id: suggestion.id || createId(),
      text: suggestion.text || suggestion,
      completed: Boolean(suggestion.completed),
    })),
    notes: (goal.notes || []).map((note) => ({
      id: note.id || createId(),
      date: normalizeDate(note.date || todayDmy()),
      action: note.action || "",
      progress: note.progress || "",
      nextStep: note.nextStep || "",
    })),
    createdAt: normalizeDate(goal.createdAt || todayDmy()),
    updatedAt: normalizeDate(goal.updatedAt || todayDmy()),
  };
}

function createId() {
  if (window.crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getActiveAccount() {
  return portal.users[activeEmail] || null;
}

function savePortal() {
  const activeAccount = getActiveAccount();
  if (activeAccount) {
    activeAccount.vault = vault;
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(portal));
}

function todayDmy() {
  const now = new Date();
  return [
    String(now.getDate()).padStart(2, "0"),
    String(now.getMonth() + 1).padStart(2, "0"),
    now.getFullYear(),
  ].join("-");
}

function normalizeDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const value = String(dateValue).trim();
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }

  const dmyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) {
    return value;
  }

  return value;
}

function isValidDmy(dateValue) {
  if (!dateValue) {
    return true;
  }

  return Boolean(parseDmy(dateValue));
}

function parseDmy(dateValue) {
  const match = String(dateValue || "").trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(dateValue) {
  return normalizeDate(dateValue) || "No date";
}

function dateTimeFromDmy(dateValue, timeValue) {
  const date = parseDmy(normalizeDate(dateValue));
  if (!date) {
    return null;
  }

  const [hours = "00", minutes = "00"] = String(timeValue || "00:00").split(":");
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
}

function daysUntil(dateValue, timeValue) {
  const target = dateTimeFromDmy(dateValue, timeValue);
  if (!target) {
    return 0;
  }

  return Math.ceil((target - new Date()) / 86400000);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function newlineToBreaks(value) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function isEmergencyComplete() {
  return Boolean(vault.emergency.fullName && vault.emergency.contactPhone);
}

function isFutureMessageLocked(message) {
  const openDateTime = dateTimeFromDmy(message.openDate, message.openTime);
  if (!openDateTime) {
    return false;
  }

  return new Date() < openDateTime;
}

function getVaultTotals() {
  const goalNotes = vault.goals.reduce((total, goal) => total + goal.notes.length, 0);
  return {
    diary: vault.diaryPages.length,
    future: vault.futureMessages.length,
    legacy: vault.legacyRecords.length,
    memory: vault.memories.length,
    goals: vault.goals.length,
    goalNotes,
    total: vault.diaryPages.length + vault.futureMessages.length + vault.legacyRecords.length + vault.memories.length + vault.goals.length,
  };
}

function getTagsFromText(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function getAllTaggedItems() {
  return [
    ...vault.diaryPages.map((item) => item.tags),
    ...vault.memories.map((item) => item.tags),
  ].flatMap(getTagsFromText);
}

function getReflectionItems() {
  const keywords = ["anxious", "angry", "low", "painful", "hurt", "lost", "urgent", "warning", "health", "regret"];
  const items = [
    ...vault.diaryPages.map((item) => ({ portal: "Diary", title: item.title, text: `${item.title} ${item.mood} ${item.body} ${item.tags}` })),
    ...vault.memories.map((item) => ({ portal: "Memory", title: item.title, text: `${item.title} ${item.feelingCategory} ${item.feeling} ${item.what}` })),
    ...vault.goals.map((item) => ({ portal: "Goal", title: item.text, text: `${item.type} ${item.text} ${item.progress} ${item.reason}` })),
  ];

  return items.filter((item) => keywords.some((keyword) => item.text.toLowerCase().includes(keyword)));
}

function renderEmergencyCard(target) {
  const fields = [
    ["Name", vault.emergency.fullName],
    ["Blood Group", vault.emergency.bloodGroup],
    ["Allergies", vault.emergency.allergies],
    ["Medical Notes", vault.emergency.medicalNotes],
    ["Emergency Contact", vault.emergency.contactName],
    ["Contact Number", vault.emergency.contactPhone],
    ["Daily Routine", vault.emergency.routine],
  ];

  target.innerHTML = `
    <div class="emergency-card-grid">
      ${fields.map(([label, value]) => `
        <div class="emergency-field">
          <span>${label}</span>
          <strong>${escapeHtml(value) || "Not added"}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function configureAuthPanel() {
  const account = getActiveAccount();
  const hasSavedAccount = Boolean(account);
  const isJoin = authMode === "join" || !hasSavedAccount;

  joinFields.classList.toggle("hidden", !isJoin);
  rememberedUserBox.classList.toggle("hidden", isJoin || !account);
  switchAuthBtn.classList.toggle("hidden", !hasSavedAccount);
  authModeLabel.textContent = isJoin ? "Join LifeVault" : "Welcome Back";
  authTitle.textContent = isJoin ? "Create Vault" : "Open Vault";
  secretLabel.textContent = isJoin
    ? secretTypeInput.value === "password" ? "Create Password" : "Create Passcode"
    : account.secretType === "password" ? "Password" : "Passcode";
  authSubmitBtn.textContent = isJoin ? "Create and Unlock" : "Unlock";
  switchAuthBtn.textContent = isJoin ? "Use Saved Vault" : "Create Another Vault";

  if (account) {
    rememberedUserBox.innerHTML = `
      <strong>${escapeHtml(account.name)}</strong>
      <span>${escapeHtml(account.gmail)}</span>
    `;
  }
}

function openVaultFor(email) {
  activeEmail = email;
  portal.lastEmail = email;
  vault = getActiveAccount().vault;
  savePortal();
  passcodeInput.value = "";
  authMessage.textContent = "";
  lockScreen.classList.add("hidden");
  vaultScreen.classList.remove("hidden");
  setSidebarOpen(false);
  showSection("dashboard");
}

function setSidebarOpen(isOpen) {
  vaultScreen.classList.toggle("sidebar-collapsed", !isOpen);
  vaultScreen.classList.toggle("sidebar-open", isOpen);
  menuToggleBtn.setAttribute("aria-expanded", String(isOpen));
  menuToggleBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

function toggleSidebar() {
  setSidebarOpen(vaultScreen.classList.contains("sidebar-collapsed"));
}

function showSection(section) {
  activeSection = section;
  Object.entries(sections).forEach(([name, element]) => {
    element.classList.toggle("hidden", name !== section);
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });
  sectionTitle.textContent = sectionNames[section];
  render();
}

function render() {
  todayText.textContent = todayDmy();
  const totals = getVaultTotals();
  recordCountText.textContent = `${totals.total} ${totals.total === 1 ? "item" : "items"}`;
  renderDashboard();
  renderEmergencyModule();
  renderDiaryPortal();
  renderFuturePortal();
  renderLegacyPortal();
  renderMemoryPortal();
  renderGoalPortal();
  renderInsights();
}

function renderDashboard() {
  const totals = getVaultTotals();
  const lockedFuture = vault.futureMessages.filter(isFutureMessageLocked).length;

  document.getElementById("emergencyStatus").textContent = isEmergencyComplete() ? "Ready" : "Incomplete";
  document.getElementById("lockedFutureCount").textContent = lockedFuture;
  document.getElementById("goalNoteCount").textContent = totals.goalNotes;
  document.getElementById("totalRecordCount").textContent = totals.total;

  document.getElementById("portalCards").innerHTML = portalDefinitions.map((portalItem) => `
    <button class="portal-card ${portalItem.accent}" type="button" data-go-section="${portalItem.key}">
      <span>${portalItem.detail}</span>
      <strong>${portalItem.title}</strong>
      <em>${getPortalCount(portalItem.key)}</em>
    </button>
  `).join("");

  const activityItems = [
    ...vault.diaryPages.map((item) => ({ title: item.title, detail: `Diary Entry | ${formatDate(item.date)}` })),
    ...vault.futureMessages.map((item) => ({ title: `Message to ${item.recipient || "someone"}`, detail: `Future Message | Opens ${formatDate(item.openDate)}` })),
    ...vault.legacyRecords.map((item) => ({ title: item.title, detail: `Legacy Record | ${item.assets.length} asset section(s)` })),
    ...vault.memories.map((item) => ({ title: item.title, detail: `Memory | ${formatDate(item.memoryDate)}` })),
    ...vault.goals.map((item) => ({ title: item.text, detail: `Goal | ${item.type}` })),
  ].slice(0, 8);

  document.getElementById("recentEntries").innerHTML = activityItems.length
    ? activityItems.map(renderSummaryItem).join("")
    : renderSummaryItem({ title: "No vault items yet", detail: "Choose a portal to begin." });
}

function getPortalCount(key) {
  const totals = getVaultTotals();
  const labels = {
    diary: `${totals.diary} page(s)`,
    future: `${totals.future} message(s)`,
    legacy: `${totals.legacy} record(s)`,
    memory: `${totals.memory} memory card(s)`,
    goals: `${totals.goals} goal(s)`,
  };
  return labels[key] || "0";
}

function renderSummaryItem(item) {
  return `
    <div class="summary-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </div>
  `;
}

function renderEmptyRecord(message) {
  return `<div class="summary-item"><strong>${escapeHtml(message)}</strong><span>Ready when you are.</span></div>`;
}

function renderEmergencyModule() {
  document.getElementById("fullNameInput").value = vault.emergency.fullName;
  document.getElementById("bloodGroupInput").value = vault.emergency.bloodGroup;
  document.getElementById("allergiesInput").value = vault.emergency.allergies;
  document.getElementById("medicalNotesInput").value = vault.emergency.medicalNotes;
  document.getElementById("contactNameInput").value = vault.emergency.contactName;
  document.getElementById("contactPhoneInput").value = vault.emergency.contactPhone;
  document.getElementById("routineInput").value = vault.emergency.routine;
  renderEmergencyCard(document.getElementById("emergencyCard"));
}

function renderDiaryPortal() {
  const profilePanel = document.getElementById("diaryProfilePanel");
  const bookPanel = document.getElementById("diaryBookPanel");

  if (!vault.diaryProfile) {
    profilePanel.classList.remove("hidden");
    bookPanel.classList.add("hidden");
    fillDiaryProfileForm(null);
    return;
  }

  profilePanel.classList.add("hidden");
  bookPanel.classList.remove("hidden");
  diaryPageIndex = Math.max(0, Math.min(diaryPageIndex, vault.diaryPages.length + 1));
  renderDiaryBookPage();
}

function fillDiaryProfileForm(profile) {
  document.getElementById("diaryProfileNameInput").value = profile?.name || "";
  document.getElementById("diaryProfileAgeInput").value = profile?.age || "";
  document.getElementById("diaryProfileDobInput").value = profile?.dob || "";
  document.getElementById("diaryProfilePlaceInput").value = profile?.place || "";
  document.getElementById("diaryProfileContactInput").value = profile?.contact || "";
  document.getElementById("diaryProfileQuoteInput").value = profile?.quote || "";
  document.getElementById("diaryProfileIntroInput").value = profile?.intro || "";
}

function renderDiaryBookPage() {
  const page = document.getElementById("diaryBookPage");
  const indicator = document.getElementById("diaryPageIndicator");
  const previousBtn = document.getElementById("previousDiaryPageBtn");
  const nextBtn = document.getElementById("nextDiaryPageBtn");
  const totalPages = vault.diaryPages.length + 2;

  indicator.textContent = `Page ${diaryPageIndex + 1} of ${totalPages}`;
  previousBtn.disabled = diaryPageIndex === 0;
  nextBtn.disabled = diaryPageIndex >= totalPages - 1;

  if (diaryPageIndex === 0) {
    page.innerHTML = renderDiaryCoverPage();
    return;
  }

  if (diaryPageIndex === 1) {
    page.innerHTML = renderDiaryDetailsPage();
    return;
  }

  page.innerHTML = renderDiaryEntryEditor(vault.diaryPages[diaryPageIndex - 2]);
}

function renderDiaryCoverPage() {
  const profile = vault.diaryProfile || {};
  return `
    <div class="book-page cover-page">
      <p class="eyebrow">LifeVault Diary</p>
      <h2>My Diary</h2>
      <div class="cover-line"></div>
      <strong>${escapeHtml(profile.name || "My Name")}</strong>
      <span>${escapeHtml(profile.quote || "Private pages, honest thoughts.")}</span>
    </div>
  `;
}

function renderDiaryDetailsPage() {
  const profile = vault.diaryProfile || {};
  const details = [
    ["Name", profile.name],
    ["Age", profile.age],
    ["Date of Birth", profile.dob],
    ["Place", profile.place],
    ["Contact / Email", profile.contact],
    ["Quote", profile.quote],
  ];

  return `
    <div class="book-page profile-page">
      <p class="eyebrow">First Page</p>
      <h2>${escapeHtml(profile.name || "My Details")}</h2>
      <div class="front-page-grid">
        ${details.map(([label, value]) => `
          <div>
            <span>${label}</span>
            <strong>${escapeHtml(value) || "Not added"}</strong>
          </div>
        `).join("")}
      </div>
      <p class="diary-intro">${newlineToBreaks(profile.intro || "")}</p>
      <button class="secondary" type="button" data-action="edit-diary-profile">Edit Front Page</button>
    </div>
  `;
}

function renderDiaryEntryEditor(page) {
  const entry = page || normalizeDiaryPage({});
  return `
    <form id="diaryEntryForm" class="book-page diary-entry-page">
      <input id="diaryPageIdInput" type="hidden" value="${escapeHtml(entry.id)}">
      <div class="diary-page-top">
        <label>
          <span>Date</span>
          <input id="diaryPageDateInput" type="text" maxlength="10" value="${escapeHtml(entry.date)}" placeholder="DD-MM-YYYY" required>
        </label>
        <label>
          <span>Mood</span>
          <select id="diaryPageMoodInput">
            ${["Calm", "Happy", "Peaceful", "Proud", "Emotional", "Anxious", "Low", "Mixed"].map((mood) => `
              <option ${entry.mood === mood ? "selected" : ""}>${mood}</option>
            `).join("")}
          </select>
        </label>
      </div>
      <label>
        <span>Title</span>
        <input id="diaryPageTitleInput" type="text" maxlength="100" value="${escapeHtml(entry.title)}" required>
      </label>
      <label>
        <span>Place</span>
        <input id="diaryPagePlaceInput" type="text" maxlength="120" value="${escapeHtml(entry.place)}">
      </label>
      <label>
        <span>Today&apos;s Experience</span>
        <textarea id="diaryPageBodyInput" rows="12" required>${escapeHtml(entry.body)}</textarea>
      </label>
      <div class="diary-page-top">
        <label>
          <span>Tags</span>
          <input id="diaryPageTagsInput" type="text" maxlength="140" value="${escapeHtml(entry.tags)}">
        </label>
        <label>
          <span>Attachment Note / Link</span>
          <input id="diaryPageAttachmentInput" type="text" maxlength="180" value="${escapeHtml(entry.attachment)}">
        </label>
      </div>
      <div class="form-actions span-two">
        <button class="primary" type="submit">Save Diary Entry</button>
        <button class="secondary" type="button" data-action="delete-diary-page">Delete Page</button>
      </div>
    </form>
  `;
}

function saveDiaryEntryFromForm() {
  const entryDate = document.getElementById("diaryPageDateInput").value.trim();
  if (!entryDate || !isValidDmy(entryDate)) {
    alert("Enter diary date in DD-MM-YYYY format.");
    return;
  }

  const pageId = document.getElementById("diaryPageIdInput").value;
  const updatedPage = normalizeDiaryPage({
    id: pageId,
    date: entryDate,
    title: document.getElementById("diaryPageTitleInput").value.trim(),
    mood: document.getElementById("diaryPageMoodInput").value,
    place: document.getElementById("diaryPagePlaceInput").value.trim(),
    body: document.getElementById("diaryPageBodyInput").value.trim(),
    tags: document.getElementById("diaryPageTagsInput").value.trim(),
    attachment: document.getElementById("diaryPageAttachmentInput").value.trim(),
    updatedAt: todayDmy(),
  });

  const index = vault.diaryPages.findIndex((page) => page.id === pageId);
  if (index >= 0) {
    vault.diaryPages[index] = updatedPage;
  } else {
    vault.diaryPages.push(updatedPage);
    diaryPageIndex = vault.diaryPages.length + 1;
  }

  savePortal();
  render();
}

function addDiaryPage() {
  vault.diaryPages.push(normalizeDiaryPage({
    title: `Diary Entry ${vault.diaryPages.length + 1}`,
    date: todayDmy(),
  }));
  diaryPageIndex = vault.diaryPages.length + 1;
  savePortal();
  render();
}

function deleteCurrentDiaryPage() {
  const pageArrayIndex = diaryPageIndex - 2;
  if (pageArrayIndex < 0 || pageArrayIndex >= vault.diaryPages.length) {
    return;
  }

  if (!confirm("Delete this diary page?")) {
    return;
  }

  vault.diaryPages.splice(pageArrayIndex, 1);
  diaryPageIndex = Math.max(0, Math.min(diaryPageIndex, vault.diaryPages.length + 1));
  savePortal();
  render();
}

function renderFuturePortal() {
  document.getElementById("futureList").innerHTML = vault.futureMessages.length
    ? vault.futureMessages.map(renderFutureCard).join("")
    : renderEmptyRecord("No future messages saved.");
}

function renderFutureCard(message) {
  const locked = isFutureMessageLocked(message);
  return `
    <article class="record-card future-card">
      <div class="record-head">
        <div>
          <h3>To ${escapeHtml(message.recipient || "Unknown")}</h3>
          <div class="record-meta">From ${escapeHtml(message.sender || "Unknown")} | Opens ${formatDate(message.openDate)} ${escapeHtml(message.openTime || "")}</div>
        </div>
        <span class="pill ${locked ? "" : "open"}">${locked ? `${Math.max(1, daysUntil(message.openDate, message.openTime))} day(s) left` : "Open"}</span>
      </div>
      <p class="record-body">${locked ? "This future message is hidden until its viewing date." : newlineToBreaks(message.message)}</p>
      ${message.purpose ? `<div class="record-answer"><strong>Purpose</strong><span>${escapeHtml(message.purpose)}</span></div>` : ""}
      <div class="card-actions">
        <button class="secondary" type="button" data-action="edit-future" data-id="${message.id}">Edit</button>
        <button class="quiet danger" type="button" data-action="delete-future" data-id="${message.id}">Delete</button>
      </div>
    </article>
  `;
}

function resetFutureForm() {
  document.getElementById("futureForm").reset();
  document.getElementById("futureEditIdInput").value = "";
  document.getElementById("futurePrivacyInput").checked = true;
  document.getElementById("futureCancelEditBtn").classList.add("hidden");
}

function editFutureMessage(id) {
  const message = vault.futureMessages.find((item) => item.id === id);
  if (!message) {
    return;
  }

  document.getElementById("futureEditIdInput").value = message.id;
  document.getElementById("futureMessageInput").value = message.message;
  document.getElementById("futureRecipientInput").value = message.recipient;
  document.getElementById("futureSenderInput").value = message.sender;
  document.getElementById("futureOpenDateInput").value = message.openDate;
  document.getElementById("futureOpenTimeInput").value = message.openTime;
  document.getElementById("futurePurposeInput").value = message.purpose;
  document.getElementById("futurePrivacyInput").checked = message.privacy;
  document.getElementById("futureCancelEditBtn").classList.remove("hidden");
}

function renderLegacyPortal() {
  renderLegacyDynamicFields();
  document.getElementById("legacyList").innerHTML = vault.legacyRecords.length
    ? vault.legacyRecords.map(renderLegacyCard).join("")
    : renderEmptyRecord("No legacy records saved.");
}

function renderLegacyDynamicFields(existingAssets) {
  const selectedTypes = [...document.querySelectorAll("[data-asset-option]:checked")].map((input) => input.value);
  const assetsByType = new Map((existingAssets || []).map((asset) => [asset.type, asset.fields || {}]));
  const target = document.getElementById("legacyDynamicFields");

  target.innerHTML = selectedTypes.map((type) => {
    const config = legacyAssetConfigs[type];
    const values = assetsByType.get(type) || {};
    return `
      <section class="asset-section" data-legacy-section="${type}">
        <h3>${config.label}</h3>
        <div class="form-grid">
          ${config.fields.map(([key, label, control]) => `
            <label class="${control === "textarea" ? "span-two" : ""}">
              <span>${label}</span>
              ${control === "textarea"
                ? `<textarea rows="3" data-legacy-field="${key}">${escapeHtml(values[key] || "")}</textarea>`
                : `<input type="text" data-legacy-field="${key}" value="${escapeHtml(values[key] || "")}">`
              }
            </label>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderLegacyCard(record) {
  return `
    <article class="record-card legacy-card">
      <div class="record-head">
        <div>
          <h3>${escapeHtml(record.title)}</h3>
          <div class="record-meta">${record.assets.length} asset section(s) | Prepared by ${escapeHtml(record.preparedBy || "Not added")}</div>
        </div>
      </div>
      ${record.assets.map(renderLegacyAssetSummary).join("")}
      ${record.overallNotes ? `<p class="record-body">${newlineToBreaks(record.overallNotes)}</p>` : ""}
      <div class="card-actions">
        <button class="secondary" type="button" data-action="edit-legacy" data-id="${record.id}">Edit</button>
        <button class="quiet danger" type="button" data-action="delete-legacy" data-id="${record.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderLegacyAssetSummary(asset) {
  const config = legacyAssetConfigs[asset.type] || legacyAssetConfigs.other;
  const fields = Object.entries(asset.fields || {}).filter(([, value]) => value);
  return `
    <div class="legacy-summary">
      <strong>${config.label}</strong>
      ${fields.slice(0, 6).map(([key, value]) => `<span>${escapeHtml(getLegacyFieldLabel(asset.type, key))}: ${escapeHtml(value)}</span>`).join("")}
    </div>
  `;
}

function getLegacyFieldLabel(type, key) {
  return (legacyAssetConfigs[type]?.fields || []).find(([fieldKey]) => fieldKey === key)?.[1] || key;
}

function resetLegacyForm() {
  document.getElementById("legacyForm").reset();
  document.getElementById("legacyEditIdInput").value = "";
  document.getElementById("legacyCancelEditBtn").classList.add("hidden");
  renderLegacyDynamicFields();
}

function editLegacyRecord(id) {
  const record = vault.legacyRecords.find((item) => item.id === id);
  if (!record) {
    return;
  }

  document.getElementById("legacyEditIdInput").value = record.id;
  document.getElementById("legacyTitleInput").value = record.title;
  document.getElementById("legacyPreparedByInput").value = record.preparedBy;
  document.getElementById("legacyOverallNotesInput").value = record.overallNotes;
  document.querySelectorAll("[data-asset-option]").forEach((input) => {
    input.checked = record.assets.some((asset) => asset.type === input.value);
  });
  renderLegacyDynamicFields(record.assets);
  document.getElementById("legacyCancelEditBtn").classList.remove("hidden");
}

function getLegacyAssetsFromForm() {
  return [...document.querySelectorAll("[data-legacy-section]")].map((section) => {
    const fields = {};
    section.querySelectorAll("[data-legacy-field]").forEach((input) => {
      fields[input.dataset.legacyField] = input.value.trim();
    });
    return {
      type: section.dataset.legacySection,
      fields,
    };
  });
}

function renderMemoryPortal() {
  document.getElementById("memoryList").innerHTML = vault.memories.length
    ? vault.memories.map(renderMemoryCard).join("")
    : renderEmptyRecord("No memories saved.");
}

function renderMemoryCard(memory) {
  return `
    <article class="memory-card">
      <div class="memory-card-top">
        <span>${escapeHtml(memory.feelingCategory)}</span>
        <strong>${formatDate(memory.memoryDate)}</strong>
      </div>
      <h3>${escapeHtml(memory.title)}</h3>
      <p>${newlineToBreaks(memory.what)}</p>
      <div class="memory-details">
        <span>${escapeHtml(memory.memoryType || "Memory")}</span>
        <span>${escapeHtml(memory.place || "No place added")}</span>
        <span>${escapeHtml(memory.people || "No people added")}</span>
      </div>
      ${memory.importance ? `<div class="record-answer"><strong>Why it matters</strong><span>${escapeHtml(memory.importance)}</span></div>` : ""}
      <div class="card-actions">
        <button class="secondary" type="button" data-action="edit-memory" data-id="${memory.id}">Edit</button>
        <button class="quiet danger" type="button" data-action="delete-memory" data-id="${memory.id}">Delete</button>
      </div>
    </article>
  `;
}

function resetMemoryForm() {
  document.getElementById("memoryForm").reset();
  document.getElementById("memoryEditIdInput").value = "";
  document.getElementById("memoryCancelEditBtn").classList.add("hidden");
}

function editMemory(id) {
  const memory = vault.memories.find((item) => item.id === id);
  if (!memory) {
    return;
  }

  document.getElementById("memoryEditIdInput").value = memory.id;
  document.getElementById("memoryTypeInput").value = memory.memoryType;
  document.getElementById("memoryTitleInput").value = memory.title;
  document.getElementById("memoryPlaceInput").value = memory.place;
  document.getElementById("memoryDateInput").value = memory.memoryDate;
  document.getElementById("memoryPeopleInput").value = memory.people;
  document.getElementById("memoryWhatInput").value = memory.what;
  document.getElementById("memoryFeelingCategoryInput").value = memory.feelingCategory;
  document.getElementById("memoryFeelingInput").value = memory.feeling;
  document.getElementById("memoryImportanceInput").value = memory.importance;
  document.getElementById("memoryAttachmentInput").value = memory.attachment;
  document.getElementById("memoryTagsInput").value = memory.tags;
  document.getElementById("memoryCancelEditBtn").classList.remove("hidden");
}

function renderGoalPortal() {
  if (goalSuggestionDraft.length === 0) {
    goalSuggestionDraft = suggestionsForGoal(
      document.getElementById("goalTypeInput").value,
      document.getElementById("goalTextInput").value,
    ).map((text) => ({ id: createId(), text, completed: false }));
  }
  renderGoalSuggestionEditor();

  document.getElementById("goalList").innerHTML = vault.goals.length
    ? vault.goals.map(renderGoalCard).join("")
    : renderEmptyRecord("No goals saved.");
}

function suggestionsForGoal(type, description) {
  const lower = `${type} ${description}`.toLowerCase();
  const suggestions = {
    education: ["Create a weekly study plan", "List resources and chapters", "Add revision days before tests", "Track weak topics after every session"],
    career: ["Update resume", "Improve LinkedIn profile", "Build one visible project", "Apply to internships or entry roles every week"],
    health: ["Set a simple daily routine", "Track sleep, food, and movement", "Choose one consistency habit", "Review progress every week"],
    finance: ["Make a monthly budget", "Separate needs, wants, and savings", "Start a small saving target", "Learn basic investment concepts before acting"],
    relationship: ["Plan one honest conversation", "Write what needs to improve", "Set a small consistent action", "Review boundaries and expectations"],
    "personal growth": ["Choose one habit to build", "Track the habit daily", "Read or learn for 20 minutes", "Reflect every weekend"],
    spiritual: ["Set a quiet daily practice", "Write weekly reflections", "Choose one value to practice", "Reduce one distraction"],
    "project / startup": ["Define the problem clearly", "Build a small prototype", "Ask users for feedback", "Track weekly milestones"],
    other: ["Break the goal into small steps", "Set one weekly action", "Track progress honestly", "Review and adjust next steps"],
  };

  let key = Object.keys(suggestions).find((item) => lower.includes(item));
  if (!key) {
    key = type.toLowerCase();
  }

  return suggestions[key] || suggestions.other;
}

function renderGoalSuggestionEditor() {
  document.getElementById("goalSuggestionEditor").innerHTML = goalSuggestionDraft.map((suggestion, index) => `
    <label class="suggestion-row">
      <input type="checkbox" data-suggestion-completed="${index}" ${suggestion.completed ? "checked" : ""}>
      <input type="text" data-suggestion-text="${index}" value="${escapeHtml(suggestion.text)}">
    </label>
  `).join("");
}

function syncSuggestionDraftFromEditor() {
  document.querySelectorAll("[data-suggestion-text]").forEach((input) => {
    const index = Number(input.dataset.suggestionText);
    goalSuggestionDraft[index].text = input.value.trim();
  });
  document.querySelectorAll("[data-suggestion-completed]").forEach((input) => {
    const index = Number(input.dataset.suggestionCompleted);
    goalSuggestionDraft[index].completed = input.checked;
  });
}

function renderGoalCard(goal) {
  return `
    <article class="record-card goal-card">
      <div class="record-head">
        <div>
          <h3>${escapeHtml(goal.text)}</h3>
          <div class="record-meta">${escapeHtml(goal.type)} | Target ${formatDate(goal.targetDate)} | ${escapeHtml(goal.progress || "No progress added")}</div>
        </div>
      </div>
      ${goal.reason ? `<p class="record-body">${newlineToBreaks(goal.reason)}</p>` : ""}
      <div class="suggestion-list">
        ${goal.suggestions.map((suggestion) => `
          <label class="saved-suggestion ${suggestion.completed ? "completed" : ""}">
            <input type="checkbox" data-action="toggle-goal-suggestion" data-goal-id="${goal.id}" data-suggestion-id="${suggestion.id}" ${suggestion.completed ? "checked" : ""}>
            <span>${escapeHtml(suggestion.text)}</span>
          </label>
        `).join("")}
      </div>
      <div class="goal-notes">
        ${goal.notes.map((note) => `
          <div class="goal-note">
            <strong>${formatDate(note.date)} | ${escapeHtml(note.progress)}</strong>
            <span>${escapeHtml(note.action)}</span>
            <em>${escapeHtml(note.nextStep)}</em>
          </div>
        `).join("")}
      </div>
      <form class="goal-note-form" data-goal-note-form="${goal.id}">
        <input type="text" name="date" maxlength="10" placeholder="DD-MM-YYYY" value="${todayDmy()}" required>
        <input type="text" name="action" maxlength="160" placeholder="Action taken" required>
        <input type="text" name="progress" maxlength="80" placeholder="Progress">
        <input type="text" name="nextStep" maxlength="160" placeholder="Next step">
        <button class="secondary" type="submit">Add Note</button>
      </form>
      <div class="card-actions">
        <button class="secondary" type="button" data-action="edit-goal" data-id="${goal.id}">Edit</button>
        <button class="quiet danger" type="button" data-action="delete-goal" data-id="${goal.id}">Delete</button>
      </div>
    </article>
  `;
}

function resetGoalForm() {
  document.getElementById("goalForm").reset();
  document.getElementById("goalEditIdInput").value = "";
  document.getElementById("goalCancelEditBtn").classList.add("hidden");
  goalSuggestionDraft = suggestionsForGoal("Career", "").map((text) => ({ id: createId(), text, completed: false }));
  renderGoalSuggestionEditor();
}

function editGoal(id) {
  const goal = vault.goals.find((item) => item.id === id);
  if (!goal) {
    return;
  }

  document.getElementById("goalEditIdInput").value = goal.id;
  document.getElementById("goalTypeInput").value = goal.type;
  document.getElementById("goalTextInput").value = goal.text;
  document.getElementById("goalReasonInput").value = goal.reason;
  document.getElementById("goalTargetDateInput").value = goal.targetDate;
  document.getElementById("goalProgressInput").value = goal.progress;
  document.getElementById("goalMeasuresInput").value = goal.measures;
  document.getElementById("goalInitiativesInput").value = goal.initiatives;
  goalSuggestionDraft = goal.suggestions.map((suggestion) => ({ ...suggestion }));
  renderGoalSuggestionEditor();
  document.getElementById("goalCancelEditBtn").classList.remove("hidden");
}

function renderInsights() {
  const totals = getVaultTotals();
  const tags = getAllTaggedItems();
  const tagCounts = tags.reduce((map, tag) => map.set(tag, (map.get(tag) || 0) + 1), new Map());
  const tagStats = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const reflectionItems = getReflectionItems();

  const signalItems = [
    { label: "Diary Pages", value: `${totals.diary}` },
    { label: "Future Messages", value: `${totals.future}` },
    { label: "Legacy Records", value: `${totals.legacy}` },
    { label: "Memories", value: `${totals.memory}` },
    { label: "Goals", value: `${totals.goals}` },
    { label: "Goal Notes", value: `${totals.goalNotes}` },
  ];

  document.getElementById("insightSignals").innerHTML = signalItems.map(renderPatternItem).join("");
  document.getElementById("patternInsights").innerHTML = tagStats.length
    ? tagStats.map(([label, count]) => renderPatternItem({ label, value: `${count} hit(s)` })).join("")
    : renderEmptyRecord("No tags yet.");
  document.getElementById("reflectionList").innerHTML = reflectionItems.length
    ? reflectionItems.map((item) => renderSummaryItem({ title: item.title, detail: item.portal })).join("")
    : renderEmptyRecord("No entries currently need a revisit.");
}

function renderPatternItem(item) {
  return `
    <div class="pattern-item">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.value)}</span>
    </div>
  `;
}

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const secret = passcodeInput.value.trim();

  if (authMode === "join" || !getActiveAccount()) {
    const name = nameInput.value.trim();
    const gmail = gmailInput.value.trim().toLowerCase();

    if (!name || !gmail || !secret) {
      authMessage.textContent = "Enter name, Gmail, and secret.";
      return;
    }

    if (!gmail.endsWith("@gmail.com")) {
      authMessage.textContent = "Use a valid Gmail address.";
      return;
    }

    if (portal.users[gmail]) {
      authMessage.textContent = "This Gmail already has a vault. Use Saved Vault.";
      return;
    }

    portal.users[gmail] = {
      name,
      gmail,
      secretType: secretTypeInput.value,
      secret,
      vault: structuredClone(emptyVault),
    };
    activeEmail = gmail;
    openVaultFor(gmail);
    return;
  }

  const account = getActiveAccount();
  if (!secret || secret !== account.secret) {
    authMessage.textContent = `Incorrect ${account.secretType}.`;
    return;
  }

  openVaultFor(account.gmail);
});

emergencyAccessBtn.addEventListener("click", () => {
  const account = getActiveAccount();
  vault = account?.vault || structuredClone(emptyVault);
  renderEmergencyCard(emergencyDialogContent);
  emergencyDialog.showModal();
});

closeEmergencyDialog.addEventListener("click", () => emergencyDialog.close());

menuToggleBtn.addEventListener("click", toggleSidebar);

lockBtn.addEventListener("click", () => {
  savePortal();
  vaultScreen.classList.add("hidden");
  lockScreen.classList.remove("hidden");
  authMode = getActiveAccount() ? "login" : "join";
  configureAuthPanel();
});

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    showSection(button.dataset.section);
    if (window.innerWidth <= 980) {
      setSidebarOpen(false);
    }
  });
});

document.addEventListener("click", (event) => {
  const sectionButton = event.target.closest("[data-go-section]");
  if (sectionButton) {
    showSection(sectionButton.dataset.goSection);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }

  const { action, id, goalId, suggestionId } = actionButton.dataset;

  if (action === "edit-diary-profile") {
    fillDiaryProfileForm(vault.diaryProfile);
    document.getElementById("diaryProfilePanel").classList.remove("hidden");
    document.getElementById("diaryBookPanel").classList.add("hidden");
  } else if (action === "delete-diary-page") {
    deleteCurrentDiaryPage();
  } else if (action === "edit-future") {
    editFutureMessage(id);
  } else if (action === "delete-future" && confirm("Delete this future message?")) {
    vault.futureMessages = vault.futureMessages.filter((item) => item.id !== id);
    savePortal();
    render();
  } else if (action === "edit-legacy") {
    editLegacyRecord(id);
  } else if (action === "delete-legacy" && confirm("Delete this legacy record?")) {
    vault.legacyRecords = vault.legacyRecords.filter((item) => item.id !== id);
    savePortal();
    render();
  } else if (action === "edit-memory") {
    editMemory(id);
  } else if (action === "delete-memory" && confirm("Delete this memory?")) {
    vault.memories = vault.memories.filter((item) => item.id !== id);
    savePortal();
    render();
  } else if (action === "edit-goal") {
    editGoal(id);
  } else if (action === "delete-goal" && confirm("Delete this goal?")) {
    vault.goals = vault.goals.filter((item) => item.id !== id);
    savePortal();
    render();
  } else if (action === "toggle-goal-suggestion") {
    const goal = vault.goals.find((item) => item.id === goalId);
    const suggestion = goal?.suggestions.find((item) => item.id === suggestionId);
    if (suggestion) {
      suggestion.completed = actionButton.checked;
      savePortal();
      render();
    }
  }
});

switchAuthBtn.addEventListener("click", () => {
  authMode = authMode === "join" ? "login" : "join";
  authMessage.textContent = "";
  passcodeInput.value = "";
  configureAuthPanel();
});

secretTypeInput.addEventListener("change", configureAuthPanel);

document.getElementById("emergencyProfileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  vault.emergency = {
    fullName: document.getElementById("fullNameInput").value.trim(),
    bloodGroup: document.getElementById("bloodGroupInput").value.trim(),
    allergies: document.getElementById("allergiesInput").value.trim(),
    medicalNotes: document.getElementById("medicalNotesInput").value.trim(),
    contactName: document.getElementById("contactNameInput").value.trim(),
    contactPhone: document.getElementById("contactPhoneInput").value.trim(),
    routine: document.getElementById("routineInput").value.trim(),
  };
  savePortal();
  render();
});

document.getElementById("diaryProfileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const dob = document.getElementById("diaryProfileDobInput").value.trim();
  if (!isValidDmy(dob)) {
    alert("Enter date of birth in DD-MM-YYYY format.");
    return;
  }

  vault.diaryProfile = normalizeDiaryProfile({
    name: document.getElementById("diaryProfileNameInput").value.trim(),
    age: document.getElementById("diaryProfileAgeInput").value.trim(),
    dob,
    place: document.getElementById("diaryProfilePlaceInput").value.trim(),
    contact: document.getElementById("diaryProfileContactInput").value.trim(),
    quote: document.getElementById("diaryProfileQuoteInput").value.trim(),
    intro: document.getElementById("diaryProfileIntroInput").value.trim(),
  });
  diaryPageIndex = 0;
  savePortal();
  render();
});

document.getElementById("previousDiaryPageBtn").addEventListener("click", () => {
  diaryPageIndex = Math.max(0, diaryPageIndex - 1);
  renderDiaryBookPage();
});

document.getElementById("nextDiaryPageBtn").addEventListener("click", () => {
  diaryPageIndex = Math.min(vault.diaryPages.length + 1, diaryPageIndex + 1);
  renderDiaryBookPage();
});

document.getElementById("addDiaryPageBtn").addEventListener("click", addDiaryPage);

document.getElementById("diaryBookPage").addEventListener("submit", (event) => {
  if (event.target.id !== "diaryEntryForm") {
    return;
  }
  event.preventDefault();
  saveDiaryEntryFromForm();
});

document.getElementById("futureForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const openDate = document.getElementById("futureOpenDateInput").value.trim();
  if (!openDate || !isValidDmy(openDate)) {
    alert("Enter open date in DD-MM-YYYY format.");
    return;
  }

  const id = document.getElementById("futureEditIdInput").value || createId();
  const message = normalizeFutureMessage({
    id,
    message: document.getElementById("futureMessageInput").value.trim(),
    recipient: document.getElementById("futureRecipientInput").value.trim(),
    sender: document.getElementById("futureSenderInput").value.trim(),
    openDate,
    openTime: document.getElementById("futureOpenTimeInput").value,
    purpose: document.getElementById("futurePurposeInput").value.trim(),
    privacy: document.getElementById("futurePrivacyInput").checked,
    updatedAt: todayDmy(),
  });
  const index = vault.futureMessages.findIndex((item) => item.id === id);
  if (index >= 0) {
    vault.futureMessages[index] = message;
  } else {
    vault.futureMessages.unshift(message);
  }
  resetFutureForm();
  savePortal();
  render();
});

document.getElementById("futureCancelEditBtn").addEventListener("click", resetFutureForm);

document.querySelectorAll("[data-asset-option]").forEach((input) => {
  input.addEventListener("change", () => renderLegacyDynamicFields());
});

document.getElementById("legacyForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const assets = getLegacyAssetsFromForm();
  if (assets.length === 0) {
    alert("Select at least one asset type.");
    return;
  }

  const id = document.getElementById("legacyEditIdInput").value || createId();
  const record = normalizeLegacyRecord({
    id,
    title: document.getElementById("legacyTitleInput").value.trim(),
    preparedBy: document.getElementById("legacyPreparedByInput").value.trim(),
    assets,
    overallNotes: document.getElementById("legacyOverallNotesInput").value.trim(),
    updatedAt: todayDmy(),
  });
  const index = vault.legacyRecords.findIndex((item) => item.id === id);
  if (index >= 0) {
    vault.legacyRecords[index] = record;
  } else {
    vault.legacyRecords.unshift(record);
  }
  resetLegacyForm();
  savePortal();
  render();
});

document.getElementById("legacyCancelEditBtn").addEventListener("click", resetLegacyForm);

document.getElementById("memoryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const memoryDate = document.getElementById("memoryDateInput").value.trim();
  if (!isValidDmy(memoryDate)) {
    alert("Enter memory date in DD-MM-YYYY format.");
    return;
  }

  const id = document.getElementById("memoryEditIdInput").value || createId();
  const memory = normalizeMemory({
    id,
    memoryType: document.getElementById("memoryTypeInput").value.trim(),
    title: document.getElementById("memoryTitleInput").value.trim(),
    place: document.getElementById("memoryPlaceInput").value.trim(),
    memoryDate,
    people: document.getElementById("memoryPeopleInput").value.trim(),
    what: document.getElementById("memoryWhatInput").value.trim(),
    feelingCategory: document.getElementById("memoryFeelingCategoryInput").value,
    feeling: document.getElementById("memoryFeelingInput").value.trim(),
    importance: document.getElementById("memoryImportanceInput").value.trim(),
    attachment: document.getElementById("memoryAttachmentInput").value.trim(),
    tags: document.getElementById("memoryTagsInput").value.trim(),
    updatedAt: todayDmy(),
  });
  const index = vault.memories.findIndex((item) => item.id === id);
  if (index >= 0) {
    vault.memories[index] = memory;
  } else {
    vault.memories.unshift(memory);
  }
  resetMemoryForm();
  savePortal();
  render();
});

document.getElementById("memoryCancelEditBtn").addEventListener("click", resetMemoryForm);

document.getElementById("goalTypeInput").addEventListener("change", () => {
  goalSuggestionDraft = suggestionsForGoal(
    document.getElementById("goalTypeInput").value,
    document.getElementById("goalTextInput").value,
  ).map((text) => ({ id: createId(), text, completed: false }));
  renderGoalSuggestionEditor();
});

document.getElementById("goalTextInput").addEventListener("blur", () => {
  if (document.getElementById("goalEditIdInput").value) {
    return;
  }

  goalSuggestionDraft = suggestionsForGoal(
    document.getElementById("goalTypeInput").value,
    document.getElementById("goalTextInput").value,
  ).map((text) => ({ id: createId(), text, completed: false }));
  renderGoalSuggestionEditor();
});

document.getElementById("goalSuggestionEditor").addEventListener("input", syncSuggestionDraftFromEditor);
document.getElementById("goalSuggestionEditor").addEventListener("change", syncSuggestionDraftFromEditor);

document.getElementById("goalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const targetDate = document.getElementById("goalTargetDateInput").value.trim();
  if (!isValidDmy(targetDate)) {
    alert("Enter target date in DD-MM-YYYY format.");
    return;
  }

  syncSuggestionDraftFromEditor();
  const id = document.getElementById("goalEditIdInput").value || createId();
  const existing = vault.goals.find((item) => item.id === id);
  const goal = normalizeGoal({
    id,
    type: document.getElementById("goalTypeInput").value,
    text: document.getElementById("goalTextInput").value.trim(),
    reason: document.getElementById("goalReasonInput").value.trim(),
    targetDate,
    progress: document.getElementById("goalProgressInput").value.trim(),
    measures: document.getElementById("goalMeasuresInput").value.trim(),
    initiatives: document.getElementById("goalInitiativesInput").value.trim(),
    suggestions: goalSuggestionDraft,
    notes: existing?.notes || [],
    updatedAt: todayDmy(),
  });
  const index = vault.goals.findIndex((item) => item.id === id);
  if (index >= 0) {
    vault.goals[index] = goal;
  } else {
    vault.goals.unshift(goal);
  }
  resetGoalForm();
  savePortal();
  render();
});

document.getElementById("goalCancelEditBtn").addEventListener("click", resetGoalForm);

document.getElementById("goalList").addEventListener("submit", (event) => {
  const form = event.target.closest("[data-goal-note-form]");
  if (!form) {
    return;
  }

  event.preventDefault();
  const goal = vault.goals.find((item) => item.id === form.dataset.goalNoteForm);
  if (!goal) {
    return;
  }

  const formData = new FormData(form);
  const date = String(formData.get("date") || "").trim();
  if (!date || !isValidDmy(date)) {
    alert("Enter note date in DD-MM-YYYY format.");
    return;
  }

  goal.notes.unshift({
    id: createId(),
    date,
    action: String(formData.get("action") || "").trim(),
    progress: String(formData.get("progress") || "").trim(),
    nextStep: String(formData.get("nextStep") || "").trim(),
  });
  savePortal();
  render();
});

resetGoalForm();
configureAuthPanel();
render();
