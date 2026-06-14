/* ===================================================================
   The Prince's Dilemma — game engine
   A Reigns-style swipe game teaching Machiavelli's "The Prince".
   ================================================================== */
(function () {
  "use strict";

  const STATS = ["authority", "army", "people", "treasury"];
  const STAT_LABEL = { authority: "Authority", army: "the Army", people: "the People", treasury: "the Treasury" };
  const START = 50;          // every pillar starts balanced
  const BEST_KEY = "princes-dilemma-best";

  // Ends-of-reign: triggered when a pillar empties (low) or overflows (high).
  const DOOM = {
    authority: {
      low:  "Your grip on the crown slipped. The nobles crowned another, and you were forgotten by morning.",
      high: "You ruled as a tyrant unchecked — until your own court, fearing your absolute power, put a knife in your back."
    },
    army: {
      low:  "Defenceless, your realm was overrun. A neighbor's army marched in where your swords had vanished.",
      high: "Your bloated, restless army turned on its master. The generals you fed too well seized the throne for themselves."
    },
    people: {
      low:  "The people's hatred boiled over into revolt. A mob dragged you from the palace you thought was a fortress.",
      high: "So beloved and indulgent were you that the people grew lawless. Order dissolved, and the realm fell to chaos."
    },
    treasury: {
      low:  "The coffers ran dry. Unpaid soldiers deserted, debts came due, and your bankrupt state collapsed beneath you.",
      high: "You hoarded gold while the realm decayed. Greed earned the contempt of all, and your miserly reign crumbled."
    }
  };

  const game = {
    stats: {},
    year: 1,
    deck: [],
    current: null,
  };

  // ---- DOM ----
  const $ = (s) => document.querySelector(s);
  const screens = {
    title: $("#screen-title"),
    how: $("#screen-how"),
    game: $("#screen-game"),
    over: $("#screen-over"),
  };
  const card = $("#card");
  const els = {
    portrait: $("#card-portrait"),
    name: $("#card-name"),
    text: $("#card-text"),
    hintLeft: $("#hint-left"),
    hintRight: $("#hint-right"),
    labelLeft: $("#label-left"),
    labelRight: $("#label-right"),
    year: $("#reign-year"),
    fills: {},
    statEls: {},
  };
  STATS.forEach((s) => {
    const el = document.querySelector(`.stat[data-stat="${s}"]`);
    els.statEls[s] = el;
    els.fills[s] = el.querySelector(".stat-fill");
  });

  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // ---- Deck handling: shuffle, avoid immediate repeats ----
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function refillDeck() {
    game.deck = shuffle(SCENARIOS);
  }

  function drawCard() {
    if (game.deck.length === 0) refillDeck();
    game.current = game.deck.pop();
    renderCard();
  }

  // ---- Rendering ----
  function renderStats() {
    STATS.forEach((s) => {
      const v = clamp(game.stats[s]);
      els.fills[s].style.width = v + "%";
      els.statEls[s].classList.toggle("danger", v <= 20 || v >= 80);
    });
    els.year.textContent = game.year;
  }

  function renderCard() {
    const c = game.current;
    els.portrait.textContent = c.portrait;
    els.name.textContent = c.name;
    els.text.textContent = c.text;
    els.labelLeft.textContent = c.left.label;
    els.labelRight.textContent = c.right.label;
    els.hintLeft.textContent = c.left.label;
    els.hintRight.textContent = c.right.label;
    card.classList.remove("leaving-left", "leaving-right");
    card.style.transition = "";
    card.style.transform = "";
    card.style.opacity = "";
    void card.offsetWidth; // reflow
    card.classList.add("entering");
    setTimeout(() => card.classList.remove("entering"), 420);
  }

  const clamp = (v) => Math.max(0, Math.min(100, v));

  // ---- Apply a choice ----
  function choose(side) {
    if (!game.current || locked) return;
    locked = true;
    const choice = game.current[side];
    const eff = choice.effects;

    // animate stat bumps
    STATS.forEach((s) => {
      const d = eff[s] || 0;
      if (d !== 0) {
        const el = els.statEls[s];
        el.classList.remove("flash");
        void el.offsetWidth;
        el.classList.add("flash");
      }
    });

    // fly the card out
    card.style.transform = "";
    card.classList.add(side === "left" ? "leaving-left" : "leaving-right");

    setTimeout(() => {
      // commit stat changes
      STATS.forEach((s) => { game.stats[s] += (eff[s] || 0); });
      const doom = checkDoom();
      renderStats();
      if (doom) {
        gameOver(doom);
        locked = false;
        return;
      }
      game.year += 1;
      drawCard();
      locked = false;
    }, 360);
  }

  function checkDoom() {
    for (const s of STATS) {
      if (game.stats[s] <= 0) return { stat: s, dir: "low" };
      if (game.stats[s] >= 100) return { stat: s, dir: "high" };
    }
    return null;
  }

  // ---- Game over ----
  function gameOver(doom) {
    const reason = DOOM[doom.stat][doom.dir];
    $("#over-reason").textContent = reason;
    $("#over-years").textContent = game.year;
    // The lesson is drawn from the very card that finished you.
    $("#over-lesson").textContent = game.current.lesson;

    const survivedLong = game.year >= 20;
    const crest = $("#over-crest");
    crest.textContent = survivedLong ? "♚" : "☠";
    crest.classList.toggle("win", survivedLong);
    $("#over-title").textContent = survivedLong
      ? "A Reign Remembered"
      : "Your Reign Ends";

    // save best
    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (game.year > best) localStorage.setItem(BEST_KEY, String(game.year));

    setTimeout(() => show("over"), 380);
  }

  // ---- New game ----
  function newGame() {
    STATS.forEach((s) => { game.stats[s] = START; });
    game.year = 1;
    refillDeck();
    renderStats();
    show("game");
    drawCard();
  }

  // ---- Drag / swipe handling ----
  let dragging = false, startX = 0, dx = 0, locked = false;
  const SWIPE_THRESHOLD = 70;

  function pointerDown(x) {
    if (locked) return;
    dragging = true;
    startX = x;
    dx = 0;
    card.style.transition = "none";
  }
  function pointerMove(x) {
    if (!dragging) return;
    dx = x - startX;
    const rot = dx / 18;
    card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
    const intensity = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD);
    els.hintLeft.style.opacity = dx < 0 ? intensity : 0;
    els.hintRight.style.opacity = dx > 0 ? intensity : 0;
  }
  function pointerUp() {
    if (!dragging) return;
    dragging = false;
    card.style.transition = "";
    els.hintLeft.style.opacity = 0;
    els.hintRight.style.opacity = 0;
    if (dx <= -SWIPE_THRESHOLD) { choose("left"); }
    else if (dx >= SWIPE_THRESHOLD) { choose("right"); }
    else { card.style.transform = ""; }  // snap back
    dx = 0;
  }

  // Mouse
  card.addEventListener("mousedown", (e) => pointerDown(e.clientX));
  window.addEventListener("mousemove", (e) => pointerMove(e.clientX));
  window.addEventListener("mouseup", pointerUp);
  // Touch
  card.addEventListener("touchstart", (e) => pointerDown(e.touches[0].clientX), { passive: true });
  card.addEventListener("touchmove", (e) => pointerMove(e.touches[0].clientX), { passive: true });
  card.addEventListener("touchend", pointerUp);

  // ---- Buttons ----
  $("#btn-left").addEventListener("click", () => choose("left"));
  $("#btn-right").addEventListener("click", () => choose("right"));
  $("#btn-start").addEventListener("click", newGame);
  $("#btn-again").addEventListener("click", newGame);
  $("#btn-menu").addEventListener("click", () => { showBest(); show("title"); });
  $("#btn-how").addEventListener("click", () => show("how"));
  $("#btn-how-back").addEventListener("click", () => show("title"));

  // Keyboard for desktop play
  window.addEventListener("keydown", (e) => {
    if (!screens.game.classList.contains("active")) return;
    if (e.key === "ArrowLeft") choose("left");
    if (e.key === "ArrowRight") choose("right");
  });

  // ---- Best score on title ----
  function showBest() {
    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    $("#title-best").textContent = best > 0 ? `Your longest reign: ${best} years` : "";
  }

  showBest();
  show("title");
})();
