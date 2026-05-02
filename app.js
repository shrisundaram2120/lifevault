const STORAGE_KEY = "lifevault-data-v2";
const LEGACY_STORAGE_KEY = "lifevault-data-v1";
const DEFAULT_PASSCODE = "1234";

const recordTypeLabels = {
  event: "Life Event",
  future: "Future Message",
  dream: "Dream Signal",
  legacy: "Legacy Instruction",
  memory: "Memory or Goal",
};

const recordTypeHints = {
  event: "Use this for decisions, mistakes, warnings, health notes, or important incidents.",
  future: "Use this as a time capsule. Add an unlock date to keep the message hidden until then.",
  dream: "Use this for dreams, symbols, moods, and repeated subconscious patterns.",
  legacy: "Use this for important instructions, wishes, asset notes, or messages for trusted people.",
  memory: "Use this for achievements, promises, lessons, gratitude, and goals.",
};

const emptyVault = {
  passcode: DEFAULT_PASSCODE,
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

let vault = loadVault();
let activeSection = "dashboard";

const lockScreen = document.getElementById("lockScreen");
const vaultScreen = document.getElementById("vaultScreen");
const unlockForm = document.getElementById("unlockForm");
const emergencyAccessBtn = document.getElementById("emergencyAccessBtn");
const authMessage = document.getElementById("authMessage");
const passcodeInput = document.getElementById("passcodeInput");
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

function loadVault() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!saved) {
    return structuredClone(emptyVault);
  }

  try {
    return normalizeVault(JSON.parse(saved));
  } catch {
    return structuredClone(emptyVault);
  }
}

function normalizeVault(saved) {
  const normalized = structuredClone(emptyVault);
  normalized.passcode = saved.passcode || DEFAULT_PASSCODE;
  normalized.emergency = { ...normalized.emergency, ...(saved.emergency || {}) };

  if (Array.isArray(saved.records)) {
    normalized.records = saved.records.map(normalizeRecord);
    return normalized;
  }

  normalized.records = [
    ...(saved.capsules || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      type: "future",
      title: item.title,
      mood: "Calm",
      tags: "future, message",
      unlockDate: item.unlockDate,
      outcome: "Pending",
      stress: 5,
      energy: 5,
      decision: "",
      body: item.message,
      createdAt: item.createdAt || todayIso(),
    })),
    ...(saved.dreams || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      type: "dream",
      title: item.title,
      mood: item.mood,
      tags: item.keywords,
      unlockDate: "",
      outcome: "Neutral",
      stress: 5,
      energy: 5,
      decision: "",
      body: item.notes,
      createdAt: item.createdAt || todayIso(),
    })),
    ...(saved.legacyNotes || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      type: "legacy",
      title: item.title,
      mood: "Calm",
      tags: item.category,
      unlockDate: "",
      outcome: "Pending",
      stress: 5,
      energy: 5,
      decision: item.category,
      body: item.message,
      createdAt: item.createdAt || todayIso(),
    })),
    ...(saved.memories || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      type: "memory",
      title: item.title,
      mood: "Happy",
      tags: item.category,
      unlockDate: "",
      outcome: "Good",
      stress: 3,
      energy: 7,
      decision: item.category,
      body: item.message,
      createdAt: item.createdAt || todayIso(),
    })),
    ...(saved.blackBoxEvents || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      type: "event",
      title: item.title,
      mood: item.mood,
      tags: "black box, life event",
      unlockDate: "",
      outcome: item.outcome,
      stress: item.stress,
      energy: item.energy,
      decision: item.decision,
      body: item.notes,
      createdAt: item.createdAt || todayIso(),
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
    unlockDate: record.unlockDate || "",
    outcome: record.outcome || "Pending",
    stress: record.stress || 5,
    energy: record.energy || 5,
    decision: record.decision || "",
    body: record.body || record.message || record.notes || "",
    createdAt: record.createdAt || todayIso(),
  };
}

function saveVault() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "No date";
  }

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(dateValue) {
  if (!dateValue) {
    return 0;
  }

  const today = new Date(`${todayIso()}T00:00:00`);
  const target = new Date(`${dateValue}T00:00:00`);
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
    createdAt: todayIso(),
    ...record,
  });
  saveVault();
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
  todayText.textContent = formatDate(todayIso());
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
  if (passcodeInput.value !== vault.passcode) {
    authMessage.textContent = "Incorrect passcode.";
    return;
  }

  passcodeInput.value = "";
  authMessage.textContent = "";
  lockScreen.classList.add("hidden");
  vaultScreen.classList.remove("hidden");
  showSection("dashboard");
});

emergencyAccessBtn.addEventListener("click", () => {
  renderEmergencyCard(emergencyDialogContent);
  emergencyDialog.showModal();
});

closeEmergencyDialog.addEventListener("click", () => emergencyDialog.close());

lockBtn.addEventListener("click", () => {
  vaultScreen.classList.add("hidden");
  lockScreen.classList.remove("hidden");
});

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => showSection(button.dataset.section));
});

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
  saveVault();
  render();
});

document.getElementById("recordForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addLifeRecord({
    title: document.getElementById("recordTitleInput").value.trim(),
    type: recordTypeInput.value,
    mood: document.getElementById("recordMoodInput").value,
    tags: document.getElementById("recordTagsInput").value.trim(),
    unlockDate: document.getElementById("recordUnlockDateInput").value,
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

document.getElementById("recordUnlockDateInput").min = todayIso();
render();
