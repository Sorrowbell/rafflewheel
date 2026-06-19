const STORAGE_KEY = "raffleWheelFundraiserState";
const LEGACY_NAMES_KEY = "raffleWheelNames";
const SPIN_TIME = 5000;
const ADD_PRIZE_VALUE = "__add_custom_prize__";
const celebrationColors = ["#07184d", "#137d8d", "#ec4b1a", "#f7c800", "#3f8d35", "#1557c8", "#ffffff"];

const defaultPrizes = [
  { name: "Pie in the Face", icon: "🥧" },
  { name: "Wine Tasting", icon: "🍷" },
  { name: "4th of July Basket", icon: "🎆" },
  { name: "McMenamins Signature Pint & Passport Package", icon: "🌞" },
  { name: "Summer Fun Toy Basket", icon: "🏖️" },
  { name: "Nike Basket", icon: "✓" },
  { name: "The Cozy Reader", icon: "📚" },
  { name: "Mom and Baby Basket", icon: "🍼" },
  { name: "Thanks, A Latte Basket", icon: "☕" },
  { name: "Pet Lover Basket", icon: "🐾" }
];

const prizeAliases = {
  [getPrizeKey("Cozy Reader")]: "The Cozy Reader",
  [getPrizeKey("Wine Tasting")]: "Wine Tasting",
  [getPrizeKey("Summer Fun Toy Basket")]: "Summer Fun Toy Basket",
  [getPrizeKey("Nike")]: "Nike Basket",
  [getPrizeKey("Pet Lover")]: "Pet Lover Basket",
  [getPrizeKey("Coffee Basket")]: "Thanks, A Latte Basket",
  [getPrizeKey("McMenamins")]: "McMenamins Signature Pint & Passport Package",
  [getPrizeKey("Pie in the Face")]: "Pie in the Face",
  [getPrizeKey("4th of July Basket")]: "4th of July Basket",
  [getPrizeKey("Mom and Baby Basket")]: "Mom and Baby Basket"
};

const colors = [
  "#d94b5d",
  "#287c80",
  "#f3b43f",
  "#5b5fc7",
  "#e26d3f",
  "#3f9d68",
  "#2e75b6",
  "#b45ac9",
  "#d98c2b",
  "#48a6a7",
  "#bf3f68",
  "#6c8f36",
  "#805ad5",
  "#c05621",
  "#319795",
  "#d69e2e",
  "#4c6fff",
  "#9f7aea",
  "#38a169",
  "#ed64a6",
  "#2b6cb0",
  "#dd6b20",
  "#7b341e",
  "#667eea",
  "#ff6b6b",
  "#4ecdc4",
  "#ffe66d",
  "#1a535c",
  "#ff9f1c",
  "#2ec4b6",
  "#e71d36",
  "#6a4c93",
  "#1982c4",
  "#8ac926",
  "#ffca3a",
  "#f72585",
  "#7209b7",
  "#3a0ca3",
  "#4361ee",
  "#4cc9f0",
  "#06d6a0",
  "#ffd166",
  "#ef476f",
  "#118ab2",
  "#073b4c",
  "#bc6c25",
  "#dda15e",
  "#606c38",
  "#588157",
  "#a3b18a",
  "#9d4edd",
  "#c77dff",
  "#ffafcc",
  "#bde0fe",
  "#fb8500",
  "#219ebc",
  "#023047",
  "#d00000",
  "#ffba08",
  "#6a994e",
  "#386641",
  "#f3722c",
  "#577590",
  "#43aa8b",
  "#f94144",
  "#90be6d",
  "#277da1",
  "#b56576",
  "#6d597a",
  "#355070",
  "#e56b6f",
  "#eaac8b"
];

const state = {
  entries: [],
  winners: [],
  currentPrize: "",
  customPrizes: [],
  eventRows: []
};

const canvas = document.querySelector("#wheelCanvas");
const ctx = canvas.getContext("2d");
const wheelCard = document.querySelector(".wheel-card");
const wheelHoverLabel = document.querySelector("#wheelHoverLabel");
const ticketForm = document.querySelector("#ticketForm");
const nameInput = document.querySelector("#nameInput");
const ticketQuantityInput = document.querySelector("#ticketQuantityInput");
const prizeInput = document.querySelector("#prizeInput");
const prizePreview = document.querySelector("#prizePreview");
const eventFileInput = document.querySelector("#eventFileInput");
const eventDataInput = document.querySelector("#eventDataInput");
const loadEventDataButton = document.querySelector("#loadEventDataButton");
const eventDataSummary = document.querySelector("#eventDataSummary");
const soundToggle = document.querySelector("#soundToggle");
const participantSearchInput = document.querySelector("#participantSearchInput");
const participantList = document.querySelector("#participantList");
const winnerLogList = document.querySelector("#winnerLogList");
const spinButton = document.querySelector("#spinButton");
const clearEntriesButton = document.querySelector("#clearEntriesButton");
const clearWinnerLogButton = document.querySelector("#clearWinnerLogButton");
const exportWinnerLogButton = document.querySelector("#exportWinnerLogButton");
const resetRaffleButton = document.querySelector("#resetRaffleButton");
const totalTicketsText = document.querySelector("#totalTicketsText");
const uniqueParticipantsText = document.querySelector("#uniqueParticipantsText");
const winnersDrawnText = document.querySelector("#winnersDrawnText");
const oddsText = document.querySelector("#oddsText");
const winnerNameText = document.querySelector("#winnerNameText");
const winnerPrizeText = document.querySelector("#winnerPrizeText");
const messageText = document.querySelector("#messageText");
const confettiLayer = document.querySelector("#confettiLayer");

