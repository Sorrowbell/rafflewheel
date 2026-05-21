const MAX_NAMES = 100;
const SPIN_TIME = 4200;
const STORAGE_KEY = "raffleWheelNames";

const colors = [
  "#e93f6f",
  "#1aa6a6",
  "#ffbe3d",
  "#6f63d9",
  "#f26d3d",
  "#32a852",
  "#2f80ed",
  "#d946ef",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#3b82f6",
  "#a855f7",
  "#22c55e",
  "#fb7185",
  "#0ea5e9",
  "#c084fc"
];

const canvas = document.querySelector("#wheelCanvas");
const ctx = canvas.getContext("2d");
const nameForm = document.querySelector("#nameForm");
const nameInput = document.querySelector("#nameInput");
const nameList = document.querySelector("#nameList");
const spinButton = document.querySelector("#spinButton");
const clearButton = document.querySelector("#clearButton");
const removeIdenticalCheckbox = document.querySelector("#removeIdenticalCheckbox");
const winnerText = document.querySelector("#winnerText");
const messageText = document.querySelector("#messageText");
const countText = document.querySelector("#countText");
const confettiLayer = document.querySelector("#confettiLayer");

let names = [];
let currentRotation = 0;
let isSpinning = false;
let tickTimer = null;
let audioContext = null;
let shuffledColors = shuffleColors(colors);
let nextColorIndex = 0;
const assignedNameColors = {};

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function getNameKey(name) {
  return name.toLowerCase();
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

function getColorForName(name) {
  const nameKey = getNameKey(name);

  // Remember each unique name's color so identical names always match.
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

function showMessage(message) {
  messageText.textContent = message;
}

function saveNames() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch (error) {
    showMessage("Names could not be saved in this browser.");
  }
}

function loadNames() {
  let savedNames = [];

  try {
    savedNames = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    savedNames = [];
  }

  if (Array.isArray(savedNames)) {
    names = savedNames
      .map((name) => normalizeName(String(name)))
      .filter(Boolean)
      .slice(0, MAX_NAMES);
  }
}

function addNameAtRandomSpot(name) {
  const randomIndex = Math.floor(Math.random() * (names.length + 1));

  names.splice(randomIndex, 0, name);
}

function updateButtons() {
  const hasNames = names.length > 0;
  spinButton.disabled = !hasNames || isSpinning;
  clearButton.disabled = !hasNames || isSpinning;
}

function renderNameList() {
  nameList.innerHTML = "";
  countText.textContent = names.length;

  const sortedNames = names
    .map((name, index) => ({ name, originalIndex: index }))
    .sort((firstEntry, secondEntry) => firstEntry.name.localeCompare(secondEntry.name));

  sortedNames.forEach((entry) => {
    const item = document.createElement("li");
    const nameGroup = document.createElement("span");
    const dot = document.createElement("span");
    const label = document.createElement("span");
    const removeButton = document.createElement("button");

    item.dataset.originalIndex = entry.originalIndex;
    nameGroup.className = "name-group";
    dot.className = "color-dot";
    dot.style.backgroundColor = getColorForName(entry.name);
    label.textContent = entry.name;
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.disabled = isSpinning;
    removeButton.setAttribute("aria-label", getRemoveButtonLabel(entry.name));
    removeButton.addEventListener("click", () => removeName(entry.originalIndex));

    nameGroup.append(dot, label);
    item.append(nameGroup, removeButton);
    nameList.append(item);
  });
}

function drawEmptyWheel() {
  const center = canvas.width / 2;
  const radius = center - 18;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#eef2f7";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = "#647086";
  ctx.font = "bold 30px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Add names", center, center - 12);
  ctx.font = "18px Arial, Helvetica, sans-serif";
  ctx.fillText("to build the wheel", center, center + 22);
}

