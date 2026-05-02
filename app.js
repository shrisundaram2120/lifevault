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
  event: "A diary entry for something that happened, why it mattered, and what it taught you.",
  future: "A time-locked note for your future self. Add an unlock date in DD-MM-YYYY format.",
  dream: "A dream diary entry for scenes, emotions, symbols, and repeated patterns.",
  legacy: "A private instruction, wish, or message you want trusted people to understand clearly.",
  memory: "A preserved memory, goal, promise, or personal milestone you want to keep.",
};

const recordTypeQuestions = {
  event: [
    { key: "whatHappened", label: "What happened?", rows: 3 },
    { key: "whyImportant", label: "Why did it matter?", rows: 3 },
    { key: "lesson", label: "What did you learn or decide?", rows: 3 },
  ],
  future: [
    { key: "futureMessage", label: "What should future you read?", rows: 4 },
    { key: "reasonToLock", label: "Why should this open later?", rows: 3 },
    { key: "futureReminder", label: "What reminder should it carry?", rows: 3 },
  ],
  dream: [
    { key: "dreamScene", label: "What did you see in the dream?", rows: 4 },
    { key: "dreamFeeling", label: "How did it feel after waking up?", rows: 3 },
    { key: "dreamSymbols", label: "Which symbols or words repeated?", rows: 3 },
  ],
  legacy: [
    { key: "recipient", label: "Who is this meant for?", rows: 2 },
    { key: "instruction", label: "What message or instruction should remain?", rows: 4 },
    { key: "importance", label: "Why is this important?", rows: 3 },
  ],
  memory: [
    { key: "memory", label: "What memory or goal do you want to keep?", rows: 4 },
    { key: "meaning", label: "What made it meaningful?", rows: 3 },
    { key: "promise", label: "What next step or promise belongs with it?", rows: 3 },
  ],
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
const recordDateInput = document.getElementById("recordDateInput");
const recordUnlockDateField = document.getElementById("recordUnlockDateField");
const recordUnlockDateInput = document.getElementById("recordUnlockDateInput");
const recordQuestions = document.getElementById("recordQuestions");

const sections = {
  dashboard: document.getElementById("dashboardSection"),
  emergency: document.getElementById("emergencySection"),
  recorder: document.getElementById("recorderSection"),
  insights: document.getElementById("insightsSection"),
};

const sectionNames = {
  dashboard: "Overview",
  emergency: "Emergency",
  recorder: "Online Diary",
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
      body: item.message,
      createdAt: normalizeDate(item.createdAt),
    })),
    ...(saved.dreams || []).map((item) => normalizeRecord({
      id: item.id,
      type: "dream",
      title: item.title,
      mood: item.mood,
      tags: item.keywords,
      body: item.notes,
      createdAt: normalizeDate(item.createdAt),
    })),
    ...(saved.legacyNotes || []).map((item) => normalizeRecord({
      id: item.id,
      type: "legacy",
      title: item.title,
      mood: "Calm",
      tags: item.category,
      body: item.message,
      createdAt: normalizeDate(item.createdAt),
    })),
    ...(saved.memories || []).map((item) => normalizeRecord({
      id: item.id,
      type: "memory",
      title: item.title,
      mood: "Happy",
      tags: item.category,
      body: item.message,
      createdAt: normalizeDate(item.createdAt),
    })),
    ...(saved.blackBoxEvents || []).map((item) => normalizeRecord({
      id: item.id,
      type: "event",
      title: item.title,
      mood: item.mood,
      tags: "black box, life event",
      decision: item.decision,
      body: item.notes,
      createdAt: normalizeDate(item.createdAt),
    })),
  ];

  return normalized;
}

function normalizeRecord(record) {
  const type = recordTypeLabels[record.type] ? record.type : "event";

  return {
    id: record.id || crypto.randomUUID(),
    type,
    title: record.title || "Untitled Diary Entry",
    entryDate: normalizeDate(record.entryDate || record.createdAt || todayDmy()),
    mood: record.mood || "Calm",
    tags: record.tags || "",
    unlockDate: normalizeDate(record.unlockDate || ""),
    answers: normalizeAnswers(record, type),
    body: record.diaryBody || record.body || record.message || record.notes || "",
    createdAt: normalizeDate(record.createdAt || record.entryDate || todayDmy()),
  };
}

function normalizeAnswers(record, type) {
  const incoming = record.answers && typeof record.answers === "object" ? record.answers : {};
  const fallback = getLegacyAnswerFallbacks(record, type);
  const answers = {};

  recordTypeQuestions[type].forEach((question, index) => {
    answers[question.key] = incoming[question.key] || fallback[index] || "";
  });

  return answers;
}