let currentRotation = 0;
let isSpinning = false;
let highlightedWinnerKey = "";
let tickTimer = null;
let audioContext = null;
let shuffledColors = shuffleColors(colors);
let nextColorIndex = 0;
const assignedNameColors = {};

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function getNameKey(name) {
  return normalizeName(name).toLowerCase();
}

function getPrizeKey(prizeName) {
  return normalizeName(prizeName).toLowerCase();
}

function canonicalizePrizeName(prizeName) {
  const normalizedPrize = normalizeName(prizeName);
  const aliasPrize = prizeAliases[getPrizeKey(normalizedPrize)];

  return aliasPrize || normalizedPrize;
}

function normalizeCustomPrizes(prizes) {
  const seenPrizes = new Set();

  return prizes
    .map((prize) => normalizeName(String(prize)))
    .filter((prize) => {
      const prizeKey = getPrizeKey(prize);

      if (!prizeKey || seenPrizes.has(prizeKey)) {
        return false;
      }

      seenPrizes.add(prizeKey);
      return true;
    });
}

function normalizeEventRows(rows) {
  return rows
    .map((row) => ({
      name: normalizeName(String(row.name || "")),
      prize: canonicalizePrizeName(String(row.prize || "")),
      tickets: Math.floor(Number(row.tickets))
    }))
    .filter((row) => row.name && row.prize && Number.isFinite(row.tickets) && row.tickets > 0);
}

function hasEventRows() {
  return state.eventRows.length > 0;
}

function getEventPrizeOptions() {
  const prizes = new Map();

  state.eventRows.forEach((row) => {
    const prizeKey = getPrizeKey(row.prize);
    const defaultPrize = defaultPrizes.find((prize) => getPrizeKey(prize.name) === prizeKey);
    const customPrize = state.customPrizes.find((name) => getPrizeKey(name) === prizeKey);

    if (!prizes.has(prizeKey)) {
      prizes.set(prizeKey, {
        name: customPrize || row.prize,
        icon: defaultPrize ? defaultPrize.icon : "🎁",
        eventPrize: true
      });
    }
  });

  return [...prizes.values()];
}

function getAllPrizes() {
  const customPrizeOptions = state.customPrizes.map((name) => ({
    name,
    icon: "🎁",
    custom: true
  }));

  if (!hasEventRows()) {
    return [...defaultPrizes, ...customPrizeOptions];
  }

  const eventPrizeOptions = getEventPrizeOptions();
  const eventPrizeKeys = new Set(eventPrizeOptions.map((prize) => getPrizeKey(prize.name)));
  const extraCustomPrizes = customPrizeOptions.filter((prize) => !eventPrizeKeys.has(getPrizeKey(prize.name)));

  return [...eventPrizeOptions, ...extraCustomPrizes];
}

function getPrizeByName(prizeName) {
  const prizeKey = getPrizeKey(prizeName);

  return getAllPrizes().find((prize) => getPrizeKey(prize.name) === prizeKey);
}

function prizeExists(prizeName) {
  return Boolean(getPrizeByName(prizeName));
}

function shuffleColors(colorList) {
  const shuffledList = [...colorList];

  for (let index = shuffledList.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const oldColor = shuffledList[index];

    shuffledList[index] = shuffledList[randomIndex];
    shuffledList[randomIndex] = oldColor;
  }

  return shuffledList;
}

function shuffleEntries() {
  for (let index = state.entries.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const oldEntry = state.entries[index];

    state.entries[index] = state.entries[randomIndex];
    state.entries[randomIndex] = oldEntry;
  }
}

function getColorForName(name) {
  const nameKey = getNameKey(name);

  if (!assignedNameColors[nameKey]) {
    assignedNameColors[nameKey] = shuffledColors[nextColorIndex];
    nextColorIndex += 1;

    if (nextColorIndex >= shuffledColors.length) {
      shuffledColors = shuffleColors(colors);
      nextColorIndex = 0;
    }
  }

  return assignedNameColors[nameKey];
}

function showMessage(message, type = "error") {
  messageText.textContent = message;
  messageText.dataset.type = type;
}

function resetWinnerDisplay() {
  winnerNameText.textContent = "No winner yet";
  winnerPrizeText.textContent = "";
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 2.2,
        "aria-hidden": "true"
      }
    });
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showMessage("This browser could not save the raffle data.");
  }
}

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    if (savedState && Array.isArray(savedState.entries)) {
      state.entries = savedState.entries.map((entry) => normalizeName(String(entry))).filter(Boolean);
      state.winners = Array.isArray(savedState.winners) ? savedState.winners : [];
      state.currentPrize = typeof savedState.currentPrize === "string" ? savedState.currentPrize : "";
      state.customPrizes = Array.isArray(savedState.customPrizes)
        ? normalizeCustomPrizes(savedState.customPrizes)
        : [];
      state.eventRows = Array.isArray(savedState.eventRows) ? normalizeEventRows(savedState.eventRows) : [];

      if (state.currentPrize && !prizeExists(state.currentPrize)) {
        state.customPrizes = normalizeCustomPrizes([...state.customPrizes, state.currentPrize]);
      }

      return;
    }
  } catch (error) {
    state.entries = [];
    state.winners = [];
    state.currentPrize = "";
    state.customPrizes = [];
    state.eventRows = [];
  }

  migrateLegacyNames();
}

