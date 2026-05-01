const STORAGE_KEY = "lifevault-data-v1";
const DEFAULT_PASSCODE = "1234";

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
  capsules: [],
  dreams: [],
  legacyNotes: [],
  memories: [],
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

const sections = {
  dashboard: document.getElementById("dashboardSection"),
  emergency: document.getElementById("emergencySection"),
  capsules: document.getElementById("capsulesSection"),
  dreams: document.getElementById("dreamsSection"),
  legacy: document.getElementById("legacySection"),
  memories: document.getElementById("memoriesSection"),
};

const sectionNames = {
  dashboard: "Overview",
  emergency: "Emergency",
  capsules: "Time Capsules",
  dreams: "Dream Patterns",
  legacy: "Legacy Notes",
  memories: "Memory Lane",
};

function loadVault() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(emptyVault);
  }

  try {
    return { ...structuredClone(emptyVault), ...JSON.parse(saved) };
  } catch {
    return structuredClone(emptyVault);
  }
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

function addRecord(collectionName, record) {
  vault[collectionName].unshift({
    id: crypto.randomUUID(),
    createdAt: todayIso(),
    ...record,
  });
  saveVault();
  render();
}

function getTotalRecords() {
  return vault.capsules.length + vault.dreams.length + vault.legacyNotes.length + vault.memories.length;
}

function isEmergencyComplete() {
  return Boolean(vault.emergency.fullName && vault.emergency.contactPhone);
}

