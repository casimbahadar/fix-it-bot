/* Fix-It Bot — screens for the child: first run, who's playing, town map, areas, puzzles, rewards, My Robot.
   Studio lives in studio.js, the grown-up area in parent.js, printables in print.js. */
(function (root) {
  'use strict';
  var E = root.FIB.Engine, C = root.FIB.Content, A = root.FIB.Art, S = root.FIB.Store, V = root.FIB.Voice;
  var app = document.getElementById('app');

  /* ---------- tiny DOM helper. Text always goes in as text; html is only for our own drawings. ---------- */
  function h(tag, props, kids) {
    var el = document.createElement(tag);
    props = props || {};
    if (props.cls) el.className = props.cls;
    if (props.text != null) el.textContent = props.text;
    if (props.art != null) el.innerHTML = props.art;          // fixed SVG from art.js only
    if (props.attrs) for (var k in props.attrs) el.setAttribute(k, props.attrs[k]);
    if (props.on) for (var ev in props.on) el.addEventListener(ev, props.on[ev]);
    if (props.label) el.setAttribute('aria-label', props.label);
    (kids || []).forEach(function (c) { if (c == null) return; el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function btn(cls, art, label, onClick) {
    return h('button', { cls: 'btn ' + cls, art: art, label: label, attrs: { type: 'button' }, on: { click: function (e) { V.sfx('tap'); onClick(e); } } });
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function robotOpts(ch, mood) {
    return { paint: C.ITEMS[ch.robot.paint], top: ch.robot.top, arms: ch.robot.arms, mood: mood || 'happy' };
  }
  function applyTheme() { document.documentElement.setAttribute('data-theme', S.get().theme); }
  function applyVoice() { var v = S.get().voice; V.settings.device = v.device; V.settings.rate = v.rate; V.settings.sfx = v.sfx; }

  var screenToken = 0;
  function show(node, cls) {
    screenToken++;
    V.stop();
    clear(app);
    app.className = 'screen ' + (cls || '');
    app.appendChild(node);
    app.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  function topBar(left, middle, right) {
    return h('div', { cls: 'topbar' }, [h('div', { cls: 'tb-l' }, left || []), h('div', { cls: 'tb-m' }, middle || []), h('div', { cls: 'tb-r' }, right || [])]);
  }
  function speakerBtn(lineId) { return btn('round blue', A.ICONS.speaker, 'Hear it again', function () { V.say(lineId); }); }

  /* ---------- first run ---------- */
  function setup(addingFromParent) {
    var step = addingFromParent ? 1 : 0;
    var nameVal = '', robotVal = '';
    var wrap = h('div', { cls: 'setup' });
    function render() {
      clear(wrap);
      var bot = h('div', { cls: 'setup-bot', art: A.robotSvg({ mood: step === 2 ? 'wow' : 'happy' }) });
      wrap.appendChild(h('div', { cls: 'logo' }, [h('span', { cls: 'logo-fix', text: 'Fix-It' }), h('span', { cls: 'logo-bot', text: 'Bot' })]));
      wrap.appendChild(bot);
      if (step === 0) {
        wrap.appendChild(btn('go big-go', A.ICONS.go, 'Start', function () { step = 1; V.say('welcome'); render(); }));
        return;
      }
      var isName = step === 1;
      var input = h('input', { cls: 'name-input', attrs: { type: 'text', maxlength: String(S.MAX_NAME), autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'next', 'aria-label': isName ? "Child's name" : "Robot's name" } });
      input.value = isName ? nameVal : robotVal;
      wrap.appendChild(h('p', { cls: 'setup-q', text: isName ? "Grown-up: type your child's name" : "What's your robot called?" }));
      wrap.appendChild(input);
      function next() {
        var v = S.cleanName(input.value);
        if (!v) { shake(input); input.focus(); return; }
        if (isName) { nameVal = v; step = 2; render(); V.say('ask_robot'); return; }
        robotVal = v;
        var st = S.get();
        if (st.children.length >= S.MAX_CHILDREN) { shake(input); return; }
        var ch = S.newChild(nameVal, robotVal);
        st.children.push(ch);
        st.activeChild = ch.id;
        S.save();
        home(true);
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') next(); });
      var row = h('div', { cls: 'setup-row' });
      if (step === 2) row.appendChild(btn('round', A.ICONS.back, 'Back', function () { robotVal = input.value; step = 1; render(); }));
      row.appendChild(btn('go', A.ICONS.next, 'Next', next));
      wrap.appendChild(row);
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 50);
    }
    render();
    show(wrap, 'is-setup');
    if (addingFromParent) V.say('ask_name');
  }

  /* ---------- who's playing ---------- */
  function profiles() {
    var st = S.get();
    var list = h('div', { cls: 'profiles' });
    st.children.forEach(function (ch) {
      list.appendChild(h('button', { cls: 'profile-card', attrs: { type: 'button' }, on: { click: function () { V.sfx('tap'); st.activeChild = ch.id; S.save(); home(); } } }, [
        h('div', { cls: 'pc-bot', art: A.robotSvg(robotOpts(ch)) }),
        h('div', { cls: 'pc-name', text: ch.name })
      ]));
    });
    show(h('div', { cls: 'center-col' }, [
      h('div', { cls: 'logo' }, [h('span', { cls: 'logo-fix', text: 'Fix-It' }), h('span', { cls: 'logo-bot', text: 'Bot' })]),
      list
    ]), 'is-profiles');
  }

  /* ---------- home: the town map ---------- */
  function home(fresh) {
    var ch = S.child();
    if (!ch) { setup(); return; }
    var mapState = { robot: robotOpts(ch), at: S.currentArea(ch) };
    C.AREAS.forEach(function (a, i) { mapState[a.id] = { open: S.areaOpen(ch, i), fixed: !!ch.areasFixed[a.id] }; });
    var allFixed = C.AREAS.every(function (a) { return ch.areasFixed[a.id]; });
    var map = h('div', { cls: 'town', art: A.townMap(mapState) });
    map.addEventListener('click', function (e) {
      var g = e.target.closest ? e.target.closest('.fib-area') : null;
      if (!g) return;
      var id = g.getAttribute('data-area');
      var idx = C.AREAS.map(function (a) { return a.id; }).indexOf(id);
      if (!S.areaOpen(ch, idx)) { V.sfx('nope'); V.say('locked'); shake(g); return; }
      V.sfx('tap');
      area(id);
    });
    var me = h('button', { cls: 'me-chip', attrs: { type: 'button' }, label: 'Switch player', on: { click: function () { if (S.get().children.length > 1) profiles(); } } }, [
      h('span', { cls: 'me-bot', art: A.robotSvg(robotOpts(ch), '-24 -34 48 40') }), h('span', { cls: 'me-name', text: ch.name })
    ]);
    var studioLocked = S.learnedArrows(ch).length === 0;
    var doors = h('div', { cls: 'doors' }, [
      h('button', { cls: 'door door-studio' + (studioLocked ? ' locked' : ''), attrs: { type: 'button' }, label: 'Studio', on: { click: function () {
        V.sfx('tap');
        if (studioLocked) { V.say('studio_locked'); shake(this); return; }
        root.FIB.Studio.open();
      } } }, [h('span', { cls: 'door-art', art: A.ICONS.studio }), studioLocked ? h('span', { cls: 'door-lock', art: A.ICONS.lock }) : null]),
      h('button', { cls: 'door door-robot', attrs: { type: 'button' }, label: 'My robot', on: { click: function () { V.sfx('tap'); robotRoom(); } } },
        [h('span', { cls: 'door-art', art: A.robotSvg(robotOpts(ch, 'wow')) })])
    ]);
    show(h('div', { cls: 'home' }, [
      topBar([me], [h('span', { cls: 'star-total', art: A.starIcon(true) }), h('span', { cls: 'star-count', text: String(S.totalStars(ch)) })],
        [btn('round small', A.ICONS.gear, 'Grown-ups', function () { root.FIB.Parent.open(); })]),
      map, doors
    ]), 'is-home');
    if (fresh) V.say(allFixed ? 'all_done' : 'home');
  }

  /* ---------- area: pick a puzzle ---------- */
  function area(id) {
    var ch = S.child(), ar = C.areaById(id);
    var grid = h('div', { cls: 'level-grid' });
    ar.levels.forEach(function (l, i) {
      var open = S.levelOpen(ch, ar, i), rec = ch.levels[l.id];
      var stars = h('div', { cls: 'lv-stars' });
      for (var s = 0; s < 3; s++) stars.appendChild(h('span', { art: A.starIcon(rec && rec.stars > s) }));
      var b = h('button', { cls: 'lv' + (open ? '' : ' locked') + (rec && rec.done ? ' done' : '') + (l.type === 'fix' ? ' fix' : ''), attrs: { type: 'button' }, label: 'Puzzle ' + (i + 1),
        on: { click: function () { if (!open) { V.sfx('nope'); shake(b); return; } V.sfx('tap'); puzzle(l.id); } } },
        [open ? h('span', { cls: 'lv-num', text: String(i + 1) }) : h('span', { cls: 'lv-lock', art: A.ICONS.lock }), open ? stars : null]);
      grid.appendChild(b);
    });
    var fixed = !!ch.areasFixed[id];
    show(h('div', { cls: 'area' }, [
      topBar([btn('round', A.ICONS.back, 'Back to the map', function () { home(); })], [], [speakerBtn('area_' + id)]),
      h('div', { cls: 'area-hero', art: '<svg viewBox="-50 -75 100 115">' + A.BUILDINGS[id](fixed) + (fixed ? A.sparkle(-38, -40, 8) + A.sparkle(40, -30, 6) : '') + '</svg>' }),
      grid
    ]), 'is-area area-' + id);
    if (!ch.seen['area_' + id]) { ch.seen['area_' + id] = true; S.save(); V.say('area_' + id); }
  }

  /* ---------- the puzzle ---------- */
  function puzzle(levelId) {
    var token;
    var ch = S.child(), L = C.levelById(levelId), ar = C.areaById(L.area);
    var grid = E.parse(L);
    var best = E.solve(L);
    var isFix = L.type === 'fix';
    var slots = isFix ? L.program.length : L.slots;
    var program = isFix ? L.program.slice() : [];
    var history = [];
    var selected = -1;
    var runs = 0, fails = 0, busy = false, hintNow = null;

    // board
    var vb = '-9 -9 362 362';
    var boardSvg = '<svg viewBox="' + vb + '" class="board-svg" aria-label="Puzzle board">' +
      '<rect x="-9" y="-9" width="362" height="362" rx="26" fill="#7FBF4A" stroke="' + A.O + '" stroke-width="4"/>' +
      A.boardTiles(L) + A.boardDeco(L, { area: L.area, fixed: !!ch.areasFixed[L.area] }) + A.goalMark(L) + A.pickupMarks(L, ar.pickup) +
      '<g id="bot" transform="translate(0,0)"><g class="fib-bot">' + A.robot(robotOpts(ch)) + '</g></g></svg>';
    var board = h('div', { cls: 'board', art: boardSvg });
    var botG = board.querySelector('#bot');
    var botInner = board.querySelector('.fib-bot');
    function cellCenter(x, y) { var p = A.tileXY(x, y); return { x: p.x + A.T / 2, y: p.y + A.T / 2 - 4 }; }
    var pos = cellCenter(grid.start.x, grid.start.y);
    function placeBot(p) { pos = p; botG.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ') scale(.95)'); }
    function setMood(m) { botInner.innerHTML = A.robot(robotOpts(ch, m)); }
    function tween(to, ms) {
      var from = { x: pos.x, y: pos.y }, t0 = performance.now();
      return new Promise(function (res) {
        function f(now) {
          var k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
          placeBot({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
          if (k < 1) requestAnimationFrame(f); else res();
        }
        requestAnimationFrame(f);
      });
    }
    function resetBoard() {
      placeBot(cellCenter(grid.start.x, grid.start.y));
      setMood('happy');
      board.querySelectorAll('.fib-pickup').forEach(function (p) { p.classList.remove('taken'); });
      botInner.classList.remove('jump', 'wobble');
    }

    // code strip
    var strip = h('div', { cls: 'strip' + (slots > 6 ? ' two-rows' : '') });
    function renderStrip() {
      clear(strip);
      for (var i = 0; i < slots; i++) {
        (function (i) {
          var a = program[i];
          var cls = 'slot';
          var art = '';
          if (a) { cls += ' filled'; art = A.arrowBlock(a); }
          if (i === selected) cls += ' selected';
          if (hintNow && hintNow.index === i) cls += ' hint';
          if (!a && hintNow && hintNow.index === i && hintNow.arrow) { cls += ' ghost'; art = A.arrowBlock(hintNow.arrow, { fill: '#FFF3B0' }); }
          var b = h('button', { cls: cls, art: art, attrs: { type: 'button', 'data-i': String(i) }, label: a ? 'Arrow ' + (i + 1) : 'Empty space',
            on: { click: function () { if (busy) return; tapSlot(i); } } });
          strip.appendChild(b);
        })(i);
      }
    }
    function tapSlot(i) {
      if (isFix) {
        V.sfx('tap');
        selected = selected === i ? -1 : i;
        renderStrip();
        return;
      }
      if (i < program.length) {     // build: tap an arrow to take it away
        V.sfx('tap');
        program.splice(i, 1);
        hintNow = null;
        renderStrip();
      }
    }
    // tray
    var tray = h('div', { cls: 'tray' });
    var pad = h('div', { cls: 'pad' });
    ['U', 'L', 'R', 'D'].forEach(function (d) {
      var allowed = L.arrows.indexOf(d) >= 0;
      var b = h('button', { cls: 'pad-btn pad-' + d + (allowed ? '' : ' off'), art: allowed ? A.arrowBlock(d) : '', attrs: { type: 'button', 'data-dir': d }, label: { U: 'Up', D: 'Down', L: 'Left', R: 'Right' }[d] + ' arrow',
        on: { click: function () { if (busy || !allowed) return; tapArrow(d, b); } } });
      if (!allowed) b.setAttribute('aria-hidden', 'true');
      pad.appendChild(b);
    });
    function tapArrow(d, b) {
      V.sfx('tap');
      if (isFix) {
        if (selected < 0) { V.say('pick_block'); shake(strip); return; }
        history.push({ i: selected, prev: program[selected] });
        program[selected] = d;
        selected = -1;
        hintNow = null;
        renderStrip();
        return;
      }
      if (selected >= 0) { program[selected] = d; selected = -1; renderStrip(); return; }
      if (program.length >= slots) { V.say('full'); shake(strip); return; }
      program.push(d);
      hintNow = null;
      renderStrip();
      var last = strip.querySelector('[data-i="' + (program.length - 1) + '"]');
      if (last) last.classList.add('pop');
    }
    var goBtn = btn('go big-go', A.ICONS.go, 'Go', function () { if (!busy) go(); });
    var undoBtn = btn('round', A.ICONS.undo, 'Undo', function () {
      if (busy) return;
      if (isFix) { var hst = history.pop(); if (hst) program[hst.i] = hst.prev; }
      else program.pop();
      selected = -1; hintNow = null;
      renderStrip();
    });
    tray.appendChild(pad);
    tray.appendChild(h('div', { cls: 'tray-side' }, [goBtn, undoBtn]));

    function setBusy(b) { busy = b; app.classList.toggle('is-running', b); }

    function go() {
      if (!program.length) { V.say('need_arrows'); shake(strip); return; }
      V.stop();
      setBusy(true);
      selected = -1; hintNow = null;
      renderStrip();
      runs++;
      var my = screenToken;
      var res = E.run(L, program, grid);
      resetBoard();
      var chain = wait(250);
      res.steps.forEach(function (stp, k) {
        chain = chain.then(function () {
          if (my !== screenToken) throw 'gone';
          strip.querySelectorAll('.slot').forEach(function (s) { s.classList.remove('running'); });
          var sl = strip.querySelector('[data-i="' + stp.i + '"]');
          if (sl) sl.classList.add('running');
          if (stp.bump) {
            var half = cellCenter(stp.x + (stp.toward.x - stp.x) * 0.35, stp.y + (stp.toward.y - stp.y) * 0.35);
            var home0 = cellCenter(stp.x, stp.y);
            V.sfx('bump');
            if (sl) sl.classList.add('bad');
            return tween(half, 150).then(function () { setMood('oops'); botInner.classList.add('wobble'); return tween(home0, 200); });
          }
          V.sfx('step');
          return tween(cellCenter(stp.x, stp.y), 330).then(function () {
            if (stp.got >= 0) {
              V.sfx('pickup');
              var pk = board.querySelector('.fib-pickup[data-item="' + stp.got + '"]');
              if (pk) pk.classList.add('taken');
            }
            return wait(90);
          });
        });
      });
      chain.then(function () {
        if (my !== screenToken) return;
        strip.querySelectorAll('.slot').forEach(function (s) { s.classList.remove('running'); });
        if (res.result === 'win') return won(my);
        fails++;
        if (res.result !== 'bump') { setMood('oops'); botInner.classList.add('wobble'); }
        V.say(res.result);
        return wait(1300).then(function () {
          if (my !== screenToken) return;
          resetBoard();
          setBusy(false);
          if (fails >= 3) {
            var hnt = E.hint(L, program);
            if (hnt) {
              hintNow = hnt;
              if (hnt.index < program.length && !isFix && hnt.remove) V.say('hint_remove');
              else V.say(hnt.index >= program.length ? 'hint_add' : 'hint');
              if (isFix && hnt.index < program.length) selected = hnt.index;
              renderStrip();
              if (hnt.arrow) { var pb = pad.querySelector('[data-dir="' + hnt.arrow + '"]'); if (pb) { pb.classList.add('hint'); setTimeout(function () { pb.classList.remove('hint'); }, 2600); } }
            }
          } else if (fails === 1) {
            setTimeout(function () { if (my === screenToken && !busy) V.say('try_again'); }, 1600);
          }
        });
      }).catch(function () {});
    }

    function won(my) {
      setMood('wow');
      botInner.classList.add('jump');
      V.sfx('win');
      var stars = E.stars(L, runs, program.length, best.dist);
      var out = S.recordWin(L.id, stars);
      return wait(900).then(function () {
        if (my !== screenToken) return;
        setBusy(false);
        result(L, stars, out);
      });
    }

    var stars = h('div', { cls: 'pz-stars' });
    var rec = ch.levels[L.id];
    for (var s = 0; s < 3; s++) stars.appendChild(h('span', { art: A.starIcon(rec && rec.stars > s) }));
    var idx = ar.levels.indexOf(L);
    var screen = h('div', { cls: 'puzzle' + (isFix ? ' is-fix' : '') }, [
      topBar([btn('round', A.ICONS.back, 'Back', function () { area(L.area); })],
        [h('div', { cls: 'pz-badge' }, [h('span', { cls: 'pz-area', art: '<svg viewBox="-45 -70 90 110">' + A.BUILDINGS[L.area](!!ch.areasFixed[L.area]) + '</svg>' }), h('span', { cls: 'pz-num', text: String(idx + 1) }), stars])],
        [speakerBtn(L.intro)]),
      board, strip, tray
    ]);
    show(screen, 'is-puzzle');
    token = screenToken;
    resetBoard();
    renderStrip();
    setTimeout(function () { if (token === screenToken) V.say(L.intro); }, 350);
  }

  /* ---------- after a win ---------- */
  function result(L, stars, out) {
    var ch = S.child(), ar = C.areaById(L.area), idx = ar.levels.indexOf(L);
    var overlay = h('div', { cls: 'overlay' });
    var card = h('div', { cls: 'result-card' });
    var row = h('div', { cls: 'result-stars' });
    for (var i = 0; i < 3; i++) row.appendChild(h('span', { cls: 'rs' + (i < stars ? ' on' : ''), art: A.starIcon(i < stars) }));
    card.appendChild(h('div', { cls: 'result-bot', art: A.robotSvg(robotOpts(ch, 'wow')) }));
    card.appendChild(row);
    if (out.reward) {
      card.appendChild(h('div', { cls: 'reward' }, [h('div', { cls: 'reward-new', text: 'New!' }), h('div', { cls: 'reward-thumb', art: A.itemThumb(out.reward) })]));
    } else if (stars < 2 && !(ch.levels[L.id] && ch.levels[L.id].rewarded)) {
      card.appendChild(h('div', { cls: 'reward reward-locked' }, [h('div', { cls: 'reward-thumb', art: A.ICONS.lock })]));
    }
    var nextL = ar.levels[idx + 1];
    var actions = h('div', { cls: 'result-actions' }, [
      btn('round', A.ICONS.replay, 'Play again', function () { puzzle(L.id); }),
      btn('round', A.ICONS.home, 'Back to the puzzles', function () { area(L.area); }),
      btn('go', A.ICONS.next, 'Next', function () {
        if (out.areaFixed) areaFixed(out.areaFixed, out.part);
        else if (nextL) puzzle(nextL.id);
        else area(L.area);
      })
    ]);
    card.appendChild(actions);
    overlay.appendChild(card);
    app.appendChild(overlay);
    row.querySelectorAll('.rs.on').forEach(function (el, i) { setTimeout(function () { el.classList.add('pop'); V.sfx('star'); }, 250 + i * 280); });
    var line = out.reward ? 'reward_new' : (stars === 3 ? 'win3' : (stars < 2 && !(ch.levels[L.id] && ch.levels[L.id].rewarded) ? 'fewer_tries' : 'win'));
    setTimeout(function () { if (out.reward) V.sfx('reward'); V.say(line); }, 300 + stars * 280);
  }

  /* ---------- an area gets fixed ---------- */
  function areaFixed(areaId, part) {
    var ch = S.child();
    var scene = h('div', { cls: 'fixed-scene', art: '<svg viewBox="-60 -80 120 125"><g class="fx-broken">' + A.BUILDINGS[areaId](false) + '</g><g class="fx-fixed">' + A.BUILDINGS[areaId](true) + A.sparkle(-44, -46, 9) + A.sparkle(46, -34, 7) + A.sparkle(36, 30, 8) + '</g></svg>' });
    var partCard = h('div', { cls: 'part-card' }, [h('div', { cls: 'reward-new', text: 'New part!' }), h('div', { cls: 'part-bot', art: A.robotSvg(Object.assign(robotOpts(ch, 'wow'), part === 'arms_mitts' ? { arms: part } : { top: part })) })]);
    var done = btn('go', A.ICONS.next, 'Next', function () { home(true); });
    show(h('div', { cls: 'center-col fixed' }, [scene, partCard, done]), 'is-fixed');
    var my = screenToken;
    setTimeout(function () { if (my === screenToken) { scene.classList.add('go'); V.sfx('win'); V.say('area_fixed_' + areaId); } }, 500);
    setTimeout(function () { if (my === screenToken) { partCard.classList.add('in'); V.sfx('reward'); } }, 2600);
    setTimeout(function () { if (my === screenToken) V.say('part_new'); }, 3600);
  }

  /* ---------- My Robot ---------- */
  function robotRoom() {
    var ch = S.child();
    var tab = 'paint';
    var preview = h('div', { cls: 'room-bot' });
    var nameTag = h('div', { cls: 'room-name', text: ch.robotName });
    var tabs = h('div', { cls: 'tabs' });
    var grid = h('div', { cls: 'pick-grid' });
    function options() {
      var own = Object.keys(ch.owned).filter(function (k) { return ch.owned[k]; });
      if (tab === 'paint') return { list: Object.keys(C.ITEMS).filter(function (k) { return C.ITEMS[k].kind === 'paint'; }), own: own };
      if (tab === 'top') return { list: ['top_ball'].concat(Object.keys(C.ITEMS).filter(function (k) { var it = C.ITEMS[k]; return it.kind === 'hat' || it.slot === 'top'; })), own: own.concat(['top_ball']) };
      return { list: ['arms_plain', 'arms_mitts'], own: own.concat(['arms_plain']) };
    }
    function render() {
      preview.innerHTML = A.robotSvg(robotOpts(ch, 'wow'));
      clear(tabs);
      [['paint', A.robotSvg({ paint: C.ITEMS.paint_rainbow }, '-24 -34 48 70'), 'Colours'], ['top', A.robotSvg({ top: 'hat_crown' }, '-24 -62 48 40'), 'Hats'], ['arms', A.robotSvg({ arms: 'arms_mitts' }, '-34 -8 68 40'), 'Arms']].forEach(function (t) {
        tabs.appendChild(h('button', { cls: 'tab' + (tab === t[0] ? ' on' : ''), art: t[1], label: t[2], attrs: { type: 'button' }, on: { click: function () { V.sfx('tap'); tab = t[0]; render(); } } }));
      });
      clear(grid);
      var o = options();
      o.list.forEach(function (id) {
        var have = o.own.indexOf(id) >= 0;
        var cur = (tab === 'paint' && ch.robot.paint === id) || (tab === 'top' && ch.robot.top === id) || (tab === 'arms' && ch.robot.arms === id);
        var art = !have ? '<span class="mystery">?</span>' :
          tab === 'paint' ? A.robotSvg({ paint: C.ITEMS[id] }, '-24 -34 48 70') :
          tab === 'top' ? A.robotSvg({ top: id }, '-28 -62 56 50') : A.robotSvg({ arms: id }, '-34 -10 68 44');
        grid.appendChild(h('button', { cls: 'pick' + (have ? '' : ' locked') + (cur ? ' on' : ''), art: art, attrs: { type: 'button' }, label: have ? id.replace(/_/g, ' ') : 'Not earned yet',
          on: { click: function () {
            if (!have) { V.sfx('nope'); return; }
            V.sfx('pickup');
            if (tab === 'paint') ch.robot.paint = id; else if (tab === 'top') ch.robot.top = id; else ch.robot.arms = id;
            S.save(); render();
          } } }));
      });
    }
    render();
    show(h('div', { cls: 'room' }, [
      topBar([btn('round', A.ICONS.back, 'Back to the map', function () { home(); })], [nameTag], [speakerBtn('robot_room')]),
      preview, tabs, grid
    ]), 'is-room');
    if (!ch.seen.robot_room) { ch.seen.robot_room = true; S.save(); V.say('robot_room'); }
  }

  /* ---------- start ---------- */
  function start() {
    S.load();
    applyTheme(); applyVoice();
    V.loadAll();
    var st = S.get();
    if (!st.children.length) setup();
    else if (st.children.length > 1) profiles();
    else home();
  }

  root.FIB = root.FIB || {};
  root.FIB.App = {
    h: h, btn: btn, clear: clear, shake: shake, wait: wait, show: show, topBar: topBar, speakerBtn: speakerBtn,
    robotOpts: robotOpts, applyTheme: applyTheme, applyVoice: applyVoice,
    home: home, area: area, puzzle: puzzle, setup: setup, profiles: profiles, robotRoom: robotRoom, start: start,
    token: function () { return screenToken; }
  };
})(window);