function migrateLegacyNames() {
  try {
    const legacyNames = JSON.parse(localStorage.getItem(LEGACY_NAMES_KEY) || "[]");

    if (Array.isArray(legacyNames)) {
      state.entries = legacyNames.map((entry) => normalizeName(String(entry))).filter(Boolean);
    }
  } catch (error) {
    state.entries = [];
  }
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let currentValue = "";
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && isInsideQuotes && nextCharacter === '"') {
      currentValue += '"';
      index += 1;
    } else if (character === '"') {
      isInsideQuotes = !isInsideQuotes;
    } else if (character === delimiter && !isInsideQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
    } else {
      currentValue += character;
    }
  }

  values.push(currentValue.trim());
  return values;
}

function looksLikeHeader(columns) {
  const firstColumn = (columns[0] || "").toLowerCase();
  const secondColumn = (columns[1] || "").toLowerCase();
  const thirdColumn = (columns[2] || "").toLowerCase();

  return (
    firstColumn.includes("name") ||
    firstColumn.includes("participant") ||
    secondColumn.includes("prize") ||
    thirdColumn.includes("ticket")
  );
}

function parseTicketCount(value) {
  const cleanedValue = String(value).replace(/[^\d.-]/g, "");
  const count = Math.floor(Number(cleanedValue));

  return Number.isFinite(count) && count > 0 ? count : 0;
}

function parseEventData(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const parsedRows = [];
  let skippedRows = 0;

  lines.forEach((line, index) => {
    const columns = parseDelimitedLine(line, delimiter);

    if (index === 0 && looksLikeHeader(columns)) {
      return;
    }

    const name = normalizeName(columns[0] || "");
    const prize = normalizeName(columns[1] || "");
    const tickets = parseTicketCount(columns[2] || "");

    if (!name || !prize || tickets < 1) {
      skippedRows += 1;
      return;
    }

    parsedRows.push({ name, prize, tickets });
  });

  return { rows: normalizeEventRows(parsedRows), skippedRows };
}

function buildEntriesForPrize(prizeName) {
  const prizeKey = getPrizeKey(prizeName);
  const entries = [];

  state.eventRows.forEach((row) => {
    if (getPrizeKey(row.prize) !== prizeKey) {
      return;
    }

    for (let count = 0; count < row.tickets; count += 1) {
      entries.push(row.name);
    }
  });

  return entries;
}

function rebuildEntriesForCurrentPrize() {
  if (!hasEventRows() || !state.currentPrize) {
    return;
  }

  state.entries = buildEntriesForPrize(state.currentPrize);
  shuffleEntries();
}

function addEventTicketsForParticipant(name, quantity) {
  const nameKey = getNameKey(name);
  const prizeKey = getPrizeKey(state.currentPrize);
  const matchingRow = state.eventRows.find(
    (row) => getNameKey(row.name) === nameKey && getPrizeKey(row.prize) === prizeKey
  );

  if (matchingRow) {
    matchingRow.tickets += quantity;
  } else {
    state.eventRows.push({
      name,
      prize: state.currentPrize,
      tickets: quantity
    });
  }
}

function removeEventTicketForParticipant(name) {
  const nameKey = getNameKey(name);
  const prizeKey = getPrizeKey(state.currentPrize);
  const rowIndex = state.eventRows.findIndex(
    (row) => getNameKey(row.name) === nameKey && getPrizeKey(row.prize) === prizeKey
  );

  if (rowIndex < 0) {
    return false;
  }

  state.eventRows[rowIndex].tickets -= 1;

  if (state.eventRows[rowIndex].tickets <= 0) {
    state.eventRows.splice(rowIndex, 1);
  }

  return true;
}

function removeAllEventTicketsForParticipant(name) {
  const nameKey = getNameKey(name);
  const prizeKey = getPrizeKey(state.currentPrize);
  const originalCount = state.eventRows.length;

  state.eventRows = state.eventRows.filter(
    (row) => !(getNameKey(row.name) === nameKey && getPrizeKey(row.prize) === prizeKey)
  );

  return originalCount !== state.eventRows.length;
}

function getParticipantSummary() {
  const participantMap = new Map();

  state.entries.forEach((name) => {
    const nameKey = getNameKey(name);
    const existingParticipant = participantMap.get(nameKey);

    if (existingParticipant) {
      existingParticipant.count += 1;
    } else {
      participantMap.set(nameKey, {
        key: nameKey,
        name,
        count: 1,
        color: getColorForName(name)
      });
    }
  });

  return [...participantMap.values()].sort((first, second) => first.name.localeCompare(second.name));
}

