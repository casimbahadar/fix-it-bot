/* Fix-It Bot — saved state. Everything lives on this device (localStorage), nothing is sent anywhere.
   Also: progress rules (what is open, what is earned), the grown-up PIN, and backup checking. */
(function (root) {
  'use strict';
  var KEY = 'fixitbot.v1';
  var C = root.FIB.Content;
  var MAX_NAME = 20, MAX_CHILDREN = 6, MAX_CREATIONS = 12, MAX_PROPS = 8, MAX_STUDIO_BLOCKS = 12;

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function cleanName(s) {
    // Plain text only: trim, collapse spaces, drop control characters, cap length.
    return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  }

  function blankState() {
    return {
      v: 1, theme: 'warm',
      voice: { device: true, rate: 0.9, sfx: true },
      pin: null,             // { salt, hash }
      activeChild: null,
      children: []
    };
  }
  function newChild(name, robotName) {
    var owned = {};
    Object.keys(C.ITEMS).forEach(function (k) { if (C.ITEMS[k].starter) owned[k] = true; });
    return {
      id: uid(), name: cleanName(name) || 'Friend', robotName: cleanName(robotName) || 'Robot', created: Date.now(),
      robot: { paint: 'paint_teal', top: 'top_ball', arms: 'arms_plain' },
      owned: owned, levels: {}, areasFixed: {},
      studio: { allBlocks: false, creations: [] },
      sheets: [], bonusIdx: 0, seen: {}
    };
  }

  var state = null;
  function load() {
    try {
      var raw = root.localStorage.getItem(KEY);
      state = raw ? validate(JSON.parse(raw)) : blankState();
    } catch (e) { state = blankState(); }
    return state;
  }
  function save() {
    try { root.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }
  function get() { return state || load(); }
  function child() {
    var s = get();
    for (var i = 0; i < s.children.length; i++) if (s.children[i].id === s.activeChild) return s.children[i];
    return s.children[0] || null;
  }

  /* ---------- progress rules ---------- */
  function levelDone(ch, id) { return !!(ch.levels[id] && ch.levels[id].done); }
  function areaComplete(ch, area) { return area.levels.every(function (l) { return levelDone(ch, l.id); }); }
  function areaOpen(ch, idx) { return idx === 0 || !!ch.areasFixed[C.AREAS[idx - 1].id]; }
  function levelOpen(ch, area, idx) { return idx === 0 || levelDone(ch, area.levels[idx - 1].id); }
  function currentArea(ch) {
    for (var i = 0; i < C.AREAS.length; i++) if (!ch.areasFixed[C.AREAS[i].id]) return areaOpen(ch, i) ? C.AREAS[i].id : null;
    return C.AREAS[C.AREAS.length - 1].id;
  }
  // Arrows she has learned = arrows used in puzzles she has passed.
  function learnedArrows(ch) {
    var set = {};
    C.allLevels().forEach(function (l) { if (levelDone(ch, l.id)) l.arrows.forEach(function (a) { set[a] = 1; }); });
    return ['U', 'L', 'R', 'D'].filter(function (a) { return set[a]; });
  }
  function totalStars(ch) {
    var n = 0; Object.keys(ch.levels).forEach(function (k) { n += ch.levels[k].stars || 0; }); return n;
  }

  /* Record a solved puzzle. Returns what changed so the screen can celebrate. */
  function recordWin(levelId, stars) {
    var ch = child(), lvl = C.levelById(levelId);
    var rec = ch.levels[levelId] || { stars: 0, done: false, rewarded: false };
    var out = { firstSolve: !rec.done, newBest: stars > rec.stars, reward: null, areaFixed: null, part: null };
    rec.done = true;
    rec.stars = Math.max(rec.stars, stars);
    if (stars >= 2 && !rec.rewarded) {
      rec.rewarded = true;
      ch.owned[lvl.reward] = true;
      out.reward = lvl.reward;
    }
    ch.levels[levelId] = rec;
    var area = C.areaById(lvl.area);
    if (!ch.areasFixed[area.id] && areaComplete(ch, area)) {
      ch.areasFixed[area.id] = true;
      ch.owned[area.partReward] = true;
      out.areaFixed = area.id;
      out.part = area.partReward;
    }
    save();
    return out;
  }
  function nextBonus(ch) {
    while (ch.bonusIdx < C.BONUS_ORDER.length && ch.owned[C.BONUS_ORDER[ch.bonusIdx]]) ch.bonusIdx++;
    if (ch.bonusIdx >= C.BONUS_ORDER.length) return null;
    var id = C.BONUS_ORDER[ch.bonusIdx++];
    ch.owned[id] = true;
    return id;
  }

  /* ---------- grown-up PIN (a lock against curious kids, not real security) ---------- */
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function hashPin(pin, salt) {
    var data = new TextEncoder().encode(salt + ':' + pin);
    if (root.crypto && crypto.subtle) return crypto.subtle.digest('SHA-256', data).then(hex);
    // Fallback for pages opened without https: simple FNV hash (still not reversible at a glance).
    var h = 2166136261;
    for (var i = 0; i < data.length; i++) { h ^= data[i]; h = Math.imul(h, 16777619) >>> 0; }
    return Promise.resolve('f' + h.toString(16));
  }
  function setPin(pin) {
    var salt = uid() + uid();
    return hashPin(pin, salt).then(function (h) { get().pin = { salt: salt, hash: h }; save(); });
  }
  function checkPin(pin) {
    var p = get().pin;
    if (!p) return Promise.resolve(false);
    return hashPin(pin, p.salt).then(function (h) { return h === p.hash; });
  }

  /* ---------- backup checking: rebuild the state from known fields only ---------- */
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function num(n, lo, hi, d) { n = Number(n); return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; }
  var ARROW = { U: 1, D: 1, L: 1, R: 1 };
  function validate(raw) {
    var s = blankState();
    if (!isObj(raw)) return s;
    s.theme = ['warm', 'bright', 'night'].indexOf(raw.theme) >= 0 ? raw.theme : 'warm';
    if (isObj(raw.voice)) {
      s.voice.device = raw.voice.device !== false;
      s.voice.sfx = raw.voice.sfx !== false;
      s.voice.rate = num(raw.voice.rate, 0.6, 1.2, 0.9);
    }
    if (isObj(raw.pin) && typeof raw.pin.salt === 'string' && typeof raw.pin.hash === 'string' &&
        raw.pin.salt.length <= 64 && raw.pin.hash.length <= 128) s.pin = { salt: raw.pin.salt, hash: raw.pin.hash };
    var kids = Array.isArray(raw.children) ? raw.children.slice(0, MAX_CHILDREN) : [];
    kids.forEach(function (k) {
      if (!isObj(k)) return;
      var ch = newChild(k.name, k.robotName);
      if (typeof k.id === 'string' && /^[a-z0-9]{1,16}$/.test(k.id)) ch.id = k.id;
      ch.created = num(k.created, 0, 4e12, Date.now());
      if (isObj(k.owned)) Object.keys(k.owned).forEach(function (id) { if (C.ITEMS[id] && k.owned[id] === true) ch.owned[id] = true; });
      if (isObj(k.robot)) {
        var r = k.robot;
        if (C.ITEMS[r.paint] && C.ITEMS[r.paint].kind === 'paint') ch.robot.paint = r.paint;
        if (r.top === 'top_ball' || (C.ITEMS[r.top] && (C.ITEMS[r.top].kind === 'hat' || C.ITEMS[r.top].slot === 'top'))) ch.robot.top = r.top;
        if (r.arms === 'arms_plain' || r.arms === 'arms_mitts') ch.robot.arms = r.arms;
      }
      if (isObj(k.levels)) Object.keys(k.levels).forEach(function (id) {
        var L = k.levels[id];
        if (!C.levelById(id) || !isObj(L)) return;
        ch.levels[id] = { stars: num(L.stars, 0, 3, 0) | 0, done: L.done === true, rewarded: L.rewarded === true };
      });
      if (isObj(k.areasFixed)) C.AREAS.forEach(function (a) { if (k.areasFixed[a.id] === true) ch.areasFixed[a.id] = true; });
      if (isObj(k.studio)) {
        ch.studio.allBlocks = k.studio.allBlocks === true;
        var cr = Array.isArray(k.studio.creations) ? k.studio.creations.slice(0, MAX_CREATIONS) : [];
        cr.forEach(function (c) {
          if (!isObj(c)) return;
          var clean = { id: uid(), bg: 'bg_meadow', props: [], program: [], start: { x: 2, y: 2 }, updated: num(c.updated, 0, 4e12, Date.now()) };
          if (C.ITEMS[c.bg] && C.ITEMS[c.bg].kind === 'bg') clean.bg = c.bg;
          if (Array.isArray(c.props)) c.props.slice(0, MAX_PROPS).forEach(function (p) {
            if (isObj(p) && C.ITEMS[p.id] && C.ITEMS[p.id].kind === 'prop') clean.props.push({ id: p.id, x: num(p.x, 0, 4, 0) | 0, y: num(p.y, 0, 4, 0) | 0 });
          });
          if (Array.isArray(c.program)) clean.program = c.program.filter(function (a) { return ARROW[a]; }).slice(0, MAX_STUDIO_BLOCKS);
          if (isObj(c.start)) clean.start = { x: num(c.start.x, 0, 4, 2) | 0, y: num(c.start.y, 0, 4, 2) | 0 };
          ch.studio.creations.push(clean);
        });
      }
      if (Array.isArray(k.sheets)) k.sheets.slice(-60).forEach(function (sh) {
        if (!isObj(sh) || typeof sh.id !== 'string' || !/^M-\d{4,6}$/.test(sh.id)) return;
        var c2 = { id: sh.id, seed: num(sh.seed, 0, 1e9, 1) | 0, printed: num(sh.printed, 0, 4e12, 0), marked: null };
        if (isObj(sh.marked)) c2.marked = { correct: num(sh.marked.correct, 0, 4, 0) | 0, of: 4, at: num(sh.marked.at, 0, 4e12, 0), reward: (C.ITEMS[sh.marked.reward] ? sh.marked.reward : null) };
        ch.sheets.push(c2);
      });
      ch.bonusIdx = num(k.bonusIdx, 0, C.BONUS_ORDER.length, 0) | 0;
      if (isObj(k.seen)) Object.keys(k.seen).slice(0, 80).forEach(function (id) { if (/^[a-z_0-9]{1,24}$/.test(id)) ch.seen[id] = true; });
      s.children.push(ch);
    });
    var act = s.children.filter(function (c) { return c.id === raw.activeChild; })[0];
    s.activeChild = act ? act.id : (s.children[0] ? s.children[0].id : null);
    return s;
  }

  function replaceAll(newState) { state = validate(newState); save(); return state; }

  root.FIB = root.FIB || {};
  root.FIB.Store = {
    KEY: KEY, MAX_NAME: MAX_NAME, MAX_CHILDREN: MAX_CHILDREN, MAX_CREATIONS: MAX_CREATIONS, MAX_PROPS: MAX_PROPS, MAX_STUDIO_BLOCKS: MAX_STUDIO_BLOCKS,
    load: load, save: save, get: get, child: child, newChild: newChild, cleanName: cleanName, uid: uid,
    levelDone: levelDone, areaComplete: areaComplete, areaOpen: areaOpen, levelOpen: levelOpen, currentArea: currentArea,
    learnedArrows: learnedArrows, totalStars: totalStars, recordWin: recordWin, nextBonus: nextBonus,
    setPin: setPin, checkPin: checkPin, validate: validate, replaceAll: replaceAll
  };
})(typeof window !== 'undefined' ? window : globalThis);
