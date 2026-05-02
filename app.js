const USERS_STORAGE_KEY = "lifevault-users-v1";
const LEGACY_STORAGE_KEYS = ["lifevault-data-v2", "lifevault-data-v1"];
const DEFAULT_PASSCODE = "1234";
const DEFAULT_GMAIL = "user@gmail.com";

const recordTypeLabels = {
  event: "Life Event",
  future: "Future Message",
  dream: "Dream Signal",
  legacy: "Legacy Instruction",
  memory: "Memory or Goal",
};

const recordTypeHints = {
  event: "Use this for decisions, mistakes, warnings, health notes, or important incidents.",
  future: "Use this as a time capsule. Add an unlock date in DD-MM-YYYY format.",
  dream: "Use this for dreams, symbols, moods, and repeated subconscious patterns.",
  legacy: "Use this for important instructions, wishes, asset notes, or messages for trusted people.",
  memory: "Use this for achievements, promises, lessons, gratitude, and goals.",
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
  records: [],
};

let portal = loadPortal();
let activeEmail = portal.lastEmail || "";
let vault = getActiveAccount()?.vault || structuredClone(emptyVault);
let authMode = getActiveAccount() ? "login" : "join";
let activeSection = "dashboard";

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
const sectionTitle = document.getElementById("sectionTitle");
const todayText = document.getElementById("todayText");
const recordCountText = document.getElementById("recordCountText");
const emergencyDialog = document.getElementById("emergencyDialog");
const emergencyDialogContent = document.getElementById("emergencyDialogContent");
const closeEmergencyDialog = document.getElementById("closeEmergencyDialog");
const recordTypeInput = document.getElementById("recordTypeInput");
const recordTypeHint = document.getElementById("recordTypeHint");

const sections = {
  dashboard: document.getElementById("dashboardSection"),
  emergency: document.getElementById("emergencySection"),
  recorder: document.getElementById("recorderSection"),
  insights: document.getElementById("insightsSection"),
};

const sectionNames = {
  dashboard: "Overview",
  emergency: "Emergency",
  recorder: "Life Recorder",
  insights: "Insights",
};