function getLegacyAnswerFallbacks(record, type) {
  const oldBody = record.body || record.message || record.notes || "";
  const oldDecision = record.decision || "";

  if (type === "future") {
    return [oldBody, oldDecision, ""];
  }

  if (type === "dream") {
    return [oldBody, record.mood || "", record.tags || ""];
  }

  if (type === "legacy") {
    return [oldDecision, oldBody, ""];
  }

  if (type === "memory") {
    return [oldBody, oldDecision, ""];
  }

  return [oldBody, oldDecision, ""];
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

function getTypeStats() {
  const counts = new Map();

  vault.records.forEach((record) => {
    const label = recordTypeLabels[record.type] || "Life Event";
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getRecordText(record) {
  return [
    record.title,
    record.mood,
    record.tags,
    record.body,
    ...Object.values(record.answers || {}),
  ].join(" ").toLowerCase();
}

function needsReflection(record) {
  const text = getRecordText(record);
  const reflectionWords = [
    "anxious",
    "stressed",
    "angry",
    "low",
    "confused",
    "fear",
    "hurt",
    "lost",
    "warning",
    "urgent",
    "health",
    "doctor",
    "mistake",
    "regret",
  ];

  return reflectionWords.some((word) => text.includes(word));
}

function getDiaryStats() {
  const records = vault.records;
  const lockedRecords = records.filter(isLocked);
  const reflectionRecords = records.filter((record) => !isLocked(record) && needsReflection(record));

  return {
    lockedRecords,
    reflectionRecords,
    tagStats: getTagStats(),
    moodStats: getMoodStats(),
    typeStats: getTypeStats(),
  };
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
  const diaryStats = getDiaryStats();
  const tagStats = diaryStats.tagStats;
  const moodStats = diaryStats.moodStats;

  document.getElementById("emergencyStatus").textContent = isEmergencyComplete() ? "Ready" : "Incomplete";
  document.getElementById("lockedCapsuleCount").textContent = diaryStats.lockedRecords.length;
  document.getElementById("keywordCount").textContent = tagStats.length;
  document.getElementById("totalRecordCount").textContent = vault.records.length;

  const snapshotItems = [
    {
      title: "Emergency Access",
      detail: isEmergencyComplete() ? "Emergency card is ready without opening the private diary." : "Add name and contact number.",
    },
    {
      title: "Next Locked Entry",
      detail: getNextLockedRecordText(),
    },
    {
      title: "Strongest Pattern",
      detail: tagStats[0] ? `${tagStats[0][0]} appeared ${tagStats[0][1]} time(s).` : "No tags recorded yet.",
    },
    {
      title: "Mood Pattern",
      detail: moodStats[0] ? `${moodStats[0][0]} is the most repeated feeling.` : "No mood pattern yet.",
    },
  ];

  document.getElementById("prioritySnapshot").innerHTML = snapshotItems.map(renderSummaryItem).join("");

  const recentEntries = vault.records.slice(0, 5).map((record) => ({
    title: record.title,
    detail: `${recordTypeLabels[record.type]} | ${formatDate(record.entryDate)} | Mood: ${record.mood}`,
  }));

  document.getElementById("recentEntries").innerHTML = recentEntries.length
    ? recentEntries.map(renderSummaryItem).join("")
    : renderSummaryItem({ title: "No diary entries yet", detail: "Write the first entry and LifeVault starts building your personal timeline." });
}

function getNextLockedRecordText() {
  const nextRecord = vault.records
    .filter(isLocked)
    .map((record) => ({ ...record, remaining: daysUntil(record.unlockDate) }))
    .sort((a, b) => a.remaining - b.remaining)[0];

  if (!nextRecord) {
    return "No locked future entry waiting.";
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
    : renderEmptyRecord("No diary entries saved.");
}

function renderRecordCard(record) {
  const locked = isLocked(record);
  const answerItems = getRecordAnswerItems(record);
  const tagText = record.tags || "No tags";
  const body = record.body || "No extra diary note.";

  return `
    <article class="record-card ${locked ? "locked-record" : ""}">
      <div class="record-head">
        <div>
          <h3>${escapeHtml(record.title)}</h3>
          <div class="record-meta">
            ${recordTypeLabels[record.type]} | ${formatDate(record.entryDate)} | Mood: ${escapeHtml(record.mood)}
          </div>
        </div>
        <span class="pill ${locked ? "" : "open"}">${locked ? `${daysUntil(record.unlockDate)} day(s) left` : "Diary saved"}</span>
      </div>
      <div class="record-tags">${escapeHtml(tagText)}</div>
      ${
        locked
          ? `<p class="record-body">This future diary entry is locked until ${escapeHtml(record.unlockDate)}.</p>`
          : `
            <div class="record-answers">
              ${answerItems.map(renderRecordAnswer).join("")}
            </div>
            <p class="record-body">${escapeHtml(body)}</p>
          `
      }
    </article>
  `;
}

function getRecordAnswerItems(record) {
  const questions = recordTypeQuestions[record.type] || recordTypeQuestions.event;
  const answers = record.answers || {};

  return questions
    .map((question) => ({
      label: question.label,
      value: answers[question.key] || "",
    }))
    .filter((item) => item.value);
}

function renderRecordAnswer(item) {
  return `
    <div class="record-answer">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.value)}</span>
    </div>
  `;
}

function renderInsights() {
  const diaryStats = getDiaryStats();
  const moodStats = diaryStats.moodStats.slice(0, 5);
  const tagStats = diaryStats.tagStats.slice(0, 8);
  const typeStats = diaryStats.typeStats.slice(0, 5);
  const signalItems = [
    { label: "Diary Entries", value: `${vault.records.length} record(s)` },
    { label: "Locked Future Entries", value: `${diaryStats.lockedRecords.length} record(s)` },
    { label: "Reflection Prompts", value: `${diaryStats.reflectionRecords.length} record(s)` },
    { label: "Mood Patterns", value: moodStats.length ? `${moodStats.length} mood type(s)` : "No records yet" },
    { label: "Tags Captured", value: `${diaryStats.tagStats.length} unique tag(s)` },
  ];

  document.getElementById("insightSignals").innerHTML = signalItems.map(renderPatternItem).join("");

  const patternItems = [
    ...typeStats.map(([label, count]) => ({ label, value: `${count} diary entry(s)` })),
    ...tagStats.map(([label, count]) => ({ label, value: `${count} tag hit(s)` })),
    ...moodStats.map(([label, count]) => ({ label, value: `${count} mood record(s)` })),
  ];

  document.getElementById("patternInsights").innerHTML = patternItems.length
    ? patternItems.map(renderPatternItem).join("")
    : renderEmptyRecord("No patterns yet.");

  document.getElementById("reflectionList").innerHTML = diaryStats.reflectionRecords.length
    ? diaryStats.reflectionRecords.map(renderRecordCard).join("")
    : renderEmptyRecord("No diary entries currently need a revisit.");
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

function renderTypeQuestions() {
  const type = recordTypeInput.value;
  const questions = recordTypeQuestions[type] || recordTypeQuestions.event;

  recordTypeHint.textContent = recordTypeHints[type];
  recordUnlockDateField.classList.toggle("hidden", type !== "future");

  if (type !== "future") {
    recordUnlockDateInput.value = "";
  }

  recordQuestions.innerHTML = questions
    .map((question) => `
      <label class="span-two diary-question">
        <span>${escapeHtml(question.label)}</span>
        <textarea data-question-key="${question.key}" rows="${question.rows}" required></textarea>
      </label>
    `)
    .join("");
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
  renderTypeQuestions();
}

function resetRecordForm(form) {
  form.reset();
  recordDateInput.value = todayDmy();
  renderTypeQuestions();
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
recordTypeInput.addEventListener("change", renderTypeQuestions);

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
  const entryDate = document.getElementById("recordDateInput").value.trim();
  const unlockDate = recordTypeInput.value === "future" ? recordUnlockDateInput.value.trim() : "";

  if (!entryDate || !isValidDmy(entryDate)) {
    alert("Enter entry date in DD-MM-YYYY format.");
    return;
  }

  if (recordTypeInput.value === "future" && (!unlockDate || !isValidDmy(unlockDate))) {
    alert("Future messages need an unlock date in DD-MM-YYYY format.");
    return;
  }

  const answers = {};
  document.querySelectorAll("#recordQuestions [data-question-key]").forEach((input) => {
    answers[input.dataset.questionKey] = input.value.trim();
  });

  addLifeRecord({
    title: document.getElementById("recordTitleInput").value.trim(),
    type: recordTypeInput.value,
    entryDate,
    mood: document.getElementById("recordMoodInput").value,
    tags: document.getElementById("recordTagsInput").value.trim(),
    unlockDate,
    answers,
    body: document.getElementById("recordBodyInput").value.trim(),
  });

  resetRecordForm(event.target);
});

recordDateInput.value = todayDmy();
configureAuthPanel();
render();