function addTickets(event) {
  event.preventDefault();

  const name = normalizeName(nameInput.value);
  const quantity = Math.floor(Number(ticketQuantityInput.value));

  if (!name) {
    showMessage("Enter a participant name before adding tickets.");
    return;
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    showMessage("Ticket quantity must be at least 1.");
    return;
  }

  if (hasEventRows()) {
    if (!state.currentPrize) {
      showMessage("Select a prize before adding tickets to the event drawing.");
      return;
    }

    addEventTicketsForParticipant(name, quantity);
    rebuildEntriesForCurrentPrize();
  } else {
    for (let count = 0; count < quantity; count += 1) {
      state.entries.push(name);
    }

    shuffleEntries();
  }

  saveState();
  showMessage(`${quantity} ticket${quantity === 1 ? "" : "s"} added for ${name}.`, "success");
  nameInput.value = "";
  ticketQuantityInput.value = "1";
  highlightedWinnerKey = "";
  renderApp();
  nameInput.focus();
}

function addTicketForParticipant(name) {
  if (isSpinning) {
    return;
  }

  if (hasEventRows() && state.currentPrize) {
    addEventTicketsForParticipant(name, 1);
    rebuildEntriesForCurrentPrize();
  } else {
    state.entries.push(name);
    shuffleEntries();
  }

  saveState();
  showMessage(`Added 1 ticket for ${name}.`, "success");
  renderApp();
}

function removeTicket(name) {
  if (isSpinning) {
    return;
  }

  const nameKey = getNameKey(name);
  const removedFromEvent = hasEventRows() && state.currentPrize ? removeEventTicketForParticipant(name) : false;
  const ticketIndex = removedFromEvent ? -1 : state.entries.findIndex((entry) => getNameKey(entry) === nameKey);

  if (removedFromEvent) {
    rebuildEntriesForCurrentPrize();
    saveState();
    showMessage(`Removed 1 ticket for ${name}.`, "success");
    renderApp();
  } else if (ticketIndex >= 0) {
    state.entries.splice(ticketIndex, 1);
    saveState();
    showMessage(`Removed 1 ticket for ${name}.`, "success");
    renderApp();
  }
}

function removeAllTickets(name) {
  if (isSpinning) {
    return;
  }

  const nameKey = getNameKey(name);
  const originalCount = state.entries.length;

  if (hasEventRows() && state.currentPrize) {
    removeAllEventTicketsForParticipant(name);
    rebuildEntriesForCurrentPrize();
  } else {
    state.entries = state.entries.filter((entry) => getNameKey(entry) !== nameKey);
  }

  highlightedWinnerKey = highlightedWinnerKey === nameKey ? "" : highlightedWinnerKey;
  saveState();
  showMessage(`Removed ${originalCount - state.entries.length} ticket entries for ${name}.`, "success");
  renderApp();
}

function loadEventEntriesFromText(text) {
  const pastedText = text.trim();

  if (!pastedText) {
    showMessage("Paste event rows before loading entries.");
    return;
  }

  const { rows, skippedRows } = parseEventData(pastedText);

  if (rows.length === 0) {
    showMessage("No valid event rows were found. Use Participant, Prize, Tickets.");
    return;
  }

  state.eventRows = rows;
  state.entries = [];
  state.currentPrize = "";
  highlightedWinnerKey = "";
  prizeInput.value = "";
  resetWinnerDisplay();
  saveState();
  showMessage(
    `Loaded ${rows.length} row${rows.length === 1 ? "" : "s"}${skippedRows ? ` and skipped ${skippedRows}` : ""}. Select a prize to load its tickets.`,
    "success"
  );
  renderApp();
}

function loadEventEntriesFromPaste() {
  loadEventEntriesFromText(eventDataInput.value);
}

function loadEventEntriesFromFile(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    const fileText = String(reader.result || "");

    eventDataInput.value = fileText;
    loadEventEntriesFromText(fileText);
  });

  reader.addEventListener("error", () => {
    showMessage("That file could not be read. Try exporting as CSV or TSV.");
  });

  reader.readAsText(file);
}

function renderDashboard() {
  const participants = getParticipantSummary();

  totalTicketsText.textContent = state.entries.length;
  uniqueParticipantsText.textContent = participants.length;
  winnersDrawnText.textContent = state.winners.length;
  spinButton.disabled = state.entries.length === 0 || isSpinning;
  clearEntriesButton.disabled = state.entries.length === 0 || isSpinning;
  clearWinnerLogButton.disabled = state.winners.length === 0;
  exportWinnerLogButton.disabled = state.winners.length === 0;

  if (state.entries.length === 0) {
    oddsText.textContent = "Add tickets to begin.";
  } else {
    oddsText.textContent = `${state.entries.length} ticket ${state.entries.length === 1 ? "entry" : "entries"} active`;
  }
}

