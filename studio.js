/* Fix-It Bot — the Studio: free making with the arrows she has learned and the things she has earned.
   Nothing here is graded. Creations save on this device automatically. */
(function (root) {
  'use strict';
  var C = root.FIB.Content, A = root.FIB.Art, S = root.FIB.Store, V = root.FIB.Voice, App = root.FIB.App;
  var h = App.h, btn = App.btn, clear = App.clear;
  var CELL = 344 / 5;

  function owned(ch, kind) { return Object.keys(ch.owned).filter(function (k) { return ch.owned[k] && C.ITEMS[k] && C.ITEMS[k].kind === kind; }); }
  function cellCenter(x, y) { return { x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 }; }

  function stageSvg(cr, ch, withGrid) {
    var s = '<svg viewBox="0 0 344 344" class="stage-svg">' + (A.BGS[cr.bg] || A.BGS.bg_meadow)();
    if (withGrid) {
      for (var i = 1; i < 5; i++) s += '<line x1="' + i * CELL + '" y1="6" x2="' + i * CELL + '" y2="338" stroke="rgba(43,35,64,.12)" stroke-width="2" stroke-dasharray="4 6"/><line y1="' + i * CELL + '" x1="6" y2="' + i * CELL + '" x2="338" stroke="rgba(43,35,64,.12)" stroke-width="2" stroke-dasharray="4 6"/>';
    }
    cr.props.forEach(function (p, i) {
      var c = cellCenter(p.x, p.y);
      s += '<g transform="translate(' + c.x + ',' + (c.y + 4) + ') scale(1.15)"><g class="sp" data-p="' + i + '">' + (A.PROPS[p.id] ? A.PROPS[p.id]() : '') + '</g></g>';
    });
    var rc = cellCenter(cr.start.x, cr.start.y);
    s += '<g id="sbot" transform="translate(' + rc.x + ',' + (rc.y - 2) + ') scale(.85)"><g class="fib-bot">' + A.robot(App.robotOpts(ch)) + '</g></g>';
    s += '<rect width="344" height="344" rx="20" fill="none" stroke="' + A.O + '" stroke-width="4"/></svg>';
    return s;
  }

  /* ---------- gallery ---------- */
  function open() {
    var ch = S.child();
    var list = ch.studio.creations;
    if (!list.length) { edit(newCreation(ch)); V.say('studio'); return; }
    var grid = h('div', { cls: 'gallery' });
    grid.appendChild(h('button', { cls: 'gal-new', attrs: { type: 'button' }, label: 'Make something new', art: '<svg viewBox="0 0 48 48"><path d="M24,10 V38 M10,24 H38" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>',
      on: { click: function () {
        V.sfx('tap');
        if (list.length >= S.MAX_CREATIONS) { V.sfx('nope'); App.shake(this); return; }
        edit(newCreation(ch));
      } } }));
    list.slice().sort(function (a, b) { return b.updated - a.updated; }).forEach(function (cr) {
      grid.appendChild(h('button', { cls: 'gal-item', art: stageSvg(cr, ch, false), attrs: { type: 'button' }, label: 'Open', on: { click: function () { V.sfx('tap'); edit(cr); } } }));
    });
    App.show(h('div', { cls: 'studio-home' }, [
      App.topBar([btn('round', A.ICONS.back, 'Back to the map', function () { App.home(); })], [h('span', { cls: 'tb-icon', art: A.ICONS.studio })], [App.speakerBtn('studio')]),
      grid
    ]), 'is-studio');
  }

  function newCreation(ch) {
    var cr = { id: S.uid(), bg: 'bg_meadow', props: [], program: [], start: { x: 2, y: 2 }, updated: Date.now() };
    ch.studio.creations.push(cr);
    S.save();
    return cr;
  }

  /* ---------- editor ---------- */
  function edit(cr) {
    var ch = S.child();
    var tab = 'things', tool = null, busy = false, trashArmed = false;
    var arrows = ch.studio.allBlocks ? ['U', 'L', 'R', 'D'] : S.learnedArrows(ch);
    var stage = h('div', { cls: 'stage' });
    var panel = h('div', { cls: 'studio-panel' });
    var tabs = h('div', { cls: 'tabs' });

    function touch() { cr.updated = Date.now(); S.save(); }
    function drawStage() { stage.innerHTML = stageSvg(cr, ch, !busy); }

    stage.addEventListener('click', function (e) {
      if (busy || tab !== 'things' || !tool) return;
      var svg = stage.querySelector('svg');
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var m = svg.getScreenCTM(); if (!m) return;
      var p = pt.matrixTransform(m.inverse());
      var x = Math.floor(p.x / CELL), y = Math.floor(p.y / CELL);
      if (x < 0 || y < 0 || x > 4 || y > 4) return;
      var at = -1;
      cr.props.forEach(function (pp, i) { if (pp.x === x && pp.y === y) at = i; });
      if (tool === 'robot') { cr.start = { x: x, y: y }; V.sfx('step'); }
      else if (tool === 'erase') { if (at >= 0) { cr.props.splice(at, 1); V.sfx('pop'); } else return; }
      else {
        if (at >= 0) cr.props[at] = { id: tool, x: x, y: y };
        else if (cr.props.length >= S.MAX_PROPS) { V.sfx('nope'); App.shake(stage); return; }
        else cr.props.push({ id: tool, x: x, y: y });
        V.sfx(C.ITEMS[tool].sound || 'tap');
      }
      touch(); drawStage();
    });

    function renderTabs() {
      clear(tabs);
      [['things', A.propSvg('prop_ball'), 'Things'], ['bg', '<svg viewBox="0 0 344 344">' + A.BGS.bg_park() + '</svg>', 'Backgrounds'], ['code', A.arrowBlock('R'), 'Code']].forEach(function (t) {
        tabs.appendChild(h('button', { cls: 'tab' + (tab === t[0] ? ' on' : ''), art: t[1], label: t[2], attrs: { type: 'button' }, on: { click: function () { if (busy) return; V.sfx('tap'); tab = t[0]; render(); } } }));
      });
    }
    function render() {
      renderTabs();
      clear(panel);
      if (tab === 'things') renderThings();
      else if (tab === 'bg') renderBgs();
      else renderCode();
    }
    function renderThings() {
      var grid = h('div', { cls: 'pick-grid small' });
      function toolBtn(id, art, label) {
        grid.appendChild(h('button', { cls: 'pick' + (tool === id ? ' on' : ''), art: art, label: label, attrs: { type: 'button' },
          on: { click: function () { V.sfx('tap'); tool = tool === id ? null : id; renderThings2(); if (!ch.seen.studio_things) { ch.seen.studio_things = true; S.save(); V.say('studio_things'); } } } }));
      }
      function renderThings2() { render(); }
      toolBtn('robot', A.robotSvg(App.robotOpts(ch), '-30 -50 60 90'), 'Move my robot');
      owned(ch, 'prop').forEach(function (id) { toolBtn(id, A.propSvg(id), id.replace('prop_', '')); });
      toolBtn('erase', A.ICONS.eraser, 'Take things away');
      panel.appendChild(grid);
    }
    function renderBgs() {
      var grid = h('div', { cls: 'pick-grid small' });
      owned(ch, 'bg').forEach(function (id) {
        grid.appendChild(h('button', { cls: 'pick bg' + (cr.bg === id ? ' on' : ''), art: '<svg viewBox="0 0 344 344">' + A.BGS[id]() + '</svg>', label: id.replace('bg_', ''), attrs: { type: 'button' },
          on: { click: function () { V.sfx('tap'); cr.bg = id; touch(); drawStage(); render(); } } }));
      });
      panel.appendChild(grid);
    }
    function renderCode() {
      var strip = h('div', { cls: 'strip two-rows studio-strip' });
      for (var i = 0; i < S.MAX_STUDIO_BLOCKS; i++) {
        (function (i) {
          var a = cr.program[i];
          strip.appendChild(h('button', { cls: 'slot' + (a ? ' filled' : ''), art: a ? A.arrowBlock(a) : '', attrs: { type: 'button', 'data-i': String(i) }, label: a ? 'Arrow' : 'Empty',
            on: { click: function () { if (busy || !a) return; V.sfx('tap'); cr.program.splice(i, 1); touch(); renderCode2(); } } }));
        })(i);
      }
      function renderCode2() { render(); }
      var pad = h('div', { cls: 'pad' });
      ['U', 'L', 'R', 'D'].forEach(function (d) {
        var ok = arrows.indexOf(d) >= 0;
        pad.appendChild(h('button', { cls: 'pad-btn pad-' + d + (ok ? '' : ' off'), art: ok ? A.arrowBlock(d) : '', attrs: { type: 'button' }, label: d,
          on: { click: function () {
            if (busy || !ok) return;
            V.sfx('tap');
            if (cr.program.length >= S.MAX_STUDIO_BLOCKS) { App.shake(strip); return; }
            cr.program.push(d); touch(); render();
          } } }));
      });
      var side = h('div', { cls: 'tray-side' }, [
        btn('go big-go', A.ICONS.go, 'Play', function () { if (!busy) play(strip); }),
        btn('round', A.ICONS.undo, 'Undo', function () { if (busy) return; cr.program.pop(); touch(); render(); })
      ]);
      panel.appendChild(strip);
      panel.appendChild(h('div', { cls: 'tray' }, [pad, side]));
    }

    function play(strip) {
      if (!cr.program.length) { V.say('need_arrows'); App.shake(strip); return; }
      busy = true; app().classList.add('is-running');
      drawStage();
      var my = App.token();
      var bot = stage.querySelector('#sbot'), inner = stage.querySelector('#sbot .fib-bot');
      var x = cr.start.x, y = cr.start.y;
      var cur = cellCenter(x, y); cur.y -= 2;
      function place(p) { bot.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ') scale(.85)'); }
      function tween(to, ms) {
        var from = { x: cur.x, y: cur.y }, t0 = performance.now();
        return new Promise(function (res) {
          function f(now) {
            var k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
            place({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
            if (k < 1) requestAnimationFrame(f); else { cur = to; res(); }
          }
          requestAnimationFrame(f);
        });
      }
      var chain = App.wait(200), stopped = false;
      cr.program.forEach(function (a, i) {
        chain = chain.then(function () {
          if (stopped || my !== App.token()) { stopped = true; return; }
          var sl = strip.querySelector('[data-i="' + i + '"]');
          strip.querySelectorAll('.slot').forEach(function (s) { s.classList.remove('running'); });
          if (sl) sl.classList.add('running');
          var d = root.FIB.Engine.DIRS[a], nx = x + d.dx, ny = y + d.dy;
          if (nx < 0 || ny < 0 || nx > 4 || ny > 4) {
            V.sfx('bump'); inner.classList.add('wobble'); stopped = true;
            return App.wait(500);
          }
          x = nx; y = ny;
          V.sfx('step');
          var to = cellCenter(x, y); to.y -= 2;
          return tween(to, 320).then(function () {
            cr.props.forEach(function (p, k) {
              if (p.x === x && p.y === y) {
                var el = stage.querySelector('.sp[data-p="' + k + '"]');
                if (el) { el.classList.remove('boing'); void el.getBBox(); el.classList.add('boing'); }
                V.sfx(C.ITEMS[p.id].sound);
              }
            });
            return App.wait(100);
          });
        });
      });
      chain.then(function () {
        if (my !== App.token()) return;
        strip.querySelectorAll('.slot').forEach(function (s) { s.classList.remove('running'); });
        if (!stopped) { inner.innerHTML = A.robot(App.robotOpts(ch, 'wow')); inner.classList.add('jump'); V.sfx('sparkle'); }
        return App.wait(900);
      }).then(function () {
        if (my !== App.token()) return;
        busy = false; app().classList.remove('is-running');
        drawStage();
      });
    }
    function app() { return document.getElementById('app'); }

    var trash = btn('round', A.ICONS.trash, 'Delete this', function () {
      if (busy) return;
      if (!trashArmed) { trashArmed = true; trash.classList.add('armed'); setTimeout(function () { trashArmed = false; trash.classList.remove('armed'); }, 2500); return; }
      var i = ch.studio.creations.indexOf(cr);
      if (i >= 0) ch.studio.creations.splice(i, 1);
      S.save(); open();
    });
    App.show(h('div', { cls: 'studio' }, [
      App.topBar([btn('round', A.ICONS.back, 'Back', function () { if (!busy) open(); })], [h('span', { cls: 'tb-icon', art: A.ICONS.studio })], [trash]),
      stage, tabs, panel
    ]), 'is-studio-edit');
    drawStage(); render();
  }

  root.FIB = root.FIB || {};
  root.FIB.Studio = { open: open, edit: edit, stageSvg: stageSvg };
})(window);
