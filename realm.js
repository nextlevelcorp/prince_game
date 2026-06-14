/* ===================================================================
   The Prince's Realm — a living, procedurally-drawn kingdom that reacts
   to your rule. No image assets: everything is rendered on a canvas.
   Driven by the four pillars (authority, army, people, treasury 0..100).
   ================================================================== */
(function () {
  "use strict";

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const mix = (c1, c2, t) => [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
  const rgb = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (a == null ? 1 : a) + ")";

  // deterministic tiny RNG so the town layout doesn't jitter every frame
  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  // palettes interpolated by "mood" (0 = grim, 1 = glorious)
  const SKY_TOP = [[44, 40, 60], [96, 142, 196]];
  const SKY_BOT = [[126, 72, 60], [243, 206, 150]];
  const GROUND  = [[58, 52, 42], [86, 104, 60]];

  const Realm = {
    canvas: null, ctx: null, dpr: 1, W: 0, H: 0,
    active: false, raf: 0, t0: 0,
    // animated current vs. target stat values (0..1)
    cur: { authority: .5, army: .5, people: .5, treasury: .5 },
    tgt: { authority: .5, army: .5, people: .5, treasury: .5 },
    layout: null,
    pops: [],      // floating stat change indicators
    sparks: [],    // gold/ember particles
    mode: "play",  // play | win | lose

    init() {
      this.canvas = document.getElementById("realm");
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      this.t0 = performance.now();
      window.addEventListener("resize", () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      const r = this.canvas.getBoundingClientRect();
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.W = Math.max(1, r.width);
      this.H = Math.max(1, r.height);
      this.canvas.width = Math.floor(this.W * this.dpr);
      this.canvas.height = Math.floor(this.H * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.buildLayout();
    },

    // fixed positions for houses / soldiers / crowd, scaled to canvas
    buildLayout() {
      const W = this.W, H = this.H, ground = H * 0.74;
      const rand = rng(20259);
      const houses = [];
      for (let i = 0; i < 9; i++) {
        houses.push({
          x: W * (0.30 + i * 0.072) + (rand() - 0.5) * 6,
          y: ground - 2 - rand() * 6,
          s: 0.85 + rand() * 0.5,
          tone: rand(),
        });
      }
      const soldiers = [];
      for (let i = 0; i < 9; i++) {
        soldiers.push({ x: W * (0.10 + i * 0.028), y: ground + 4 + (i % 2) * 3, ph: rand() * 6.28 });
      }
      const crowd = [];
      for (let i = 0; i < 8; i++) {
        crowd.push({ x: W * (0.12 + i * 0.108), y: H * 0.90 + (rand() - 0.5) * 6, ph: rand() * 6.28, s: 0.9 + rand() * 0.35 });
      }
      const clouds = [];
      for (let i = 0; i < 4; i++) clouds.push({ x: rand() * W, y: H * (0.12 + rand() * 0.22), s: 0.7 + rand() * 0.8, v: 4 + rand() * 6 });
      this.layout = { ground, houses, soldiers, crowd, clouds };
    },

    setActive(on) {
      this.active = on;
      if (on && !this.raf) { this.t0 = performance.now(); this.loop(); }
      if (!on && this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
    },

    setStats(stats, animate) {
      for (const k in this.tgt) this.tgt[k] = clamp01((stats[k] || 0) / 100);
      if (!animate) for (const k in this.cur) this.cur[k] = this.tgt[k];
    },

    setMode(m) { this.mode = m; },

    // floating "+12 👑" indicators + themed particle bursts
    flourish(effects) {
      if (!this.layout) return;
      const W = this.W, H = this.H;
      const spots = {
        authority: { x: W * 0.5, y: H * 0.30, ico: "👑" },
        army:      { x: W * 0.16, y: H * 0.55, ico: "⚔️" },
        people:    { x: W * 0.55, y: H * 0.80, ico: "❤️" },
        treasury:  { x: W * 0.84, y: H * 0.66, ico: "💰" },
      };
      for (const k in spots) {
        const d = effects[k] || 0;
        if (!d) continue;
        const s = spots[k];
        this.pops.push({ x: s.x, y: s.y, txt: (d > 0 ? "+" : "") + d + " " + s.ico, good: d > 0, life: 0, max: 1.5 });
        // gold coins fly when treasury rises; embers when people fall, etc.
        const n = Math.min(10, Math.abs(d));
        for (let i = 0; i < n; i++) {
          this.sparks.push({
            x: s.x + (Math.random() - 0.5) * 30,
            y: s.y + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 40,
            vy: -30 - Math.random() * 50,
            life: 0, max: 0.9 + Math.random() * 0.6,
            col: d > 0 ? [231, 200, 120] : [200, 90, 60],
            r: 2 + Math.random() * 2,
          });
        }
      }
    },

    loop() {
      const now = performance.now();
      const dt = Math.min(0.05, (now - this._last || 16) / 1000);
      this._last = now;
      const t = (now - this.t0) / 1000;
      // ease current toward target
      for (const k in this.cur) this.cur[k] += (this.tgt[k] - this.cur[k]) * Math.min(1, dt * 3.5);
      this.draw(t, dt);
      if (this.active) this.raf = requestAnimationFrame(() => this.loop());
      else this.raf = 0;
    },

    mood() {
      const c = this.cur;
      return clamp01(c.people * 0.42 + c.authority * 0.30 + c.treasury * 0.16 + c.army * 0.12);
    },

    draw(t, dt) {
      const ctx = this.ctx, W = this.W, H = this.H, L = this.layout;
      if (!ctx || !L) return;
      const m = this.mood();
      ctx.clearRect(0, 0, W, H);

      // ---- sky ----
      const top = mix(SKY_TOP[0], SKY_TOP[1], m), bot = mix(SKY_BOT[0], SKY_BOT[1], m);
      const sky = ctx.createLinearGradient(0, 0, 0, L.ground);
      sky.addColorStop(0, rgb(top)); sky.addColorStop(1, rgb(bot));
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, L.ground + 2);

      // ---- sun / moon ----
      const cel = mix([235, 235, 245], [255, 222, 150], m);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = rgb(cel);
      ctx.beginPath(); ctx.arc(W * 0.80, H * 0.20, 26 + 6 * m, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(W * 0.80, H * 0.20, 42 + 10 * m, 0, 7); ctx.fill();
      ctx.restore();

      // ---- clouds (drift) ----
      ctx.fillStyle = rgb(mix([90, 84, 96], [250, 246, 240], m), 0.8);
      for (const c of L.clouds) {
        c.x += c.v * dt; if (c.x > W + 60) c.x = -60;
        this.cloud(ctx, c.x, c.y, 20 * c.s);
      }

      // ---- ground ----
      const g = mix(GROUND[0], GROUND[1], m);
      const gg = ctx.createLinearGradient(0, L.ground, 0, H);
      gg.addColorStop(0, rgb(g)); gg.addColorStop(1, rgb(mix(g, [20, 16, 12], 0.5)));
      ctx.fillStyle = gg; ctx.fillRect(0, L.ground, W, H - L.ground);

      // ---- distant hills ----
      ctx.fillStyle = rgb(mix([52, 50, 60], [70, 92, 70], m), 0.9);
      ctx.beginPath(); ctx.moveTo(0, L.ground);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, L.ground - 26 - 16 * Math.sin(x * 0.012 + 1));
      ctx.lineTo(W, L.ground); ctx.fill();

      // ---- castle (authority) ----
      this.castle(ctx, W * 0.5, L.ground, this.cur.authority, m, t);

      // ---- town (treasury count, people = warmth/health) ----
      const houseCount = 2 + this.cur.treasury * 7;       // up to 9
      const warmth = this.cur.people;                      // lit windows / unburnt
      L.houses.forEach((h, i) => {
        const appear = clamp01(houseCount - i);
        if (appear <= 0.01) return;
        this.house(ctx, h, appear, warmth, m, t, i);
      });

      // ---- army (soldiers) ----
      const armyCount = this.cur.army * 9;
      L.soldiers.forEach((s, i) => {
        const appear = clamp01(armyCount - i);
        if (appear <= 0.01) return;
        this.soldier(ctx, s.x, s.y, appear, m, t, s.ph);
      });

      // ---- treasury chest ----
      this.treasury(ctx, W * 0.86, L.ground + 2, this.cur.treasury, m, t);

      // ---- crowd (people: cheer vs revolt) ----
      const cheer = this.cur.people;          // 1 cheering, 0 angry mob
      L.crowd.forEach((p) => this.townsfolk(ctx, p, cheer, m, t));

      // ---- weather particles (mood) ----
      this.weather(ctx, W, H, m, t);

      // ---- floating stat pops ----
      this.drawPops(ctx, dt);
      this.drawSparks(ctx, dt);

      // ---- vignette ----
      const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.85);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    },

    cloud(ctx, x, y, r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7); ctx.arc(x + r, y + 4, r * 0.8, 0, 7);
      ctx.arc(x - r, y + 5, r * 0.7, 0, 7); ctx.arc(x + r * 0.4, y - r * 0.5, r * 0.7, 0, 7);
      ctx.fill();
    },

    castle(ctx, cx, gy, authority, m, t) {
      const w = Math.min(this.W * 0.34, 150), h = 78 + authority * 26;
      const x = cx - w / 2, y = gy - h;
      const stone = mix([70, 66, 74], [150, 140, 120], m * 0.6 + authority * 0.4);
      const dark = mix(stone, [20, 18, 16], 0.45);
      // keep body
      ctx.fillStyle = rgb(stone);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgb(dark);
      ctx.fillRect(x, y, w, 6);
      // crenellations
      ctx.fillStyle = rgb(stone);
      for (let i = 0; i < w; i += 16) ctx.fillRect(x + i, y - 8, 9, 8);
      // gate
      ctx.fillStyle = rgb(mix([40, 30, 24], [60, 44, 30], m));
      const gw = w * 0.22;
      ctx.beginPath();
      ctx.moveTo(cx - gw / 2, gy); ctx.lineTo(cx - gw / 2, y + h * 0.45);
      ctx.arc(cx, y + h * 0.45, gw / 2, Math.PI, 0); ctx.lineTo(cx + gw / 2, gy); ctx.fill();
      // side towers
      const tw = w * 0.2, th = h + 24 + authority * 18;
      [x - tw * 0.5, x + w - tw * 0.5].forEach((tx) => {
        ctx.fillStyle = rgb(stone); ctx.fillRect(tx, gy - th, tw, th);
        for (let i = 0; i < tw; i += 12) { ctx.fillStyle = rgb(stone); ctx.fillRect(tx + i, gy - th - 7, 7, 7); }
        ctx.fillStyle = rgb(dark); ctx.fillRect(tx, gy - th, tw, 5);
        // window glow if content
        ctx.fillStyle = rgb(mix([30, 24, 20], [255, 200, 90], m), 0.9);
        ctx.fillRect(tx + tw * 0.35, gy - th * 0.6, tw * 0.3, tw * 0.4);
      });
      // crack when authority is failing
      if (authority < 0.33) {
        ctx.strokeStyle = "rgba(20,12,10,0.5)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 8, y + 6);
        ctx.lineTo(cx - 2, y + h * 0.4); ctx.lineTo(cx - 12, y + h * 0.7); ctx.stroke();
      }
      // flagpole + waving banner (authority)
      const fpx = cx, fpy = gy - th - 7;
      ctx.strokeStyle = "rgba(40,34,28,0.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fpx, fpy); ctx.lineTo(fpx, fpy - 30); ctx.stroke();
      const fw = 6 + authority * 26, fh = 14;
      const wave = Math.sin(t * 3) * 3 * authority;
      ctx.fillStyle = rgb(mix([90, 80, 80], [196, 64, 47], authority));
      ctx.beginPath();
      ctx.moveTo(fpx, fpy - 30);
      ctx.lineTo(fpx + fw, fpy - 28 + wave);
      ctx.lineTo(fpx + fw, fpy - 28 + fh + wave);
      ctx.lineTo(fpx, fpy - 30 + fh);
      ctx.closePath(); ctx.fill();
    },

    house(ctx, h, a, warmth, m, t, i) {
      const s = h.s, w = 26 * s, wallH = 22 * s;
      const x = h.x - w / 2, base = h.y, y = base - wallH;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(0, (1 - a) * 10);
      const burning = warmth < 0.22;
      const wall = mix([70, 58, 50], [188, 150, 110], warmth);
      ctx.fillStyle = burning ? rgb(mix([40, 30, 26], [70, 50, 40], 0.5)) : rgb(wall);
      ctx.fillRect(x, y, w, wallH);
      // roof
      ctx.fillStyle = rgb(mix([60, 44, 40], [150, 70, 50], warmth * 0.6 + m * 0.4));
      ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(h.x, y - 14 * s); ctx.lineTo(x + w + 3, y); ctx.closePath(); ctx.fill();
      // window glow
      ctx.fillStyle = rgb(mix([26, 22, 18], [255, 206, 110], warmth), warmth > 0.3 ? 1 : 0.5);
      ctx.fillRect(h.x - 4 * s, y + wallH * 0.35, 8 * s, 8 * s);
      // chimney smoke when content, flames when burning
      if (burning) {
        for (let k = 0; k < 3; k++) {
          const fy = y - 6 - ((t * 30 + i * 20 + k * 14) % 26);
          const fa = 1 - ((t * 30 + i * 20 + k * 14) % 26) / 26;
          ctx.fillStyle = rgb([230, 120 + k * 30, 40], fa * 0.9);
          ctx.beginPath(); ctx.arc(h.x + (k - 1) * 6, fy, 4 * fa + 1, 0, 7); ctx.fill();
        }
      } else if (warmth > 0.45) {
        const sy = y - 14 * s - ((t * 14 + i * 9) % 18);
        ctx.fillStyle = "rgba(210,210,210,0.25)";
        ctx.beginPath(); ctx.arc(h.x + w * 0.28, sy, 3, 0, 7); ctx.fill();
      }
      ctx.restore();
    },

    soldier(ctx, x, y, a, m, t, ph) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x - (1 - a) * 18, y + Math.sin(t * 4 + ph) * 0.8);
      // spear
      ctx.strokeStyle = "rgba(60,46,34,0.95)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(5, 2); ctx.lineTo(5, -22); ctx.stroke();
      ctx.fillStyle = "rgba(200,200,210,0.95)";
      ctx.beginPath(); ctx.moveTo(5, -22); ctx.lineTo(2, -26); ctx.lineTo(8, -26); ctx.closePath(); ctx.fill();
      // body (cloak)
      ctx.fillStyle = rgb(mix([54, 60, 78], [70, 86, 120], m));
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(3, -12); ctx.lineTo(-3, -12); ctx.closePath(); ctx.fill();
      // head + helmet
      ctx.fillStyle = "rgba(214,180,150,1)";
      ctx.beginPath(); ctx.arc(0, -15, 3.2, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(150,150,160,1)";
      ctx.beginPath(); ctx.arc(0, -16, 3.6, Math.PI, 0); ctx.fill();
      ctx.restore();
    },

    townsfolk(ctx, p, cheer, m, t) {
      const angry = 1 - cheer;
      const bob = Math.sin(t * (cheer > 0.5 ? 5 : 3) + p.ph) * (cheer > 0.5 ? 2.4 : 1.2);
      ctx.save();
      ctx.translate(p.x, p.y - bob);
      ctx.scale(p.s, p.s);
      // body
      const cloak = mix([120, 60, 52], [120, 96, 70], cheer);
      ctx.fillStyle = rgb(cloak);
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(3.5, -14); ctx.lineTo(-3.5, -14); ctx.closePath(); ctx.fill();
      // head
      ctx.fillStyle = "rgba(220,186,150,1)";
      ctx.beginPath(); ctx.arc(0, -17, 3.4, 0, 7); ctx.fill();
      // arms: raised cheering, or holding torch/pitchfork when angry
      ctx.strokeStyle = rgb(cloak); ctx.lineWidth = 2;
      if (cheer > 0.5) {
        const sw = Math.sin(t * 6 + p.ph) * 2;
        ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(-7, -19 - sw); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3, -11); ctx.lineTo(7, -19 + sw); ctx.stroke();
      } else {
        // raised torch
        ctx.beginPath(); ctx.moveTo(3, -11); ctx.lineTo(8, -22); ctx.stroke();
        ctx.strokeStyle = "rgba(70,50,34,1)";
        ctx.beginPath(); ctx.moveTo(8, -16); ctx.lineTo(8, -24); ctx.stroke();
        const fl = 1 + Math.sin(t * 14 + p.ph) * 0.3;
        ctx.fillStyle = rgb([235, 150, 50], 0.95 * angry + 0.05);
        ctx.beginPath(); ctx.arc(8, -26, 2.6 * fl, 0, 7); ctx.fill();
        ctx.fillStyle = rgb([250, 220, 120], 0.9 * angry);
        ctx.beginPath(); ctx.arc(8, -26, 1.3 * fl, 0, 7); ctx.fill();
      }
      ctx.restore();
    },

    treasury(ctx, x, gy, tre, m, t) {
      const w = 30, h = 18;
      // chest
      ctx.fillStyle = rgb(mix([60, 44, 30], [96, 64, 36], m));
      ctx.fillRect(x - w / 2, gy - h, w, h);
      ctx.fillStyle = rgb([196, 150, 70]);
      ctx.fillRect(x - w / 2, gy - h, w, 3);
      ctx.fillRect(x - 2, gy - h, 4, h);
      // gold pile grows with treasury
      const coins = Math.round(tre * 10);
      for (let i = 0; i < coins; i++) {
        const row = Math.floor(i / 4), col = i % 4;
        const cxp = x - 9 + col * 6 + (row % 2) * 3;
        const cyp = gy - h - 3 - row * 4;
        ctx.fillStyle = rgb([231, 198, 96]);
        ctx.beginPath(); ctx.arc(cxp, cyp, 2.6, 0, 7); ctx.fill();
        ctx.fillStyle = rgb([255, 232, 150]);
        ctx.beginPath(); ctx.arc(cxp - 0.6, cyp - 0.6, 1.0, 0, 7); ctx.fill();
      }
      // sparkle when rich
      if (tre > 0.6 && Math.sin(t * 4) > 0.6) {
        ctx.fillStyle = "rgba(255,245,200,0.9)";
        const sx = x - 6 + (t * 30 % 18), sy = gy - h - 10 - (t * 20 % 8);
        ctx.beginPath(); ctx.arc(sx, sy, 1.4, 0, 7); ctx.fill();
      }
    },

    weather(ctx, W, H, m, t) {
      if (m > 0.62) {
        // golden motes in a glorious realm
        ctx.fillStyle = "rgba(255,224,150,0.5)";
        for (let i = 0; i < 14; i++) {
          const x = (i * 53 + t * 12) % W;
          const y = (i * 71 + Math.sin(t + i) * 12 + t * 6) % (H * 0.7);
          ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 7); ctx.fill();
        }
      } else if (m < 0.4) {
        // rain when grim
        ctx.strokeStyle = "rgba(150,160,180," + (0.35 * (1 - m / 0.4)) + ")";
        ctx.lineWidth = 1;
        for (let i = 0; i < 40; i++) {
          const x = (i * 41 + t * 220) % W;
          const y = (i * 67 + t * 520) % H;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 9); ctx.stroke();
        }
      }
    },

    drawPops(ctx, dt) {
      ctx.textAlign = "center";
      ctx.font = "bold 16px Georgia, serif";
      for (let i = this.pops.length - 1; i >= 0; i--) {
        const p = this.pops[i];
        p.life += dt; const k = p.life / p.max;
        if (k >= 1) { this.pops.splice(i, 1); continue; }
        const y = p.y - k * 34;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = p.good ? "rgba(150,210,120,1)" : "rgba(232,120,90,1)";
        ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 3;
        ctx.strokeText(p.txt, p.x, y); ctx.fillText(p.txt, p.x, y);
      }
      ctx.globalAlpha = 1;
    },

    drawSparks(ctx, dt) {
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.life += dt; const k = s.life / s.max;
        if (k >= 1) { this.sparks.splice(i, 1); continue; }
        s.vy += 90 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = rgb(s.col);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  };

  window.Realm = Realm;
})();