function renderPrizeOptions() {
  const selectedPrize = state.currentPrize;
  const placeholderOption = document.createElement("option");
  const addPrizeOption = document.createElement("option");

  prizeInput.innerHTML = "";

  placeholderOption.value = "";
  placeholderOption.textContent = "Select a prize";
  prizeInput.append(placeholderOption);

  if (hasEventRows()) {
    const eventGroup = document.createElement("optgroup");

    eventGroup.label = "Loaded event prizes";
    getEventPrizeOptions().forEach((prize) => {
      eventGroup.append(createPrizeOption(prize));
    });
    prizeInput.append(eventGroup);
  } else {
    defaultPrizes.forEach((prize) => {
      prizeInput.append(createPrizeOption(prize));
    });
  }

  if (state.customPrizes.length > 0) {
    const customGroup = document.createElement("optgroup");
    const eventPrizeKeys = new Set(getEventPrizeOptions().map((prize) => getPrizeKey(prize.name)));

    customGroup.label = "Added prizes";
    state.customPrizes.forEach((name) => {
      if (!hasEventRows() || !eventPrizeKeys.has(getPrizeKey(name))) {
        customGroup.append(createPrizeOption({ name, icon: "🎁" }));
      }
    });

    if (customGroup.children.length > 0) {
      prizeInput.append(customGroup);
    }
  }

  addPrizeOption.value = ADD_PRIZE_VALUE;
  addPrizeOption.textContent = "+ Add prize...";
  prizeInput.append(addPrizeOption);

  if (selectedPrize && prizeExists(selectedPrize)) {
    prizeInput.value = selectedPrize;
  } else {
    state.currentPrize = "";
    prizeInput.value = "";
  }

  renderPrizePreview();
}

function createPrizeOption(prize) {
  const option = document.createElement("option");

  option.value = prize.name;
  option.textContent = `${prize.icon} ${prize.name}`;
  return option;
}

function renderPrizePreview() {
  const selectedPrize = getPrizeByName(state.currentPrize);

  prizePreview.innerHTML = "";

  if (!selectedPrize) {
    prizePreview.classList.add("is-empty");
    prizePreview.textContent = "";
    return;
  }

  const name = document.createElement("strong");
  const icon = document.createElement("span");

  prizePreview.classList.remove("is-empty");
  icon.className = "prize-preview-icon";
  icon.textContent = selectedPrize.icon;
  name.textContent = selectedPrize.name;
  prizePreview.append(icon, name);
}

function renderEventDataSummary() {
  if (!hasEventRows()) {
    eventDataSummary.textContent = "No event entries loaded.";
    return;
  }

  const totalTickets = state.eventRows.reduce((total, row) => total + row.tickets, 0);
  const prizeCount = new Set(state.eventRows.map((row) => getPrizeKey(row.prize))).size;
  const participantCount = new Set(state.eventRows.map((row) => getNameKey(row.name))).size;

  eventDataSummary.textContent = `${prizeCount} prize${prizeCount === 1 ? "" : "s"} loaded • ${totalTickets} ticket${totalTickets === 1 ? "" : "s"} • ${participantCount} participant${participantCount === 1 ? "" : "s"}`;
}

async function promptForCustomPrize(previousPrize) {
  let prizeName = "";

  if (window.Swal) {
    const result = await window.Swal.fire({
      title: "Add prize",
      input: "text",
      inputLabel: "Prize name",
      inputPlaceholder: "Community Gift Basket",
      showCancelButton: true,
      confirmButtonText: "Add Prize",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0f7280",
      cancelButtonColor: "#667085",
      background: "#fffaf1",
      color: "#07184d",
      inputValidator: (value) => {
        const normalizedPrize = normalizeName(value || "");

        if (!normalizedPrize) {
          return "Enter a prize name.";
        }

        if (prizeExists(normalizedPrize)) {
          return "That prize is already in the list.";
        }

        return null;
      }
    });

    if (!result.isConfirmed) {
      state.currentPrize = previousPrize;
      renderPrizeOptions();
      return;
    }

    prizeName = normalizeName(result.value || "");
  } else {
    prizeName = normalizeName(prompt("Prize name") || "");

    if (!prizeName || prizeExists(prizeName)) {
      state.currentPrize = previousPrize;
      renderPrizeOptions();
      return;
    }
  }

  state.customPrizes = normalizeCustomPrizes([...state.customPrizes, prizeName]);
  state.currentPrize = prizeName;
  if (hasEventRows()) {
    state.entries = [];
  }
  saveState();
  renderApp();
}

function handlePrizeChange() {
  const selectedPrize = prizeInput.value;
  const previousPrize = state.currentPrize;

  if (selectedPrize === ADD_PRIZE_VALUE) {
    promptForCustomPrize(previousPrize);
    return;
  }

  state.currentPrize = selectedPrize;
  highlightedWinnerKey = "";

  if (hasEventRows()) {
    if (state.currentPrize) {
      rebuildEntriesForCurrentPrize();
    } else {
      state.entries = [];
    }
    resetWinnerDisplay();
  }

  saveState();
  renderApp();
}

