/* Fix-It Bot — the grown-up area, behind a 4-digit PIN.
   Progress, worksheets, players, Studio switch, look and sound, voice recordings, backup. */
(function (root) {
  'use strict';
  var C = root.FIB.Content, A = root.FIB.Art, S = root.FIB.Store, V = root.FIB.Voice, App = root.FIB.App, P = root.FIB.Print;
  var h = App.h, btn = App.btn, clear = App.clear;
  var unlocked = false, wrongTries = 0, lockUntil = 0;
  var MAX_IMPORT = 40 * 1024 * 1024, MAX_CLIP = 3 * 1024 * 1024;

  function pbtn(text, onClick, cls) { return h('button', { cls: 'pbtn ' + (cls || ''), text: text, attrs: { type: 'button' }, on: { click: onClick } }); }
  function section(title, kids) { return h('section', { cls: 'psec' }, [h('h2', { text: title })].concat(kids)); }
  var toastT = 0;
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = h('div', { cls: 'toast', attrs: { role: 'status' } }); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 3200);
  }

  /* ---------- PIN pad ---------- */
  function pinPad(title, onDone, onCancel, extra) {
    var entered = '';
    var dots = h('div', { cls: 'pin-dots' });
    var msg = h('p', { cls: 'pin-msg', text: title });
    function draw() { clear(dots); for (var i = 0; i < 4; i++) dots.appendChild(h('span', { cls: i < entered.length ? 'on' : '' })); }
    var keys = h('div', { cls: 'pin-keys' });
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'x'].forEach(function (k) {
      var label = k === 'back' ? '⌫' : (k === 'x' ? 'Cancel' : k);
      keys.appendChild(h('button', { cls: 'pin-key' + (k === 'x' ? ' cancel' : ''), text: label, attrs: { type: 'button' }, label: k === 'back' ? 'Delete' : label,
        on: { click: function () {
          if (k === 'x') { onCancel(); return; }
          if (k === 'back') { entered = entered.slice(0, -1); draw(); return; }
          if (entered.length >= 4) return;
          entered += k; draw();
          if (entered.length === 4) { var v = entered; setTimeout(function () { entered = ''; draw(); onDone(v, msg); }, 150); }
        } } }));
    });
    draw();
    App.show(h('div', { cls: 'pin' }, [h('div', { cls: 'pin-lock', art: A.ICONS.lock }), msg, dots, keys].concat(extra || [])), 'is-pin');
  }

  function open() {
    var st = S.get();
    if (unlocked) { main(); return; }
    if (!st.pin) {
      pinPad('Grown-ups: choose a 4-digit PIN', function (first, msg) {
        pinPad('Type the same PIN again', function (second, msg2) {
          if (first !== second) { msg2.textContent = "Those didn't match. Start again."; setTimeout(open, 1200); return; }
          S.setPin(first).then(function () { unlocked = true; main(); });
        }, function () { App.home(); });
      }, function () { App.home(); });
      return;
    }
    var forgot = pbtn('Forgot the PIN?', forgotPin, 'link');
    pinPad('Grown-ups only: type your PIN', function (pin, msg) {
      if (Date.now() < lockUntil) { msg.textContent = 'Too many tries. Wait a moment.'; return; }
      S.checkPin(pin).then(function (ok) {
        if (ok) { wrongTries = 0; unlocked = true; main(); return; }
        wrongTries++;
        if (wrongTries >= 5) { lockUntil = Date.now() + 30000; wrongTries = 0; msg.textContent = 'Too many tries. Wait 30 seconds.'; }
        else msg.textContent = 'That PIN is not right. Try again.';
      });
    }, function () { App.home(); }, [forgot]);
  }

  function forgotPin() {
    var input = h('input', { cls: 'pinput', attrs: { type: 'text', autocomplete: 'off', autocapitalize: 'characters', 'aria-label': 'Type RESET' } });
    App.show(h('div', { cls: 'parent narrow' }, [
      h('h1', { text: 'Reset the PIN' }),
      h('p', { text: 'Type RESET in capitals to choose a new PIN. Progress, recordings and creations are kept.' }),
      input,
      h('div', { cls: 'prow' }, [pbtn('Cancel', open), pbtn('Reset PIN', function () {
        if (input.value.trim() !== 'RESET') { App.shake(input); return; }
        S.get().pin = null; S.save(); open();
      }, 'primary')])
    ]), 'is-parent');
  }

  function lockAndLeave() { unlocked = false; App.home(); }

  /* ---------- main grown-up page ---------- */
  function main(scrollTo) {
    var st = S.get(), ch = S.child();
    var page = h('div', { cls: 'parent' });
    page.appendChild(h('div', { cls: 'p-top' }, [h('h1', { text: 'Grown-ups' }), pbtn('Done', lockAndLeave, 'primary')]));

    // who
    if (st.children.length > 1) {
      var chips = h('div', { cls: 'chips' });
      st.children.forEach(function (k) {
        chips.appendChild(h('button', { cls: 'chip' + (k.id === ch.id ? ' on' : ''), text: k.name, attrs: { type: 'button' }, on: { click: function () { st.activeChild = k.id; S.save(); main(); } } }));
      });
      page.appendChild(chips);
    }

    // progress
    var prog = h('div', { cls: 'p-progress' });
    C.AREAS.forEach(function (a) {
      var done = a.levels.filter(function (l) { return S.levelDone(ch, l.id); }).length;
      var stars = a.levels.reduce(function (n, l) { return n + ((ch.levels[l.id] && ch.levels[l.id].stars) || 0); }, 0);
      prog.appendChild(h('div', { cls: 'pp-row' }, [
        h('div', { cls: 'pp-place', text: { bakery: 'Bakery', fire: 'Fire station', park: 'Park' }[a.id] + (ch.areasFixed[a.id] ? ' (fixed)' : '') }),
        h('div', { cls: 'pp-skill', text: a.skill }),
        h('div', { cls: 'pp-bar' }, [h('span', { cls: 'pp-fill', attrs: { 'data-w': String(Math.round(done / 8 * 100)) } })]),
        h('div', { cls: 'pp-meta', text: done + ' of 8 puzzles, ' + stars + ' of 24 stars' })
      ]));
    });
    page.appendChild(section('Progress for ' + ch.name, [prog, h('div', { cls: 'prow' }, [pbtn('Print a progress note', function () { P.progressNote(ch, function () { main(); }); })])]));

    // worksheets
    var waiting = ch.sheets.filter(function (s) { return !s.marked; });
    var wlist = h('div', { cls: 'wlist' });
    if (!waiting.length) wlist.appendChild(h('p', { cls: 'muted', text: 'No sheets waiting to be marked.' }));
    waiting.slice().reverse().forEach(function (sh) {
      wlist.appendChild(h('div', { cls: 'witem' }, [
        h('span', { cls: 'wid', text: sh.id }),
        h('span', { cls: 'wdate', text: new Date(sh.printed).toLocaleDateString() }),
        pbtn('Reprint', function () { P.mazeSheet(sh, ch, function () { main(); }); }),
        pbtn('Mark', function () { markSheet(sh); }, 'primary')
      ]));
    });
    page.appendChild(section('Worksheets', [
      h('p', { cls: 'muted', text: 'Paper practice earns prizes too. Print a sheet, let them draw the arrows, then mark it here. 3 or 4 mazes right earns a prize.' }),
      h('div', { cls: 'prow' }, [
        pbtn('Print a maze sheet', function () {
          var id = 'M-' + (1000 + Math.floor(Math.random() * 9000));
          var sh = { id: id, seed: Math.floor(Math.random() * 1e9), printed: Date.now(), marked: null };
          ch.sheets.push(sh); if (ch.sheets.length > 60) ch.sheets.shift();
          S.save();
          P.mazeSheet(sh, ch, function () { main(); });
        }, 'primary'),
        pbtn('Print arrow cards', function () { P.arrowCards(ch, function () { main(); }); })
      ]),
      wlist
    ]));

    // players
    var plist = h('div', { cls: 'plist' });
    st.children.forEach(function (k) {
      var n1 = h('input', { cls: 'pinput', attrs: { type: 'text', maxlength: String(S.MAX_NAME), 'aria-label': 'Child name', autocomplete: 'off' } });
      var n2 = h('input', { cls: 'pinput', attrs: { type: 'text', maxlength: String(S.MAX_NAME), 'aria-label': 'Robot name', autocomplete: 'off' } });
      n1.value = k.name; n2.value = k.robotName;
      var del = pbtn('Delete', function () {
        if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = 'Tap again to delete'; return; }
        st.children = st.children.filter(function (c) { return c.id !== k.id; });
        st.activeChild = st.children[0] ? st.children[0].id : null;
        S.save();
        if (!st.children.length) { unlocked = false; App.setup(); return; }
        main();
      }, 'danger');
      plist.appendChild(h('div', { cls: 'pitem' }, [
        h('div', { cls: 'pi-bot', art: A.robotSvg(App.robotOpts(k)) }),
        h('label', {}, ['Child', n1]), h('label', {}, ['Robot', n2]),
        h('div', { cls: 'prow' }, [pbtn('Save names', function () {
          var a = S.cleanName(n1.value), b = S.cleanName(n2.value);
          if (!a || !b) { toast('Names cannot be empty.'); return; }
          k.name = a; k.robotName = b; S.save(); toast('Saved.'); main();
        }), del])
      ]));
    });
    page.appendChild(section('Players', [plist, st.children.length < S.MAX_CHILDREN ? h('div', { cls: 'prow' }, [pbtn('Add a player', function () { unlocked = false; App.setup(true); })]) : null]));

    // studio
    var all = h('input', { attrs: { type: 'checkbox', 'aria-label': 'Open all arrows in the Studio' } });
    all.checked = !!ch.studio.allBlocks;
    all.addEventListener('change', function () { ch.studio.allBlocks = all.checked; S.save(); toast(all.checked ? 'All arrows open in the Studio.' : 'Studio shows only learned arrows.'); });
    page.appendChild(section('Studio', [h('label', { cls: 'switch' }, [all, h('span', { text: 'Open all arrows in the Studio for ' + ch.name + ' (otherwise only the ones learned in puzzles)' })])]));

    // look and sound
    var themes = h('div', { cls: 'themes' });
    [['warm', 'Warm'], ['bright', 'Bright'], ['night', 'Night']].forEach(function (t) {
      themes.appendChild(h('button', { cls: 'theme-sw sw-' + t[0] + (st.theme === t[0] ? ' on' : ''), text: t[1], attrs: { type: 'button' }, on: { click: function () { st.theme = t[0]; S.save(); App.applyTheme(); main(); } } }));
    });
    function toggle(label, key) {
      var cb = h('input', { attrs: { type: 'checkbox' } });
      cb.checked = !!st.voice[key];
      cb.addEventListener('change', function () { st.voice[key] = cb.checked; S.save(); App.applyVoice(); });
      return h('label', { cls: 'switch' }, [cb, h('span', { text: label })]);
    }
    var rate = h('input', { attrs: { type: 'range', min: '0.6', max: '1.2', step: '0.05', 'aria-label': 'Voice speed' } });
    rate.value = String(st.voice.rate);
    rate.addEventListener('change', function () { st.voice.rate = Number(rate.value); S.save(); App.applyVoice(); V.say('intro_build'); });
    page.appendChild(section('Look and sound', [themes, toggle('Sound effects', 'sfx'), toggle('Device voice reads lines you have not recorded', 'device'), h('label', { cls: 'slider' }, [h('span', { text: 'Device voice speed' }), rate])]));

    // recordings
    page.appendChild(section('Your voice', [
      h('p', { cls: 'muted', text: 'Record any line in your own voice. Your recording replaces the device voice for that line. Recordings stay on this device; use Backup to move them to another one.' }),
      V.canRecord() ? null : h('p', { cls: 'warn', text: 'This browser cannot record sound. Try Chrome or Safari on a phone or tablet.' }),
      recorderList()
    ]));

    // backup
    var file = h('input', { cls: 'hidden', attrs: { type: 'file', accept: 'application/json,.json' } });
    file.addEventListener('change', function () { if (file.files[0]) importFile(file.files[0]); file.value = ''; });
    page.appendChild(section('Backup', [
      h('p', { cls: 'muted', text: 'Everything is saved on this device only. Make a backup file to keep it safe or move it to another phone or tablet.' }),
      h('div', { cls: 'prow' }, [pbtn('Make a backup file', exportAll, 'primary'), pbtn('Load a backup file', function () { file.click(); }), file])
    ]));

    // pin & about
    page.appendChild(section('PIN and privacy', [
      h('p', { cls: 'muted', text: 'The PIN keeps little fingers out of this page. It is not strong security: anyone with the device and some know-how could get around it.' }),
      h('p', { cls: 'muted', text: 'Fix-It Bot has no accounts, ads, tracking or outside scripts, and sends nothing over the internet.' }),
      h('div', { cls: 'prow' }, [pbtn('Change PIN', function () {
        pinPad('Choose a new 4-digit PIN', function (a1) {
          pinPad('Type it again', function (a2, m) {
            if (a1 !== a2) { m.textContent = "Those didn't match."; setTimeout(function () { main(); }, 1000); return; }
            S.setPin(a1).then(function () { toast('PIN changed.'); main(); });
          }, function () { main(); });
        }, function () { main(); });
      })])
    ]));

    App.show(page, 'is-parent');
    page.querySelectorAll('.pp-fill').forEach(function (f) { f.style.width = f.getAttribute('data-w') + '%'; });
  }

  /* ---------- marking a printed sheet ---------- */
  function markSheet(sh) {
    var ch = S.child();
    var opts = h('div', { cls: 'mark-opts' });
    [0, 1, 2, 3, 4].forEach(function (n) {
      opts.appendChild(h('button', { cls: 'mark-n', text: String(n), attrs: { type: 'button' }, on: { click: function () {
        var reward = null;
        if (n >= 3) reward = S.nextBonus(ch);
        sh.marked = { correct: n, of: 4, at: Date.now(), reward: reward };
        S.save();
        if (n >= 3) toast(reward ? 'Prize earned: ' + reward.replace(/^(prop|hat|paint)_/, '') + '. It is waiting in the app.' : 'Great work! Every worksheet prize is already earned.');
        else toast('Marked. 3 or more right earns a prize next time.');
        main();
      } } }));
    });
    App.show(h('div', { cls: 'parent narrow' }, [
      h('h1', { text: 'Mark sheet ' + sh.id }),
      h('p', { text: 'How many of the 4 mazes reach the star? Any route counts if every step stays on the board and misses the trees, bushes and ponds.' }),
      opts,
      h('div', { cls: 'prow' }, [pbtn('See the answer key', function () { P.mazeSheet(sh, ch, function () { markSheet(sh); }); }), pbtn('Cancel', function () { main(); })])
    ]), 'is-parent');
  }

  /* ---------- voice recorder ---------- */
  function recorderList() {
    var list = h('div', { cls: 'rec-list' });
    var recording = null;
    V.LINES.forEach(function (line) {
      var id = line[0];
      var state = h('span', { cls: 'rec-state', text: V.hasRecording(id) ? 'Your voice' : 'Device voice' });
      var recB = pbtn('Record', function () {
        if (recording && recording !== id) { toast('Stop the other recording first.'); return; }
        if (recording === id) {
          V.stopRecording().then(function (blob) {
            recording = null; recB.textContent = 'Record'; recB.classList.remove('live');
            if (!blob || !blob.size) { toast('Nothing was recorded.'); return; }
            if (blob.size > MAX_CLIP) { toast('That recording is too long. Keep it under about 20 seconds.'); return; }
            V.saveRecording(id, blob).then(function () { state.textContent = 'Your voice'; V.say(id); });
          });
          return;
        }
        V.stop();
        V.startRecording().then(function () { recording = id; recB.textContent = 'Stop'; recB.classList.add('live'); })
          .catch(function () { toast('The microphone is blocked. Allow it in the browser settings.'); });
      }, 'primary');
      if (!V.canRecord()) recB.disabled = true;
      list.appendChild(h('div', { cls: 'rec-item' }, [
        h('div', { cls: 'rec-text', text: line[1] }),
        h('div', { cls: 'rec-btns' }, [state, pbtn('Play', function () { V.say(id); }), recB, pbtn('Delete', function () {
          V.deleteRecording(id).then(function () { state.textContent = 'Device voice'; });
        })])
      ]));
    });
    return list;
  }

  /* ---------- backup ---------- */
  function blobToDataUrl(b) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(b); });
  }
  function dataUrlToBlob(url) {
    var m = /^data:(audio\/[a-z0-9.+-]+(?:;[a-z0-9=.+-]+)*);base64,([A-Za-z0-9+/=]+)$/i.exec(url);
    if (!m) return null;
    var bin = atob(m[2]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    if (arr.length > MAX_CLIP) return null;
    return new Blob([arr], { type: m[1].split(';')[0] });
  }
  function exportAll() {
    var recs = V.allRecordings(), ids = Object.keys(recs), voice = {};
    Promise.all(ids.map(function (id) { return blobToDataUrl(recs[id]).then(function (u) { voice[id] = u; }); })).then(function () {
      var data = { app: 'fix-it-bot', v: 1, exported: new Date().toISOString(), state: S.get(), voice: voice };
      var name = 'fix-it-bot-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      var fileObj = null;
      try { fileObj = new File([blob], name, { type: 'application/json' }); } catch (e) {}
      if (fileObj && navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        navigator.share({ files: [fileObj], title: 'Fix-It Bot backup' }).catch(function () {});
        return;
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast('Backup file made.');
    });
  }
  function importFile(f) {
    if (f.size > MAX_IMPORT) { toast('That file is too big to be a Fix-It Bot backup.'); return; }
    f.text().then(function (txt) {
      var data;
      try { data = JSON.parse(txt); } catch (e) { toast('That file is not a Fix-It Bot backup.'); return; }
      if (!data || data.app !== 'fix-it-bot' || typeof data.state !== 'object') { toast('That file is not a Fix-It Bot backup.'); return; }
      var checked = S.validate(data.state);
      var clips = {};
      if (data.voice && typeof data.voice === 'object') Object.keys(data.voice).forEach(function (id) {
        if (!V.TEXT[id] || typeof data.voice[id] !== 'string') return;
        var b = dataUrlToBlob(data.voice[id]);
        if (b) clips[id] = b;
      });
      var kids = checked.children.map(function (c) { return c.name; }).join(', ') || 'no players';
      App.show(h('div', { cls: 'parent narrow' }, [
        h('h1', { text: 'Load this backup?' }),
        h('p', { text: 'It has ' + checked.children.length + ' player(s): ' + kids + ', and ' + Object.keys(clips).length + ' voice recording(s).' }),
        h('p', { cls: 'warn', text: 'This replaces everything on this device, including the PIN.' }),
        h('div', { cls: 'prow' }, [pbtn('Cancel', function () { main(); }), pbtn('Replace everything', function () {
          S.replaceAll(checked);
          var ids = Object.keys(clips);
          Promise.all(V.LINES.map(function (l) { return V.deleteRecording(l[0]).catch(function () {}); }))
            .then(function () { return Promise.all(ids.map(function (id) { return V.saveRecording(id, clips[id]); })); })
            .then(function () { App.applyTheme(); App.applyVoice(); toast('Backup loaded.'); unlocked = false; App.start(); });
        }, 'danger')])
      ]), 'is-parent');
    });
  }

  root.FIB = root.FIB || {};
  root.FIB.Parent = { open: open, lock: function () { unlocked = false; } };
})(window);