function drawWheel() {
  if (names.length === 0) {
    drawEmptyWheel();
    return;
  }

  const center = canvas.width / 2;
  const radius = center - 18;
  const sliceAngle = (Math.PI * 2) / names.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  names.forEach((name, index) => {
    const startAngle = index * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = getColorForName(name);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rotate the canvas so each label follows the middle of its slice.
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = names.length > 18 ? "bold 14px Arial" : "bold 18px Arial";
    ctx.shadowColor = "rgba(0, 0, 0, 0.24)";
    ctx.shadowBlur = 3;
    ctx.fillText(name, radius - 18, 0, radius * 0.65);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, 42, 0, Math.PI * 2);
  ctx.fillStyle = "#172033";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPIN", center, center);
}

function renderApp() {
  renderNameList();
  drawWheel();
  updateButtons();
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
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(820, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.05);
}

function startTicking() {
  let tickDelay = 62;

  stopTicking();

  function scheduleNextTick() {
    playTickSound();
    tickDelay = Math.min(tickDelay + 8, 210);
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
  confettiLayer.innerHTML = "";

  for (let index = 0; index < 58; index += 1) {
    const piece = document.createElement("span");
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const startLeft = 24 + Math.random() * 52;
    const drift = (Math.random() - 0.5) * 24;
    const fall = 32 + Math.random() * 30;
    const spin = 220 + Math.random() * 560;

    piece.className = "confetti-piece";
    piece.style.backgroundColor = randomColor;
    piece.style.left = `${startLeft}%`;
    piece.style.setProperty("--drift", `${drift}rem`);
    piece.style.setProperty("--fall", `${fall}vh`);
    piece.style.setProperty("--spin", `${spin}deg`);
    piece.style.animationDelay = `${Math.random() * 0.35}s`;

    confettiLayer.append(piece);
  }

  window.setTimeout(() => {
    confettiLayer.innerHTML = "";
  }, 2300);
}

function addName(event) {
  event.preventDefault();

  const newName = normalizeName(nameInput.value);

  if (!newName) {
    showMessage("Please enter a name first.");
    return;
  }

  if (names.length >= MAX_NAMES) {
    showMessage("The wheel can hold up to 100 names.");
    return;
  }

  addNameAtRandomSpot(newName);
  saveNames();
  nameInput.value = "";
  winnerText.textContent = "Ready when you are.";
  showMessage("");
  renderApp();
  nameInput.focus();
}

function removeName(indexToRemove) {
  if (isSpinning) {
    return;
  }

  const removedName = names[indexToRemove];

  if (removeIdenticalCheckbox.checked) {
    const removedNameKey = getNameKey(removedName);
    const originalCount = names.length;

    names = names.filter((name) => getNameKey(name) !== removedNameKey);
    winnerText.textContent = `${originalCount - names.length} matching "${removedName}" entries were removed.`;
  } else {
    names.splice(indexToRemove, 1);
    winnerText.textContent = `${removedName} was removed.`;
  }

  saveNames();
  showMessage("");
  renderApp();
}

function getRemoveButtonLabel(name) {
  if (removeIdenticalCheckbox.checked) {
    return `Remove all names matching ${name}`;
  }

  return `Remove ${name}`;
}

function getWinnerIndex(finalRotationDegrees) {
  const sliceDegrees = 360 / names.length;
  const pointerDegrees = 0;
  const normalizedRotation = ((finalRotationDegrees % 360) + 360) % 360;
  const selectedDegrees = (pointerDegrees - normalizedRotation + 360) % 360;

  return Math.floor(selectedDegrees / sliceDegrees);
}

function spinWheel() {
  if (names.length === 0 || isSpinning) {
    return;
  }

  isSpinning = true;
  updateButtons();
  clearWinnerHighlights();
  showMessage("");
  winnerText.textContent = "Spinning...";
  startTicking();

  const sliceDegrees = 360 / names.length;
  const fairWinnerIndex = Math.floor(Math.random() * names.length);
  const sliceCenter = fairWinnerIndex * sliceDegrees + sliceDegrees / 2;
  const extraTurns = 5 + Math.floor(Math.random() * 3);
  const jitter = (Math.random() - 0.5) * sliceDegrees * 0.55;
  const targetRotation = extraTurns * 360 + (360 - sliceCenter) + jitter;

  currentRotation += targetRotation;
  canvas.style.transform = `rotate(${currentRotation}deg)`;

  window.setTimeout(() => {
    const winnerIndex = getWinnerIndex(currentRotation);
    const winnerName = names[winnerIndex];

    stopTicking();
    winnerText.textContent = `Winner: ${winnerName}`;
    celebrateWinner();
    highlightWinner(winnerIndex);
    resetWheelAfterSpin();
  }, SPIN_TIME);
}

function highlightWinner(winnerIndex) {
  const winnerItem = nameList.querySelector(`[data-original-index="${winnerIndex}"]`);

  if (winnerItem) {
    winnerItem.classList.add("winner-highlight");
  }
}

function clearWinnerHighlights() {
  nameList.querySelectorAll(".winner-highlight").forEach((winnerItem) => {
    winnerItem.classList.remove("winner-highlight");
  });
}

function resetWheelAfterSpin() {
  window.setTimeout(() => {
    canvas.style.transition = "none";
    canvas.style.transform = "rotate(0deg)";
    currentRotation = 0;
    isSpinning = false;

    window.requestAnimationFrame(() => {
      canvas.style.transition = "";
      updateButtons();
    });
  }, 650);
}

function clearAllNames() {
  names = [];
  currentRotation = 0;
  canvas.style.transform = "rotate(0deg)";
  stopTicking();
  winnerText.textContent = "Add names to start the raffle.";
  showMessage("");
  saveNames();
  renderApp();
}

nameForm.addEventListener("submit", addName);
spinButton.addEventListener("click", spinWheel);
clearButton.addEventListener("click", clearAllNames);
removeIdenticalCheckbox.addEventListener("change", renderNameList);

loadNames();
renderApp();
