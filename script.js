const fxLayer = document.getElementById("fxLayer");
const surpriseBtn = document.getElementById("surpriseBtn");
const typeBtn = document.getElementById("typeBtn");
const letterTextEl = document.getElementById("letterText");
const todayDateEl = document.getElementById("todayDate");
const meetDate = document.getElementById("meetDate");

meetDate.textContent = formatDateUA(new Date(2024, 8, 2));

const letterText =
  "Я люблю тебе — щиро, тихо і дуже сильно.\n\n" +
  "Мені подобається в тобі все: як ти дивишся, як смієшся, як переживаєш і як радієш. " +
  "Поруч із тобою я хочу бути кращим: уважнішим, ніжнішим, сміливішим.\n\n" +
  "Я хочу, щоб ти завжди відчувала: ти важлива. Ти кохана. Ти моя.\n\n" +
  "Дякую, що ти є.";

function formatDateUA(d) {
  // "2 лютого 2026"
  const months = [
    "січня",
    "лютого",
    "березня",
    "квітня",
    "травня",
    "червня",
    "липня",
    "серпня",
    "вересня",
    "жовтня",
    "листопада",
    "грудня",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function makeHeart(x, y) {
  const el = document.createElement("div");
  el.className = "fx__heart";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  const size = rand(10, 20);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.opacity = String(rand(0.65, 0.95));

  const driftX = rand(-120, 120);
  const driftY = rand(-220, -420);
  const duration = rand(900, 1400);
  const rotate = rand(-140, 140);
  const startScale = rand(0.85, 1.15);

  el.animate(
    [
      {
        transform: `translate(-50%, -50%) rotate(45deg) scale(${startScale})`,
        filter: "blur(0px)",
      },
      {
        transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) rotate(${
          45 + rotate
        }deg) scale(${rand(0.6, 1.0)})`,
        filter: "blur(0.4px)",
      },
    ],
    { duration, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" }
  );

  fxLayer.appendChild(el);
  window.setTimeout(() => el.remove(), duration + 50);
}

function burstHearts(originEl) {
  const rect = originEl.getBoundingClientRect();
  const x = rect.left + rect.width * 0.5;
  const y = rect.top + rect.height * 0.5;
  const n = Math.floor(rand(18, 28));
  for (let i = 0; i < n; i++) {
    window.setTimeout(() => makeHeart(x + rand(-10, 10), y + rand(-10, 10)), i * 18);
  }
}

let typing = false;
async function typeLetter() {
  if (typing) return;
  typing = true;
  letterTextEl.textContent = "";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const baseDelay = prefersReduced ? 0 : 18;

  for (let i = 0; i < letterText.length; i++) {
    letterTextEl.textContent += letterText[i];
    if (baseDelay) {
      // Slight natural randomness
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, baseDelay + (Math.random() < 0.08 ? 90 : 0)));
    }
  }
  typing = false;
}

function init() {
  if (todayDateEl) todayDateEl.textContent = formatDateUA(new Date());

  surpriseBtn?.addEventListener("click", () => {
    burstHearts(surpriseBtn);
  });

  typeBtn?.addEventListener("click", async () => {
    burstHearts(typeBtn);
    await typeLetter();
  });

  // Soft ambient hearts on idle (very subtle)
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced) {
    window.setInterval(() => {
      if (!fxLayer) return;
      const x = rand(40, window.innerWidth - 40);
      const y = rand(window.innerHeight * 0.75, window.innerHeight - 40);
      makeHeart(x, y);
    }, 2200);
  }
}

init();