function getKeywordStats() {
  const counts = new Map();

  vault.dreams.forEach((dream) => {
    dream.keywords
      .split(",")
      .map((keyword) => keyword.trim().toLowerCase())
      .filter(Boolean)
      .forEach((keyword) => counts.set(keyword, (counts.get(keyword) || 0) + 1));
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getMoodStats() {
  const counts = new Map();

  vault.dreams.forEach((dream) => {
    counts.set(dream.mood, (counts.get(dream.mood) || 0) + 1);
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
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
  const lockedCapsules = vault.capsules.filter((capsule) => daysUntil(capsule.unlockDate) > 0).length;
  const keywordStats = getKeywordStats();

  document.getElementById("emergencyStatus").textContent = isEmergencyComplete() ? "Ready" : "Incomplete";
  document.getElementById("lockedCapsuleCount").textContent = lockedCapsules;
  document.getElementById("keywordCount").textContent = keywordStats.length;
  document.getElementById("totalRecordCount").textContent = getTotalRecords();

  const prioritySnapshot = document.getElementById("prioritySnapshot");
  const snapshotItems = [
    {
      title: "Emergency Access",
      detail: isEmergencyComplete() ? "Profile and contact are available." : "Add name and contact number.",
    },
    {
      title: "Next Capsule",
      detail: getNextCapsuleText(),
    },
    {
      title: "Top Dream Pattern",
      detail: keywordStats[0] ? `${keywordStats[0][0]} appeared ${keywordStats[0][1]} time(s).` : "No dream keywords yet.",
    },
  ];

  prioritySnapshot.innerHTML = snapshotItems.map(renderSummaryItem).join("");

  const recentEntries = document.getElementById("recentEntries");
  const allEntries = [
    ...vault.capsules.map((item) => ({ title: item.title, detail: `Capsule, ${formatDate(item.createdAt)}` })),
    ...vault.dreams.map((item) => ({ title: item.title, detail: `Dream, ${item.mood}` })),
    ...vault.legacyNotes.map((item) => ({ title: item.title, detail: `Legacy, ${item.category}` })),
    ...vault.memories.map((item) => ({ title: item.title, detail: `Memory, ${item.category}` })),
  ].slice(0, 5);

  recentEntries.innerHTML = allEntries.length
    ? allEntries.map(renderSummaryItem).join("")
    : renderSummaryItem({ title: "No records yet", detail: "The vault is ready for first entry." });
}

function getNextCapsuleText() {
  const upcoming = vault.capsules
    .map((capsule) => ({ ...capsule, remaining: daysUntil(capsule.unlockDate) }))
    .filter((capsule) => capsule.remaining > 0)
    .sort((a, b) => a.remaining - b.remaining)[0];

  if (!upcoming) {
    return "No locked capsules waiting.";
  }

  return `${upcoming.title} opens in ${upcoming.remaining} day(s).`;
}

function renderSummaryItem(item) {
  return `
    <div class="summary-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </div>
  `;
}

function renderCapsules() {
  const capsuleList = document.getElementById("capsuleList");

  capsuleList.innerHTML = vault.capsules.length
    ? vault.capsules
        .map((capsule) => {
          const remaining = daysUntil(capsule.unlockDate);
          const unlocked = remaining <= 0;
          return `
            <article class="record-card">
              <div class="record-head">
                <div>
                  <h3>${escapeHtml(capsule.title)}</h3>
                  <div class="record-meta">Unlock date: ${formatDate(capsule.unlockDate)}</div>
                </div>
                <span class="pill ${unlocked ? "open" : ""}">
                  ${unlocked ? "Unlocked" : `${remaining} day(s) left`}
                </span>
              </div>
              <p class="record-body">${unlocked ? escapeHtml(capsule.message) : "This message is locked until its unlock date."}</p>
            </article>
          `;
        })
        .join("")
    : renderEmptyRecord("No time capsules saved.");
}

function renderDreams() {
  const dreamPatterns = document.getElementById("dreamPatterns");
  const keywordStats = getKeywordStats().slice(0, 6);
  const moodStats = getMoodStats().slice(0, 4);
  const patternItems = [
    ...keywordStats.map(([keyword, count]) => ({ label: keyword, value: `${count} keyword hit(s)` })),
    ...moodStats.map(([mood, count]) => ({ label: mood, value: `${count} mood record(s)` })),
  ];

  dreamPatterns.innerHTML = patternItems.length
    ? patternItems
        .map(
          (item) => `
            <div class="pattern-item">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.value)}</span>
            </div>
          `,
        )
        .join("")
    : renderEmptyRecord("No dream patterns yet.");

  document.getElementById("dreamList").innerHTML = vault.dreams.length
    ? vault.dreams
        .map(
          (dream) => `
            <article class="record-card">
              <div class="record-head">
                <div>
                  <h3>${escapeHtml(dream.title)}</h3>
                  <div class="record-meta">${escapeHtml(dream.mood)} mood, ${formatDate(dream.createdAt)}</div>
                </div>
                <span class="pill open">${escapeHtml(dream.keywords || "No keywords")}</span>
              </div>
              <p class="record-body">${escapeHtml(dream.notes)}</p>
            </article>
          `,
        )
        .join("")
    : renderEmptyRecord("No dream entries saved.");
}

function renderLegacyNotes() {
  document.getElementById("legacyList").innerHTML = vault.legacyNotes.length
    ? vault.legacyNotes
        .map(
          (note) => `
            <article class="record-card">
              <div class="record-head">
                <div>
                  <h3>${escapeHtml(note.title)}</h3>
                  <div class="record-meta">${escapeHtml(note.category)}, ${formatDate(note.createdAt)}</div>
                </div>
              </div>
              <p class="record-body">${escapeHtml(note.message)}</p>
            </article>
          `,
        )
        .join("")
    : renderEmptyRecord("No legacy notes saved.");
}

function renderMemories() {
  document.getElementById("memoryList").innerHTML = vault.memories.length
    ? vault.memories
        .map(
          (memory) => `
            <article class="record-card">
              <div class="record-head">
                <div>
                  <h3>${escapeHtml(memory.title)}</h3>
                  <div class="record-meta">${escapeHtml(memory.category)}, ${formatDate(memory.createdAt)}</div>
                </div>
              </div>
              <p class="record-body">${escapeHtml(memory.message)}</p>
            </article>
          `,
        )
        .join("")
    : renderEmptyRecord("No memories saved.");
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
  const totalRecords = getTotalRecords();
  recordCountText.textContent = `${totalRecords} ${totalRecords === 1 ? "record" : "records"}`;
  renderDashboard();
  renderEmergencyModule();
  renderCapsules();
  renderDreams();
  renderLegacyNotes();
  renderMemories();
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

document.getElementById("capsuleForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addRecord("capsules", {
    title: document.getElementById("capsuleTitleInput").value.trim(),
    unlockDate: document.getElementById("capsuleDateInput").value,
    message: document.getElementById("capsuleMessageInput").value.trim(),
  });
  event.target.reset();
});

document.getElementById("dreamForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addRecord("dreams", {
    title: document.getElementById("dreamTitleInput").value.trim(),
    mood: document.getElementById("dreamMoodInput").value,
    keywords: document.getElementById("dreamKeywordsInput").value.trim(),
    notes: document.getElementById("dreamNotesInput").value.trim(),
  });
  event.target.reset();
});

document.getElementById("legacyForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addRecord("legacyNotes", {
    title: document.getElementById("legacyTitleInput").value.trim(),
    category: document.getElementById("legacyCategoryInput").value,
    message: document.getElementById("legacyMessageInput").value.trim(),
  });
  event.target.reset();
});

document.getElementById("memoryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addRecord("memories", {
    title: document.getElementById("memoryTitleInput").value.trim(),
    category: document.getElementById("memoryCategoryInput").value,
    message: document.getElementById("memoryMessageInput").value.trim(),
  });
  event.target.reset();
});

document.getElementById("capsuleDateInput").min = todayIso();
render();
