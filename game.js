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
  const WISDOM_KEY = "princes-dilemma-wisdom";
  const MUTE_KEY = "princes-dilemma-muted";

  // ---- Stable id per scenario (hash of its lesson, order-independent) ----
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return "w" + (h >>> 0).toString(36);
  }
  SCENARIOS.forEach((s) => { s.id = hash(s.lesson); });

  // ---- Wisdom collection (persisted set of encountered lesson ids) ----
  function loadWisdom() {
    try { return new Set(JSON.parse(localStorage.getItem(WISDOM_KEY) || "[]")); }
    catch (e) { return new Set(); }
  }
  let wisdom = loadWisdom();
  function collectWisdom(id) {
    if (wisdom.has(id)) return false;
    wisdom.add(id);
    localStorage.setItem(WISDOM_KEY, JSON.stringify([...wisdom]));
    return true; // newly learned
  }

  // ---- Sound engine (synthesized — no asset files) ----
  const Sound = {
    ctx: null,
    muted: localStorage.getItem(MUTE_KEY) === "1",
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    },
    resume() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },
    tone(freq, dur, type, gain, when) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime + (when || 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain || 0.15, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    click() { this.tone(420, 0.08, "triangle", 0.12); },
    deal()  { this.tone(330, 0.12, "sine", 0.10); this.tone(495, 0.14, "sine", 0.07, 0.04); },
    left()  { this.tone(300, 0.12, "sawtooth", 0.10); this.tone(200, 0.18, "sine", 0.10, 0.05); },
    right() { this.tone(440, 0.10, "triangle", 0.10); this.tone(660, 0.16, "sine", 0.10, 0.05); },
    learn() { this.tone(660, 0.10, "sine", 0.10); this.tone(880, 0.14, "sine", 0.10, 0.07); this.tone(1175, 0.18, "sine", 0.08, 0.15); },
    lose()  { this.tone(300, 0.3, "sawtooth", 0.12); this.tone(190, 0.5, "sine", 0.12, 0.12); this.tone(130, 0.7, "sine", 0.12, 0.28); },
    win()   { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, "triangle", 0.11, i * 0.12)); },
    toggle() {
      this.muted = !this.muted;
      localStorage.setItem(MUTE_KEY, this.muted ? "1" : "0");
      return this.muted;
    }
  };

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

  // Short cause-of-fall labels for the shareable result card.
  const FALL = {
    authority: { low: "Lost the crown's grip", high: "Toppled as a tyrant" },
    army:      { low: "Left defenceless", high: "Betrayed by your own army" },
    people:    { low: "Overthrown by the mob", high: "Drowned in indulgent chaos" },
    treasury:  { low: "Bankrupted the realm", high: "Ruined by miserly greed" },
  };

  const game = {
    stats: {},
    year: 1,
    deck: [],
    current: null,
    result: null,
  };

  // ---- DOM ----
  const $ = (s) => document.querySelector(s);
  const screens = {
    title: $("#screen-title"),
    how: $("#screen-how"),
    game: $("#screen-game"),
    over: $("#screen-over"),
    gallery: $("#screen-gallery"),
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
    // run the live realm animation only while the game screen is visible
    if (window.Realm) Realm.setActive(name === "game");
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
    Sound.deal();
  }

  // ---- Rendering ----
  function renderStats() {
    STATS.forEach((s) => {
      const v = clamp(game.stats[s]);
      els.fills[s].style.width = v + "%";
      els.statEls[s].classList.toggle("danger", v <= 20 || v >= 80);
    });
    els.year.textContent = game.year;
    if (window.Realm) Realm.setStats(game.stats, true);
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
    Sound[side]();
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
      // living through the dilemma teaches its lesson
      const learned = collectWisdom(game.current.id);
      // the realm visibly reacts to the decision
      if (window.Realm) Realm.flourish(eff);
      const doom = checkDoom();
      renderStats();
      if (doom) {
        gameOver(doom);
        locked = false;
        return;
      }
      if (learned) { Sound.learn(); toast("New counsel recorded"); }
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
    game.result = {
      years: game.year,
      win: survivedLong,
      cause: FALL[doom.stat][doom.dir],
      counsels: wisdom.size,
      lessonId: game.current.id,
    };
    const crest = $("#over-crest");
    crest.textContent = survivedLong ? "♚" : "☠";
    crest.classList.toggle("win", survivedLong);
    $("#over-title").textContent = survivedLong
      ? "A Reign Remembered"
      : "Your Reign Ends";

    // save best
    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (game.year > best) localStorage.setItem(BEST_KEY, String(game.year));

    if (survivedLong) Sound.win(); else Sound.lose();
    if (window.Realm) Realm.setMode(survivedLong ? "win" : "lose");
    setTimeout(() => show("over"), 380);
  }

  // ---- Toast ----
  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
  }

  // ---- Wisdom gallery ----
  function buildGallery(focusId) {
    const grid = $("#gallery-grid");
    grid.innerHTML = "";
    let count = 0;
    let focusEl = null;
    SCENARIOS.forEach((s) => {
      const got = wisdom.has(s.id);
      if (got) count++;
      const cardEl = document.createElement("div");
      cardEl.className = "wisdom-card " + (got ? "unlocked" : "locked");
      if (got && s.id === focusId) { cardEl.classList.add("open", "focus"); focusEl = cardEl; }
      if (got) {
        cardEl.innerHTML =
          '<div class="wisdom-head">' +
            '<div class="wisdom-portrait">' + s.portrait + '</div>' +
            '<div><div class="wisdom-name">' + esc(s.name) + '</div>' +
            '<div class="wisdom-tease">' + esc(s.text.slice(0, 46)).trim() + '…</div></div>' +
            '<div class="wisdom-chevron">›</div>' +
          '</div>' +
          '<p class="wisdom-text">' + esc(s.lesson) + '</p>';
        cardEl.querySelector(".wisdom-head").addEventListener("click", () => {
          cardEl.classList.toggle("open");
          Sound.click();
        });
      } else {
        cardEl.innerHTML =
          '<div class="wisdom-head">' +
            '<div class="wisdom-portrait">🔒</div>' +
            '<div><div class="wisdom-name">Undiscovered counsel</div>' +
            '<div class="wisdom-tease">Face this dilemma to unlock it.</div></div>' +
            '<div class="wisdom-chevron">›</div>' +
          '</div>';
      }
      grid.appendChild(cardEl);
    });
    $("#gallery-progress").textContent = count + " / " + SCENARIOS.length + " counsels gathered";
    if (focusEl && focusEl.scrollIntoView) {
      setTimeout(() => focusEl.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    }
  }
  function esc(str) {
    return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function openGallery(focusId) { buildGallery(focusId); show("gallery"); }

  // ---- Share a finished reign (canvas card + Web Share / clipboard fallback) ----
  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(" ");
    let line = "";
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), x, y);
        line = words[i] + " ";
        y += lh;
      } else { line = test; }
    }
    ctx.fillText(line.trim(), x, y);
    return y;
  }

  function renderShareCard(r) {
    const W = 640, H = 800;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    // background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#3a2a1b"); g.addColorStop(0.5, "#1a1410"); g.addColorStop(1, "#120d09");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // border
    ctx.strokeStyle = "#d9b04a"; ctx.lineWidth = 4;
    ctx.strokeRect(22, 22, W - 44, H - 44);
    ctx.textAlign = "center";
    // crest
    ctx.fillStyle = r.win ? "#d9b04a" : "#a8412f";
    ctx.font = "90px serif";
    ctx.fillText(r.win ? "♚" : "☠", W / 2, 150);
    // title
    ctx.fillStyle = "#e7c878";
    ctx.font = "italic 30px Georgia, serif";
    ctx.fillText("The Prince's Dilemma", W / 2, 205);
    // verdict
    ctx.fillStyle = "#f2e6cf";
    ctx.font = "bold 40px Georgia, serif";
    ctx.fillText(r.win ? "A Reign Remembered" : "A Reign Ended", W / 2, 285);
    // years
    ctx.fillStyle = "#d9b04a";
    ctx.font = "bold 150px Georgia, serif";
    ctx.fillText(String(r.years), W / 2, 470);
    ctx.fillStyle = "#b8a587";
    ctx.font = "26px Georgia, serif";
    ctx.fillText(r.years === 1 ? "year on the throne" : "years on the throne", W / 2, 515);
    // cause
    ctx.fillStyle = "#f2e6cf";
    ctx.font = "italic 30px Georgia, serif";
    wrapText(ctx, "“" + r.cause + "”", W / 2, 600, W - 120, 38);
    // counsels
    ctx.fillStyle = "#d9b04a";
    ctx.font = "24px Georgia, serif";
    ctx.fillText(r.counsels + " / " + SCENARIOS.length + " counsels of Machiavelli gathered", W / 2, 700);
    ctx.fillStyle = "#8a7a5f";
    ctx.font = "20px Georgia, serif";
    ctx.fillText("Rule by wit, not by luck.", W / 2, 745);
    return cv;
  }

  function shareText(r) {
    return "I ruled for " + r.years + (r.years === 1 ? " year" : " years") +
      " in The Prince's Dilemma 👑 — " + r.cause.toLowerCase() +
      ". " + r.counsels + "/" + SCENARIOS.length + " of Machiavelli's counsels gathered. Can you reign longer?";
  }

  async function shareResult() {
    const r = game.result;
    if (!r) return;
    const text = shareText(r);
    const cv = renderShareCard(r);
    // Try sharing the rendered card as an image first.
    try {
      const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
      if (blob && navigator.canShare) {
        const file = new File([blob], "prince-reign.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: text, title: "The Prince's Dilemma" });
          return;
        }
      }
    } catch (e) { /* fall through to text/clipboard */ }
    // Text share (no image support)
    try {
      if (navigator.share) { await navigator.share({ text: text, title: "The Prince's Dilemma" }); return; }
    } catch (e) { return; /* user cancelled */ }
    // Last resort: copy to clipboard, and offer the image as a download.
    try {
      if (navigator.clipboard) { await navigator.clipboard.writeText(text); toast("Result copied to clipboard"); }
      else toast("Sharing not supported here");
    } catch (e) { toast("Sharing not supported here"); }
    try {
      const url = cv.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url; a.download = "prince-reign.png"; a.click();
    } catch (e) { /* ignore */ }
  }

  // ---- New game ----
  function newGame() {
    STATS.forEach((s) => { game.stats[s] = START; });
    game.year = 1;
    refillDeck();
    show("game");
    if (window.Realm) {
      Realm.setMode("play");
      Realm.resize();                       // canvas now has real dimensions
      Realm.setStats(game.stats, false);    // start balanced, no tween
    }
    renderStats();
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
  $("#btn-start").addEventListener("click", () => { Sound.click(); newGame(); });
  $("#btn-again").addEventListener("click", () => { Sound.click(); newGame(); });
  $("#btn-menu").addEventListener("click", () => { Sound.click(); showBest(); show("title"); });
  $("#btn-how").addEventListener("click", () => { Sound.click(); show("how"); });
  $("#btn-how-back").addEventListener("click", () => { Sound.click(); show("title"); });
  $("#btn-gallery").addEventListener("click", () => { Sound.click(); openGallery(); });
  $("#btn-over-gallery").addEventListener("click", () => { Sound.click(); openGallery(game.result && game.result.lessonId); });
  $("#btn-gallery-back").addEventListener("click", () => { Sound.click(); show("title"); showBest(); });
  $("#btn-share").addEventListener("click", () => { Sound.click(); shareResult(); });

  // ---- Sound toggle ----
  const soundBtn = $("#btn-sound");
  function renderSoundBtn() {
    soundBtn.textContent = Sound.muted ? "🔇" : "🔊";
    soundBtn.classList.toggle("muted", Sound.muted);
  }
  soundBtn.addEventListener("click", () => {
    const muted = Sound.toggle();
    renderSoundBtn();
    if (!muted) Sound.click();
  });
  renderSoundBtn();

  // Audio contexts must be created/resumed after a user gesture (mobile policy).
  function unlockAudio() {
    Sound.init();
    Sound.resume();
  }
  window.addEventListener("pointerdown", unlockAudio);
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio);

  // Keyboard for desktop play
  window.addEventListener("keydown", (e) => {
    if (!screens.game.classList.contains("active")) return;
    if (e.key === "ArrowLeft") choose("left");
    if (e.key === "ArrowRight") choose("right");
  });

  // ---- Best score on title ----
  function showBest() {
    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    const learned = wisdom.size;
    let txt = best > 0 ? `Your longest reign: ${best} years` : "";
    if (learned > 0) txt += (txt ? " · " : "") + `${learned}/${SCENARIOS.length} counsels`;
    $("#title-best").textContent = txt;
  }

  if (window.Realm) Realm.init();
  showBest();
  show("title");
})();