function loadPortal() {
  const saved = localStorage.getItem(USERS_STORAGE_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return normalizePortal(parsed);
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
  return {
    lastEmail: "",
    users: {},
  };
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

  if (Array.isArray(saved.records)) {
    normalized.records = saved.records.map(normalizeRecord);
    return normalized;
  }

  normalized.records = [
    ...(saved.capsules || []).map((item) => normalizeRecord({
      id: item.id,
      type: "future",
      title: item.title,
      mood: "Calm",
      tags: "future, message",
      unlockDate: normalizeDate(item.unlockDate),
      outcome: "Pending",
      stress: 5,
      energy: 5,
      decision: "",
      body: item.message,
      createdAt: normalizeDate(item.createdAt),
    })),
    ...(saved.dreams || []).map((item) => normalizeRecord({
      id: item.id,
      type: "dream",
      title: item.title,
      mood: item.mood,
      tags: item.keywords,
      outcome: "Neutral",
      body: item.notes,
      createdAt: normalizeDate(item.createdAt),
    })),
    ...(saved.legacyNotes || []).map((item) => normalizeRecord({
      id: item.id,
      type: "legacy",
      title: item.title,
      mood: "Calm",
      tags: item.category,
      outcome: "Pending",
      decision: item.category,
      body: item.message,
      createdAt: normalizeDate(item.createdAt),
    })),
    ...(saved.memories || []).map((item) => normalizeRecord({
      id: item.id,
      type: "memory",
      title: item.title,
      mood: "Happy",
      tags: item.category,
      outcome: "Good",
      stress: 3,
      energy: 7,
      decision: item.category,
      body: item.message,
      createdAt: normalizeDate(item.createdAt),
    })),
    ...(saved.blackBoxEvents || []).map((item) => normalizeRecord({
      id: item.id,
      type: "event",
      title: item.title,
      mood: item.mood,
      tags: "black box, life event",
      outcome: item.outcome,
      stress: item.stress,
      energy: item.energy,
      decision: item.decision,
      body: item.notes,
      createdAt: normalizeDate(item.createdAt),
    })),
  ];

  return normalized;
}

function normalizeRecord(record) {
  return {
    id: record.id || crypto.randomUUID(),
    type: record.type || "event",
    title: record.title || "Untitled Record",
    mood: record.mood || "Calm",
    tags: record.tags || "",
    unlockDate: normalizeDate(record.unlockDate || ""),
    outcome: record.outcome || "Pending",
    stress: record.stress || 5,
    energy: record.energy || 5,
    decision: record.decision || "",
    body: record.body || record.message || record.notes || "",
    createdAt: normalizeDate(record.createdAt || todayDmy()),
  };
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

  const parsed = parseDmy(dateValue);
  return Boolean(parsed);
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

function daysUntil(dateValue) {
  if (!dateValue) {
    return 0;
  }

  const target = parseDmy(normalizeDate(dateValue));
  const today = parseDmy(todayDmy());

  if (!target || !today) {
    return 0;
  }

  return Math.ceil((target - today) / 86400000);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addLifeRecord(record) {
  vault.records.unshift({
    id: crypto.randomUUID(),
    createdAt: todayDmy(),
    ...record,
  });
  savePortal();
  render();
}

function isEmergencyComplete() {
  return Boolean(vault.emergency.fullName && vault.emergency.contactPhone);
}

function isLocked(record) {
  return Boolean(record.unlockDate && daysUntil(record.unlockDate) > 0);
}

function getTags(record) {
  return String(record.tags || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function getTagStats() {
  const counts = new Map();

  vault.records.forEach((record) => {
    getTags(record).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getMoodStats() {
  const counts = new Map();

  vault.records.forEach((record) => {
    counts.set(record.mood, (counts.get(record.mood) || 0) + 1);
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function calculateRisk(record) {
  let score = 0;
  const stress = Number(record.stress || 5);
  const energy = Number(record.energy || 5);

  score += stress * 7;
  score += (10 - energy) * 4;

  if (record.outcome === "Bad") {
    score += 20;
  } else if (record.outcome === "Neutral" || record.outcome === "Pending") {
    score += 8;
  }

  if (["Anxious", "Stressed", "Angry", "Low"].includes(record.mood)) {
    score += 12;
  }

  if (record.type === "dream" && ["Anxious", "Confused", "Low"].includes(record.mood)) {
    score += 6;
  }

  return Math.min(100, score);
}

function getRiskLabel(score) {
  if (score >= 80) {
    return "Critical";
  }

  if (score >= 60) {
    return "High";
  }

  if (score >= 35) {
    return "Moderate";
  }

  return "Low";
}

function getSignalStats() {
  const records = vault.records;
  const highRiskRecords = records.filter((record) => calculateRisk(record) >= 70);
  const lockedRecords = records.filter(isLocked);
  const averageStress = records.length
    ? Math.round(records.reduce((total, record) => total + Number(record.stress || 5), 0) / records.length)
    : 0;
  const averageEnergy = records.length
    ? Math.round(records.reduce((total, record) => total + Number(record.energy || 5), 0) / records.length)
    : 0;
  const badOutcomes = records.filter((record) => record.outcome === "Bad").length;

  return { highRiskRecords, lockedRecords, averageStress, averageEnergy, badOutcomes };
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
      ${fields
        .map(
          ([label, value]) => `
            <div class="emergency-field">
              <span>${label}</span>
              <strong>${escapeHtml(value) || "Not added"}</strong>
            </div>
          `,
        )
        .join("")}
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
  showSection("dashboard");
}

function renderDashboard() {
  const tagStats = getTagStats();
  const signalStats = getSignalStats();

  document.getElementById("emergencyStatus").textContent = isEmergencyComplete() ? "Ready" : "Incomplete";
  document.getElementById("lockedCapsuleCount").textContent = signalStats.lockedRecords.length;
  document.getElementById("keywordCount").textContent = tagStats.length;
  document.getElementById("totalRecordCount").textContent = vault.records.length;

  const snapshotItems = [
    {
      title: "Emergency Access",
      detail: isEmergencyComplete() ? "Emergency card is ready without unlocking the vault." : "Add name and contact number.",
    },
    {
      title: "Next Locked Record",
      detail: getNextLockedRecordText(),
    },
    {
      title: "Strongest Pattern",
      detail: tagStats[0] ? `${tagStats[0][0]} appeared ${tagStats[0][1]} time(s).` : "No tags recorded yet.",
    },
    {
      title: "Risk Signals",
      detail: signalStats.highRiskRecords.length
        ? `${signalStats.highRiskRecords.length} high-risk life signal(s) detected.`
        : "No high-risk life signal detected.",
    },
  ];

  document.getElementById("prioritySnapshot").innerHTML = snapshotItems.map(renderSummaryItem).join("");

  const recentEntries = vault.records.slice(0, 5).map((record) => ({
    title: record.title,
    detail: `${recordTypeLabels[record.type]} | ${getRiskLabel(calculateRisk(record))} risk`,
  }));

  document.getElementById("recentEntries").innerHTML = recentEntries.length
    ? recentEntries.map(renderSummaryItem).join("")
    : renderSummaryItem({ title: "No life records yet", detail: "Add one record and LifeVault starts learning patterns." });
}

function getNextLockedRecordText() {
  const nextRecord = vault.records
    .filter(isLocked)
    .map((record) => ({ ...record, remaining: daysUntil(record.unlockDate) }))
    .sort((a, b) => a.remaining - b.remaining)[0];

  if (!nextRecord) {
    return "No locked future records waiting.";
  }

  return `${nextRecord.title} opens in ${nextRecord.remaining} day(s).`;
}

function renderSummaryItem(item) {
  return `
    <div class="summary-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </div>
  `;
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

function renderTimeline() {
  document.getElementById("recordTimeline").innerHTML = vault.records.length
    ? vault.records.map(renderRecordCard).join("")
    : renderEmptyRecord("No life records saved.");
}

function renderRecordCard(record) {
  const riskScore = calculateRisk(record);
  const locked = isLocked(record);
  const body = locked ? "This future record is locked until its unlock date." : escapeHtml(record.body);

  return `
    <article class="record-card">
      <div class="record-head">
        <div>
          <h3>${escapeHtml(record.title)}</h3>
          <div class="record-meta">
            ${recordTypeLabels[record.type]} | ${formatDate(record.createdAt)} | Mood: ${escapeHtml(record.mood)}
          </div>
        </div>
        <span class="pill ${riskScore < 60 ? "open" : ""}">${locked ? `${daysUntil(record.unlockDate)} day(s) left` : `${getRiskLabel(riskScore)} ${riskScore}%`}</span>
      </div>
      <p class="record-body">Decision: ${escapeHtml(record.decision || "Not recorded")}\nOutcome: ${escapeHtml(record.outcome)}\nTags: ${escapeHtml(record.tags || "No tags")}\n${body}</p>
    </article>
  `;
}

function renderInsights() {
  const signalStats = getSignalStats();
  const moodStats = getMoodStats().slice(0, 5);
  const tagStats = getTagStats().slice(0, 8);
  const signalItems = [
    { label: "High-Risk Records", value: `${signalStats.highRiskRecords.length} record(s)` },
    { label: "Average Stress", value: vault.records.length ? `${signalStats.averageStress}/10` : "No records yet" },
    { label: "Average Energy", value: vault.records.length ? `${signalStats.averageEnergy}/10` : "No records yet" },
    { label: "Bad Outcomes", value: `${signalStats.badOutcomes} outcome(s)` },
    { label: "Locked Future Records", value: `${signalStats.lockedRecords.length} record(s)` },
  ];

  document.getElementById("insightSignals").innerHTML = signalItems.map(renderPatternItem).join("");

  const patternItems = [
    ...tagStats.map(([label, count]) => ({ label, value: `${count} tag hit(s)` })),
    ...moodStats.map(([label, count]) => ({ label, value: `${count} mood record(s)` })),
  ];

  document.getElementById("patternInsights").innerHTML = patternItems.length
    ? patternItems.map(renderPatternItem).join("")
    : renderEmptyRecord("No patterns yet.");

  document.getElementById("highRiskList").innerHTML = signalStats.highRiskRecords.length
    ? signalStats.highRiskRecords.map(renderRecordCard).join("")
    : renderEmptyRecord("No records currently need attention.");
}

function renderPatternItem(item) {
  return `
    <div class="pattern-item">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.value)}</span>
    </div>
  `;
}

function renderEmptyRecord(message) {
  return `<div class="summary-item"><strong>${escapeHtml(message)}</strong><span>Ready when you are.</span></div>`;
}

function updateTypeHint() {
  recordTypeHint.textContent = recordTypeHints[recordTypeInput.value];
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
  const totalRecords = vault.records.length;
  recordCountText.textContent = `${totalRecords} ${totalRecords === 1 ? "record" : "records"}`;
  renderDashboard();
  renderEmergencyModule();
  renderTimeline();
  renderInsights();
  updateTypeHint();
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

lockBtn.addEventListener("click", () => {
  savePortal();
  vaultScreen.classList.add("hidden");
  lockScreen.classList.remove("hidden");
  authMode = getActiveAccount() ? "login" : "join";
  configureAuthPanel();
});

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => showSection(button.dataset.section));
});

switchAuthBtn.addEventListener("click", () => {
  authMode = authMode === "join" ? "login" : "join";
  authMessage.textContent = "";
  passcodeInput.value = "";
  configureAuthPanel();
});

secretTypeInput.addEventListener("change", configureAuthPanel);
recordTypeInput.addEventListener("change", updateTypeHint);

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

document.getElementById("recordForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const unlockDate = document.getElementById("recordUnlockDateInput").value.trim();

  if (!isValidDmy(unlockDate)) {
    alert("Enter unlock date in DD-MM-YYYY format.");
    return;
  }

  addLifeRecord({
    title: document.getElementById("recordTitleInput").value.trim(),
    type: recordTypeInput.value,
    mood: document.getElementById("recordMoodInput").value,
    tags: document.getElementById("recordTagsInput").value.trim(),
    unlockDate,
    outcome: document.getElementById("recordOutcomeInput").value,
    stress: document.getElementById("recordStressInput").value,
    energy: document.getElementById("recordEnergyInput").value,
    decision: document.getElementById("recordDecisionInput").value.trim(),
    body: document.getElementById("recordBodyInput").value.trim(),
  });
  event.target.reset();
  document.getElementById("recordStressInput").value = 5;
  document.getElementById("recordEnergyInput").value = 5;
  updateTypeHint();
});

configureAuthPanel();
render();