function renderParticipantSummary() {
  const searchTerm = participantSearchInput.value.trim().toLowerCase();
  const participants = getParticipantSummary().filter((participant) =>
    participant.name.toLowerCase().includes(searchTerm)
  );

  participantList.innerHTML = "";

  if (participants.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = state.entries.length === 0 ? "No tickets yet." : "No participants match your search.";
    participantList.append(emptyState);
    return;
  }

  participants.forEach((participant) => {
    const item = document.createElement("article");
    const identity = document.createElement("div");
    const colorDot = document.createElement("span");
    const name = document.createElement("strong");
    const ticketCount = document.createElement("span");
    const controls = document.createElement("div");
    const addButton = document.createElement("button");
    const subtractButton = document.createElement("button");
    const removeAllButton = document.createElement("button");

    item.className = "participant-row";
    item.dataset.participantKey = participant.key;

    if (participant.key === highlightedWinnerKey) {
      item.classList.add("winner-highlight");
    }

    identity.className = "participant-identity";
    colorDot.className = "participant-dot";
    colorDot.style.backgroundColor = participant.color;
    name.textContent = participant.name;
    ticketCount.textContent = `${participant.count} ${participant.count === 1 ? "ticket" : "tickets"}`;

    controls.className = "participant-actions";
    addButton.type = "button";
    addButton.innerHTML = '<i data-lucide="plus"></i><span>+1</span>';
    addButton.setAttribute("aria-label", `Add one ticket for ${participant.name}`);
    addButton.addEventListener("click", () => addTicketForParticipant(participant.name));

    subtractButton.type = "button";
    subtractButton.innerHTML = '<i data-lucide="minus"></i><span>-1</span>';
    subtractButton.setAttribute("aria-label", `Remove one ticket for ${participant.name}`);
    subtractButton.addEventListener("click", () => removeTicket(participant.name));

    removeAllButton.type = "button";
    removeAllButton.innerHTML = '<i data-lucide="trash-2"></i><span>Remove all</span>';
    removeAllButton.className = "remove-all-button";
    removeAllButton.addEventListener("click", () => removeAllTickets(participant.name));

    identity.append(colorDot, name, ticketCount);
    controls.append(addButton, subtractButton, removeAllButton);
    item.append(identity, controls);
    participantList.append(item);
  });

  renderIcons();
}

function drawEmptyWheel() {
  const center = canvas.width / 2;
  const radius = center - 22;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#f4efe6";
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = "#687080";
  ctx.font = "700 38px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Add tickets", center, center - 16);
  ctx.font = "22px Arial, Helvetica, sans-serif";
  ctx.fillText("to start the drawing", center, center + 28);
}

function renderWheel() {
  if (state.entries.length === 0) {
    drawEmptyWheel();
    hideWheelHoverLabel();
    return;
  }

  const center = canvas.width / 2;
  const radius = center - 22;
  const sliceAngle = (Math.PI * 2) / state.entries.length;
  const showFullLabels = state.entries.length <= 36;
  const showShortLabels = state.entries.length > 36 && state.entries.length <= 90;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.entries.forEach((name, index) => {
    const startAngle = index * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = getColorForName(name);
    ctx.fill();

    if (state.entries.length <= 160) {
      ctx.lineWidth = state.entries.length > 80 ? 1 : 2.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
      ctx.stroke();
    }

    if (showFullLabels || showShortLabels) {
      const label = showFullLabels ? name : name.slice(0, 2).toUpperCase();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = showFullLabels ? "700 17px Arial" : "700 11px Arial";
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 3;
      ctx.fillText(label, radius - 18, 0, radius * 0.62);
      ctx.restore();
    }
  });

  ctx.beginPath();
  ctx.arc(center, center, 58, 0, Math.PI * 2);
  ctx.fillStyle = "#243044";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 17px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DRAW", center, center - 3);
  ctx.font = "700 12px Arial, Helvetica, sans-serif";
  ctx.fillText(`${state.entries.length} tickets`, center, center + 19);
}

function hideWheelHoverLabel() {
  wheelHoverLabel.classList.remove("is-visible");
  wheelHoverLabel.textContent = "";
}

function handleWheelHover(event) {
  if (isSpinning || state.entries.length === 0) {
    hideWheelHoverLabel();
    return;
  }

  const bounds = canvas.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  const center = bounds.width / 2;
  const radius = center - 22 * (bounds.width / canvas.width);
  const distanceFromCenter = Math.hypot(x - center, y - center);

  if (distanceFromCenter > radius || distanceFromCenter < radius * 0.16) {
    hideWheelHoverLabel();
    return;
  }

  let angle = Math.atan2(y - center, x - center);

  if (angle < 0) {
    angle += Math.PI * 2;
  }

  const sliceIndex = Math.floor(angle / ((Math.PI * 2) / state.entries.length));
  const hoveredName = state.entries[sliceIndex];

  if (!hoveredName) {
    hideWheelHoverLabel();
    return;
  }

  wheelHoverLabel.textContent = hoveredName;
  wheelHoverLabel.style.left = `${x}px`;
  wheelHoverLabel.style.top = `${y}px`;
  wheelHoverLabel.classList.add("is-visible");
}

function selectWinningTicket() {
  // This is the core raffle rule: choose from the full duplicate-name ticket array.
  // If Sarah bought 5 tickets and Mike bought 1, Sarah appears 5 times here and has 5 chances.
  const winningIndex = Math.floor(Math.random() * state.entries.length);

  return {
    index: winningIndex,
    name: state.entries[winningIndex]
  };
}

