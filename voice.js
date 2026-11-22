/* Fix-It Bot — spoken lines, grown-up recordings and sound effects.
   A recording for a line always wins; otherwise the device voice reads it (if switched on). */
(function (root) {
  'use strict';

  var LINES = [
    ['welcome', "Hi! I'm a fix-it robot. Let's fix the town together!"],
    ['ask_name', "Grown-up, please type your child's name."],
    ['ask_robot', 'What should we call your robot?'],
    ['home', 'Tap a place on the map to help fix it.'],
    ['area_bakery', "The bakery's oven is broken! Help your robot get there."],
    ['area_fire', "Oh no! The fire station's robot code has mistakes."],
    ['area_park', "The park swing is broken. Let's fix it!"],
    ['locked', 'Fix the place before this one first.'],
    ['intro_first', 'Tap the arrow to tell your robot where to go. Then press the green button.'],
    ['intro_build', 'Line up arrows to get your robot to the star.'],
    ['new_up', "Here's a new arrow! It goes up."],
    ['intro_order', 'Watch out for the tree. Which way first?'],
    ['new_left_down', 'Two new arrows! Left, and down.'],
    ['intro_pickup', 'Pick up everything on the way, then go to the star.'],
    ['intro_fix_first', 'Uh oh! One arrow is wrong. Tap it, then tap the right arrow.'],
    ['intro_fix', 'One arrow is wrong. Can you find it and fix it?'],
    ['intro_fix_pickup', 'One arrow is wrong. Remember to pick everything up!'],
    ['need_arrows', 'Add some arrows first.'],
    ['full', "That's all the space. Tap an arrow in your code to take it away."],
    ['pick_block', 'Tap an arrow in the code to change it.'],
    ['bump', 'Bonk! Something is in the way.'],
    ['short', 'Not at the star yet.'],
    ['missed', "You're at the star, but something was left behind."],
    ['try_again', 'Try again! Change your arrows and press go.'],
    ['hint', 'Look! This arrow needs to change.'],
    ['hint_add', 'Look! Try this arrow next.'],
    ['hint_remove', 'You got there early! Take away the extra arrows.'],
    ['win', 'You did it!'],
    ['win3', 'Wow, three stars! Perfect!'],
    ['reward_new', 'You earned something new!'],
    ['fewer_tries', 'Try it again in fewer tries to earn a prize.'],
    ['area_fixed_bakery', 'You fixed the bakery! Smell that bread!'],
    ['area_fixed_fire', 'You fixed the fire station! Ding ding!'],
    ['area_fixed_park', 'You fixed the park! Time to swing!'],
    ['part_new', 'Your robot got a new part!'],
    ['studio', 'This is your studio. Make your robot dance!'],
    ['studio_locked', 'Finish your first puzzle to open the studio.'],
    ['studio_things', 'Tap a thing, then tap where it goes.'],
    ['robot_room', 'Make your robot look just right.'],
    ['all_done', 'You fixed the whole town! More places are coming soon.']
  ];
  var TEXT = {};
  LINES.forEach(function (l) { TEXT[l[0]] = l[1]; });

  /* ---------- recordings in IndexedDB (stay on this device) ---------- */
  var DB_NAME = 'fixitbot', STORE = 'voice';
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!root.indexedDB) { rej(new Error('no indexedDB')); return; }
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(STORE, mode), s = t.objectStore(STORE), out;
        var req = fn(s);
        if (req) req.onsuccess = function () { out = req.result; };
        t.oncomplete = function () { res(out); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  var cache = {};       // id -> Blob (loaded at start so playback is instant)
  function loadAll() {
    return db().then(function (d) {
      return new Promise(function (res) {
        var found = {};
        var t = d.transaction(STORE, 'readonly');
        var c = t.objectStore(STORE).openCursor();
        c.onsuccess = function () {
          var cur = c.result;
          if (cur) { if (TEXT[cur.key] && cur.value instanceof Blob) found[cur.key] = cur.value; cur.continue(); }
        };
        t.oncomplete = function () { cache = found; res(); };
        t.onerror = function () { res(); };
      });
    }).catch(function () { cache = {}; });
  }
  function saveRecording(id, blob) {
    if (!TEXT[id]) return Promise.reject(new Error('unknown line'));
    return tx('readwrite', function (s) { return s.put(blob, id); }).then(function () { cache[id] = blob; });
  }
  function deleteRecording(id) {
    return tx('readwrite', function (s) { return s.delete(id); }).then(function () { delete cache[id]; });
  }
  function hasRecording(id) { return !!cache[id]; }
  function allRecordings() { return Object.assign({}, cache); }

  /* ---------- playback ---------- */
  var settings = { device: true, rate: 0.9, sfx: true };
  // One shared player: iPhones only let a sound element play later if it was first started by a tap.
  var player = typeof Audio !== 'undefined' ? new Audio() : null;
  var playerUrl = null, unlocked = false;
  function silentWav() {
    var n = 800, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    function w(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    return new Blob([buf], { type: 'audio/wav' });
  }
  // Called on the first tap anywhere: wakes up the sound player, speech and sound effects.
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try { ctx(); } catch (e) {}
    if (player) { try { player.src = URL.createObjectURL(silentWav()); player.play().catch(function () {}); } catch (e) {} }
    if (root.speechSynthesis) { try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} }
  }
  function stop() {
    if (player) { try { player.pause(); } catch (e) {} }
    if (root.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {}
  }
  function pickVoice() {
    if (!root.speechSynthesis) return null;
    var vs = speechSynthesis.getVoices() || [];
    var en = vs.filter(function (v) { return /^en(-|_)(CA|US|GB)/i.test(v.lang); });
    // Prefer a natural-sounding voice when one is installed; otherwise the first English one.
    var good = en.filter(function (v) { return /enhanced|premium|natural|google/i.test(v.name); });
    return good[0] || en[0] || null;
  }
  function say(id) {
    stop();
    var blob = cache[id];
    if (blob && player) {
      if (playerUrl) URL.revokeObjectURL(playerUrl);
      playerUrl = URL.createObjectURL(blob);
      player.src = playerUrl;
      return player.play().catch(function () {});
    }
    if (!settings.device || !root.speechSynthesis || !TEXT[id]) return Promise.resolve();
    var u = new SpeechSynthesisUtterance(TEXT[id]);
    var v = pickVoice();
    if (v) u.voice = v;
    u.rate = settings.rate;
    u.pitch = 1.05;
    try { speechSynthesis.speak(u); } catch (e) {}
    return Promise.resolve();
  }

  /* ---------- recording with the microphone ---------- */
  var rec = null, chunks = [];
  function pickMime() {
    if (!root.MediaRecorder) return '';
    var opts = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
    for (var i = 0; i < opts.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(opts[i])) return opts[i];
    return '';
  }
  function canRecord() { return !!(root.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
  function startRecording() {
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var mime = pickMime();
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start();
      rec._stream = stream;
    });
  }
  function stopRecording() {
    return new Promise(function (res) {
      if (!rec) { res(null); return; }
      var r = rec;
      r.onstop = function () {
        r._stream.getTracks().forEach(function (t) { t.stop(); });
        res(new Blob(chunks, { type: r.mimeType || 'audio/mp4' }));
      };
      r.stop();
      rec = null;
    });
  }

  /* ---------- sound effects, made in code ---------- */
  var ac = null;
  function ctx() {
    if (!ac) { var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null; ac = new AC(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    var c = ctx(); if (!c) return;
    var t = c.currentTime + (when || 0);
    var o = c.createOscillator(), gn = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, when) {
    var c = ctx(); if (!c) return;
    var t = c.currentTime + (when || 0);
    var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(), gn = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900;
    src.buffer = buf; gn.gain.value = vol || 0.3;
    src.connect(f); f.connect(gn); gn.connect(c.destination);
    src.start(t);
  }
  var SFX = {
    tap: function () { tone(660, 0.07, 'triangle', 0.12); },
    step: function () { tone(520, 0.08, 'triangle', 0.1); },
    bump: function () { tone(180, 0.22, 'square', 0.12, 0, 90); },
    pickup: function () { tone(880, 0.09, 'sine', 0.16); tone(1320, 0.12, 'sine', 0.14, 0.08); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.16, i * 0.11); }); },
    star: function () { tone(1175, 0.15, 'sine', 0.14); },
    reward: function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, 0.14, 'sine', 0.14, i * 0.08); }); },
    nope: function () { tone(300, 0.12, 'triangle', 0.1); },
    boop: function () { tone(440, 0.15, 'sine', 0.18, 0, 330); },
    drum: function () { noise(0.18, 0.35); tone(110, 0.2, 'sine', 0.3, 0, 60); },
    sparkle: function () { [1568, 2093, 2637].forEach(function (f, i) { tone(f, 0.1, 'sine', 0.08, i * 0.06); }); },
    bark: function () { tone(500, 0.08, 'sawtooth', 0.12, 0, 300); tone(520, 0.1, 'sawtooth', 0.12, 0.15, 310); },
    bell: function () { tone(1318, 0.6, 'sine', 0.16); tone(2637, 0.4, 'sine', 0.05); },
    bounce: function () { tone(300, 0.18, 'sine', 0.2, 0, 700); },
    quack: function () { tone(330, 0.16, 'sawtooth', 0.12, 0, 220); },
    pop: function () { noise(0.06, 0.4); tone(900, 0.05, 'square', 0.08); },
    whoosh: function () { noise(0.35, 0.15); },
    meow: function () { tone(700, 0.3, 'triangle', 0.14, 0, 450); }
  };
  function sfx(name) { if (!settings.sfx) return; try { (SFX[name] || SFX.tap)(); } catch (e) {} }

  root.FIB = root.FIB || {};
  root.FIB.Voice = {
    LINES: LINES, TEXT: TEXT, settings: settings,
    say: say, stop: stop, sfx: sfx, loadAll: loadAll, unlock: unlock,
    saveRecording: saveRecording, deleteRecording: deleteRecording, hasRecording: hasRecording, allRecordings: allRecordings,
    canRecord: canRecord, startRecording: startRecording, stopRecording: stopRecording
  };
})(typeof window !== 'undefined' ? window : globalThis);
