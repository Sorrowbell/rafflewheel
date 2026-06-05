const STORAGE_KEY = "raffleWheelFundraiserState";
const LEGACY_NAMES_KEY = "raffleWheelNames";
const SPIN_TIME = 5000;

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
  currentPrize: ""
};

const canvas = document.querySelector("#wheelCanvas");
const ctx = canvas.getContext("2d");
const ticketForm = document.querySelector("#ticketForm");
const nameInput = document.querySelector("#nameInput");
const ticketQuantityInput = document.querySelector("#ticketQuantityInput");
const prizeInput = document.querySelector("#prizeInput");
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
      return;
    }
  } catch (error) {
    state.entries = [];
    state.winners = [];
    state.currentPrize = "";
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

  for (let count = 0; count < quantity; count += 1) {
    state.entries.push(name);
  }

  shuffleEntries();

  saveState();
  showMessage(`${quantity} ticket${quantity === 1 ? "" : "s"} added for ${name}.`, "success");
  nameInput.value = "";
  ticketQuantityInput.value = "1";
  highlightedWinnerKey = "";
  renderApp();
  nameInput.focus();
}

function removeTicket(name) {
  if (isSpinning) {
    return;
  }

  const nameKey = getNameKey(name);
  const ticketIndex = state.entries.findIndex((entry) => getNameKey(entry) === nameKey);

  if (ticketIndex >= 0) {
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

  state.entries = state.entries.filter((entry) => getNameKey(entry) !== nameKey);
  highlightedWinnerKey = highlightedWinnerKey === nameKey ? "" : highlightedWinnerKey;
  saveState();
  showMessage(`Removed ${originalCount - state.entries.length} ticket entries for ${name}.`, "success");
  renderApp();
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
    addButton.addEventListener("click", () => {
      state.entries.push(participant.name);
      shuffleEntries();
      saveState();
      renderApp();
    });

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
    title: "Winner!",
    html: `
      <div class="winner-alert">
        <strong>${escapeHTML(winnerName)}</strong>
        ${prizeName ? `<span>${escapeHTML(prizeName)}</span>` : ""}
      </div>
    `,
    icon: "success",
    confirmButtonText: "Continue",
    confirmButtonColor: "#2d7c7f",
    background: "#fffaf1",
    color: "#1d2433",
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

  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.085;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.09, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.28);
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
  if (window.confetti) {
    window.confetti({
      particleCount: 120,
      spread: 72,
      origin: { y: 0.58 },
      scalar: 0.9,
      ticks: 220
    });

    window.setTimeout(() => {
      window.confetti({
        particleCount: 55,
        angle: 60,
        spread: 55,
        origin: { x: 0.15, y: 0.72 },
        scalar: 0.78
      });
      window.confetti({
        particleCount: 55,
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: 0.72 },
        scalar: 0.78
      });
    }, 160);

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
  state.currentPrize = prizeInput.value;
  saveState();
  renderDashboard();
  renderParticipantSummary();
  renderWheel();
  renderWinnerLog();
  renderIcons();
}

ticketForm.addEventListener("submit", addTickets);
participantSearchInput.addEventListener("input", renderParticipantSummary);
prizeInput.addEventListener("input", () => {
  state.currentPrize = prizeInput.value;
  saveState();
});
spinButton.addEventListener("click", spinWheel);
clearEntriesButton.addEventListener("click", clearAllEntries);
clearWinnerLogButton.addEventListener("click", clearWinnerLog);
exportWinnerLogButton.addEventListener("click", exportWinnerLogCSV);
resetRaffleButton.addEventListener("click", resetRaffle);

loadState();
prizeInput.value = state.currentPrize;
renderApp();