function spinWheel() {
  if (state.entries.length === 0 || isSpinning) {
    return;
  }

  const winningTicket = selectWinningTicket();
  const sliceDegrees = 360 / state.entries.length;
  const sliceCenter = winningTicket.index * sliceDegrees + sliceDegrees / 2;
  const extraTurns = 5 + Math.floor(Math.random() * 3);
  const jitter = (Math.random() - 0.5) * sliceDegrees * 0.5;
  const targetRotation = extraTurns * 360 + (360 - sliceCenter) + jitter;

  isSpinning = true;
  highlightedWinnerKey = "";
  winnerNameText.textContent = "Drawing...";
  winnerPrizeText.textContent = "";
  showMessage("");
  renderDashboard();
  renderParticipantSummary();
  startTicking();

  currentRotation = targetRotation;
  canvas.style.transform = `rotate(${currentRotation}deg)`;

  window.setTimeout(() => {
    stopTicking();
    playWinnerSound();
    finishSpin(winningTicket);
  }, SPIN_TIME);
}

function finishSpin(winningTicket) {
  const prizeName = normalizeName(prizeInput.value);

  highlightedWinnerKey = getNameKey(winningTicket.name);
  winnerNameText.textContent = winningTicket.name;
  winnerPrizeText.textContent = prizeName ? prizeName : "";
  logWinner(winningTicket.name, prizeName);
  state.currentPrize = "";
  if (hasEventRows()) {
    state.entries = [];
  }
  prizeInput.value = "";
  saveState();
  celebrateWinner();
  announceWinner(winningTicket.name, prizeName);

  window.setTimeout(() => {
    canvas.style.transition = "none";
    canvas.style.transform = "rotate(0deg)";
    currentRotation = 0;
    isSpinning = false;
    renderApp();

    window.requestAnimationFrame(() => {
      canvas.style.transition = "";
    });
  }, 650);
}

function announceWinner(winnerName, prizeName) {
  if (!window.Swal) {
    return;
  }

  window.Swal.fire({
    title: "WINNER!",
    html: `
      <div class="winner-alert">
        <span class="winner-alert-kicker">Congratulations</span>
        <strong>${escapeHTML(winnerName)}</strong>
        ${prizeName ? `<em>${escapeHTML(prizeName)}</em>` : ""}
      </div>
    `,
    width: "min(44rem, calc(100% - 2rem))",
    confirmButtonText: "Continue",
    confirmButtonColor: "#ec4b1a",
    background: "#fff8df",
    color: "#07184d",
    customClass: {
      popup: "raffle-alert-popup",
      title: "raffle-alert-title"
    }
  });
}

function logWinner(winnerName, prizeName) {
  state.winners.push({
    name: winnerName,
    prize: prizeName,
    drawnAt: new Date().toISOString()
  });

  saveState();
}

function renderWinnerLog() {
  winnerLogList.innerHTML = "";

  if (state.winners.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state log-empty";
    emptyItem.textContent = "Winners will appear here after each spin.";
    winnerLogList.append(emptyItem);
    return;
  }

  state.winners.forEach((winner, index) => {
    const item = document.createElement("li");
    const drawNumber = document.createElement("span");
    const details = document.createElement("div");
    const winnerName = document.createElement("strong");
    const prizeName = document.createElement("span");

    item.className = "winner-log-item";
    drawNumber.className = "draw-number";
    drawNumber.textContent = index + 1;
    winnerName.textContent = winner.name;
    prizeName.textContent = winner.prize ? winner.prize : "No prize listed";
    prizeName.className = winner.prize ? "" : "muted";

    details.append(winnerName, prizeName);
    item.append(drawNumber, details);
    winnerLogList.append(item);
  });
}

function exportWinnerLogCSV() {
  const csvRows = [["Draw Number", "Winner Name", "Prize Name"]];

  state.winners.forEach((winner, index) => {
    csvRows.push([index + 1, winner.name, winner.prize || ""]);
  });

  const csv = csvRows.map((row) => row.map(escapeCSVValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "raffle-winners.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCSVValue(value) {
  const stringValue = String(value);
  const escapedValue = stringValue.replace(/"/g, '""');

  if (/[",\n]/.test(escapedValue)) {
    return `"${escapedValue}"`;
  }

  return escapedValue;
}

async function confirmAction(title, text, confirmButtonText) {
  if (!window.Swal) {
    return confirm(`${title}\n\n${text}`);
  }

  const result = await window.Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    confirmButtonColor: "#c94f5f",
    cancelButtonColor: "#667085",
    background: "#fffaf1",
    color: "#1d2433"
  });

  return result.isConfirmed;
}

async function clearAllEntries() {
  const confirmed = await confirmAction(
    "Clear all ticket entries?",
    "This removes every active ticket from the raffle. This cannot be undone.",
    "Clear Entries"
  );

  if (!confirmed) {
    return;
  }

  if (hasEventRows() && state.currentPrize) {
    state.currentPrize = "";
    prizeInput.value = "";
  }

  state.entries = [];
  highlightedWinnerKey = "";
  resetWinnerDisplay();
  saveState();
  showMessage("All ticket entries were cleared.", "success");
  renderApp();
}

async function clearWinnerLog() {
  const confirmed = await confirmAction(
    "Clear the winner log?",
    "This removes the saved drawing history. This cannot be undone.",
    "Clear Winner Log"
  );

  if (!confirmed) {
    return;
  }

  state.winners = [];
  saveState();
  renderApp();
}

async function resetRaffle() {
  const confirmed = await confirmAction(
    "Reset the entire raffle?",
    "This clears entries, prize text, highlights, and the winner log. This cannot be undone.",
    "Full Reset"
  );

  if (!confirmed) {
    return;
  }

  state.entries = [];
  state.winners = [];
  state.currentPrize = "";
  state.customPrizes = [];
  state.eventRows = [];
  eventDataInput.value = "";
  highlightedWinnerKey = "";
  prizeInput.value = "";
  resetWinnerDisplay();
  saveState();
  showMessage("The raffle was reset.", "success");
  renderApp();
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTickSound() {
  if (!soundToggle.checked) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(760, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.075, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.05);
}

function playWinnerSound() {
  if (!soundToggle.checked) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const notes = [392, 523.25, 659.25, 783.99, 1046.5, 1318.51];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.075;

    oscillator.type = index % 2 === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.11, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.36);
  });

  [196, 246.94, 392].forEach((frequency) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + 0.02;

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.035, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.64);
  });
}

function startTicking() {
  if (!soundToggle.checked) {
    return;
  }

  let tickDelay = 58;

  stopTicking();

  function scheduleNextTick() {
    playTickSound();
    tickDelay = Math.min(tickDelay + 8, 220);
    tickTimer = window.setTimeout(scheduleNextTick, tickDelay);
  }

  scheduleNextTick();
}

function stopTicking() {
  if (tickTimer) {
    window.clearTimeout(tickTimer);
    tickTimer = null;
  }
}

function celebrateWinner() {
  wheelCard.classList.remove("is-celebrating");
  window.requestAnimationFrame(() => {
    wheelCard.classList.add("is-celebrating");
  });
  window.setTimeout(() => {
    wheelCard.classList.remove("is-celebrating");
  }, 2600);

  if (window.confetti) {
    const fire = (options) => {
      window.confetti({
        colors: celebrationColors,
        disableForReducedMotion: true,
        ...options
      });
    };

    fire({
      particleCount: 220,
      spread: 105,
      startVelocity: 52,
      origin: { y: 0.58 },
      scalar: 1,
      ticks: 280
    });

    fire({
      particleCount: 90,
      angle: 60,
      spread: 70,
      startVelocity: 58,
      origin: { x: 0.04, y: 0.78 },
      scalar: 0.95,
      ticks: 260
    });

    fire({
      particleCount: 90,
      angle: 120,
      spread: 70,
      startVelocity: 58,
      origin: { x: 0.96, y: 0.78 },
      scalar: 0.95,
      ticks: 260
    });

    window.setTimeout(() => {
      fire({
        particleCount: 120,
        angle: 60,
        spread: 62,
        startVelocity: 44,
        origin: { x: 0.18, y: 0.92 },
        scalar: 0.82
      });
      fire({
        particleCount: 120,
        angle: 120,
        spread: 62,
        startVelocity: 44,
        origin: { x: 0.82, y: 0.92 },
        scalar: 0.82
      });
    }, 260);

    window.setTimeout(() => {
      fire({
        particleCount: 90,
        spread: 140,
        startVelocity: 34,
        origin: { y: 0.36 },
        scalar: 0.72,
        ticks: 220
      });
    }, 640);

    return;
  }

  fallbackConfetti();
}

function fallbackConfetti() {
  confettiLayer.innerHTML = "";

  for (let index = 0; index < 64; index += 1) {
    const piece = document.createElement("span");
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    piece.className = "confetti-piece";
    piece.style.backgroundColor = randomColor;
    piece.style.left = `${22 + Math.random() * 56}%`;
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 24}rem`);
    piece.style.setProperty("--fall", `${32 + Math.random() * 30}vh`);
    piece.style.setProperty("--spin", `${220 + Math.random() * 560}deg`);
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    confettiLayer.append(piece);
  }

  window.setTimeout(() => {
    confettiLayer.innerHTML = "";
  }, 2400);
}

function escapeHTML(value) {
  const element = document.createElement("span");

  element.textContent = value;
  return element.innerHTML;
}

function renderApp() {
  renderPrizeOptions();
  renderEventDataSummary();
  saveState();
  renderDashboard();
  renderParticipantSummary();
  renderWheel();
  renderWinnerLog();
  renderIcons();
}

ticketForm.addEventListener("submit", addTickets);
participantSearchInput.addEventListener("input", renderParticipantSummary);
prizeInput.addEventListener("change", handlePrizeChange);
eventFileInput.addEventListener("change", loadEventEntriesFromFile);
loadEventDataButton.addEventListener("click", loadEventEntriesFromPaste);
canvas.addEventListener("mousemove", handleWheelHover);
canvas.addEventListener("mouseleave", hideWheelHoverLabel);
spinButton.addEventListener("click", spinWheel);
clearEntriesButton.addEventListener("click", clearAllEntries);
clearWinnerLogButton.addEventListener("click", clearWinnerLog);
exportWinnerLogButton.addEventListener("click", exportWinnerLogCSV);
resetRaffleButton.addEventListener("click", resetRaffle);

loadState();
renderApp();
