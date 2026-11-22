/* Fix-It Bot — all drawings, as SVG markup built from fixed shapes (never from user text).
   Style: chunky toy shapes, thick dark outlines, bright flat colours. */
(function (root) {
  'use strict';
  var O = '#2B2340';            // outline
  var SW = 3.5;                 // standard stroke width at tile scale

  function a(attrs) {
    var s = '';
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) s += ' ' + k + '="' + attrs[k] + '"';
    return s;
  }
  function st(extra) { return Object.assign({ stroke: O, 'stroke-width': SW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, extra || {}); }
  function rect(x, y, w, h, rx, fill, extra) { return '<rect' + a(Object.assign(st(extra), { x: x, y: y, width: w, height: h, rx: rx, fill: fill })) + '/>'; }
  function circ(cx, cy, r, fill, extra) { return '<circle' + a(Object.assign(st(extra), { cx: cx, cy: cy, r: r, fill: fill })) + '/>'; }
  function ell(cx, cy, rx, ry, fill, extra) { return '<ellipse' + a(Object.assign(st(extra), { cx: cx, cy: cy, rx: rx, ry: ry, fill: fill })) + '/>'; }
  function path(d, fill, extra) { return '<path' + a(Object.assign(st(extra), { d: d, fill: fill || 'none' })) + '/>'; }
  function g(inner, tf, cls) { return '<g' + a({ transform: tf, 'class': cls }) + '>' + inner + '</g>'; }
  function star(cx, cy, r, fill, sw) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rr = i % 2 ? r * 0.45 : r;
      pts.push((cx + Math.cos(ang) * rr).toFixed(1) + ',' + (cy + Math.sin(ang) * rr).toFixed(1));
    }
    return '<polygon' + a(st({ 'stroke-width': sw || 2.5 })) + a({ points: pts.join(' '), fill: fill }) + '/>';
  }

  /* ---------- arrows ---------- */
  var ROT = { R: 0, D: 90, L: 180, U: -90 };
  function arrowGlyph(dir, scale) {
    return g(path('M-14,-6 H2 V-16 L18,0 L2,16 V6 H-14 Z', '#fff', { 'stroke-width': 4 }),
      'rotate(' + ROT[dir] + ') scale(' + (scale || 1) + ')');
  }
  // A full arrow block as a standalone svg (used in buttons).
  function arrowBlock(dir, opts) {
    opts = opts || {};
    var fill = opts.fill || '#FFC93C';
    return '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      rect(3, 3, 58, 58, 15, fill, { 'stroke-width': 4 }) +
      '<rect x="9" y="8" width="46" height="9" rx="4.5" fill="rgba(255,255,255,.45)"/>' +
      g(arrowGlyph(dir, 1), 'translate(32,33)') + '</svg>';
  }

  /* ---------- robot ---------- */
  function paintFill(paint) {
    if (paint && paint.color === 'rainbow') return { body: 'url(#fib-rainbow)', head: 'url(#fib-rainbow)' };
    return { body: (paint && paint.color) || '#3BB8B0', head: (paint && paint.light) || '#5CCFC6' };
  }

  // Head-top pieces: antennas, parts and hats share one slot.
  var TOPS = {
    top_ball: function () {
      return '<line x1="0" y1="-30" x2="0" y2="-40" stroke="' + O + '" stroke-width="3.5" stroke-linecap="round"/>' + circ(0, -43, 5, '#FF8A3D');
    },
    top_siren: function () {
      return rect(-6, -34, 12, 6, 2, '#C9C3D6') + path('M-9,-34 a9,10 0 0 1 18,0 Z', '#FF4D4D') +
        '<path d="M-4,-38 q2,-4 5,-4" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '<path d="M-14,-44 l-5,-4 M14,-44 l5,-4 M0,-48 v-5" stroke="#FFC93C" stroke-width="3" stroke-linecap="round"/>';
    },
    top_propeller: function () {
      return '<line x1="0" y1="-30" x2="0" y2="-40" stroke="' + O + '" stroke-width="3.5" stroke-linecap="round"/>' +
        g(g(ell(-11, 0, 11, 4, '#FF6B5B', { 'stroke-width': 3 }) + ell(11, 0, 11, 4, '#4D9DE0', { 'stroke-width': 3 }) + circ(0, 0, 3.5, '#FFC93C', { 'stroke-width': 2.5 }), null, 'fib-prop-spin'), 'translate(0,-41)');
    },
    hat_chef: function () {
      return rect(-12, -38, 24, 10, 3, '#fff') + path('M-13,-38 a8,8 0 0 1 6,-12 a9,9 0 0 1 14,0 a8,8 0 0 1 6,12 Z', '#fff');
    },
    hat_bow: function () {
      return path('M0,-33 L-15,-42 L-15,-26 Z', '#F27BA8') + path('M0,-33 L15,-42 L15,-26 Z', '#F27BA8') + circ(0, -33, 4.5, '#FF9EC3', { 'stroke-width': 3 });
    },
    hat_helmet: function () {
      return path('M-22,-28 a22,16 0 0 1 44,0 Z', '#E5534B') + rect(-24, -30, 48, 5, 2.5, '#C9433C', { 'stroke-width': 3 }) +
        rect(-5, -46, 10, 9, 3, '#FFC93C', { 'stroke-width': 3 });
    },
    hat_cap: function () {
      return path('M-17,-28 a17,13 0 0 1 34,0 Z', '#4D9DE0') + path('M10,-30 h16 a3,3 0 0 1 0,5 h-16 Z', '#4D9DE0', { 'stroke-width': 3 }) +
        circ(0, -41, 3, '#fff', { 'stroke-width': 2.5 });
    },
    hat_crown: function () {
      return path('M-16,-29 L-17,-46 L-8,-38 L0,-49 L8,-38 L17,-46 L16,-29 Z', '#FFC93C') + circ(0, -36, 3, '#F27BA8', { 'stroke-width': 2.5 });
    },
    hat_party: function () {
      return path('M-12,-29 L0,-56 L12,-29 Z', '#9C6ADE') +
        '<path d="M-7,-40 l9,-4 M-4,-33 l11,-5" stroke="#FFC93C" stroke-width="3" stroke-linecap="round"/>' + circ(0, -57, 4, '#FF6B5B', { 'stroke-width': 2.5 });
    }
  };

  function robot(opts) {
    opts = opts || {};
    var p = paintFill(opts.paint);
    var mood = opts.mood || 'happy';
    var top = TOPS[opts.top] ? opts.top : 'top_ball';
    var mitts = opts.arms === 'arms_mitts';
    var s = '';
    // shadow
    s += '<ellipse cx="0" cy="34" rx="22" ry="5" fill="rgba(43,35,64,.18)"/>';
    var hatFirst = top.indexOf('hat_') !== 0; // antennas sit behind the head, hats in front
    if (hatFirst) s += TOPS[top]();
    // wheels
    s += circ(-12, 26, 7, '#4A4560') + circ(12, 26, 7, '#4A4560');
    s += circ(-12, 26, 2, '#9A94B0', { stroke: 'none' }) + circ(12, 26, 2, '#9A94B0', { stroke: 'none' });
    // body
    s += rect(-16, 4, 32, 22, 7, p.body) + circ(0, 15, 5, '#FFC93C');
    // arms
    var armL = mood === 'wow' ? 'M-16,10 q-10,-4 -12,-14' : 'M-16,10 q-9,2 -9,10';
    var armR = mood === 'wow' ? 'M16,10 q10,-4 12,-14' : 'M16,10 q9,-2 10,-9';
    s += path(armL) + path(armR);
    if (mitts) {
      var lh = mood === 'wow' ? [-28, -5] : [-25, 21];
      var rh = mood === 'wow' ? [28, -5] : [26, 0];
      s += ell(lh[0], lh[1], 6, 5, '#FF6B5B', { 'stroke-width': 3 }) + ell(rh[0], rh[1], 6, 5, '#FF6B5B', { 'stroke-width': 3 });
    }
    // head
    s += rect(-20, -30, 40, 32, 11, p.head) + '<rect x="-14" y="-24" width="28" height="20" rx="7" fill="' + O + '"/>';
    var face = '#9FFFF4';
    if (mood === 'oops') {
      s += '<path d="M-9,-18 l5,5 M-4,-18 l-5,5 M4,-18 l5,5 M9,-18 l-5,5" stroke="' + face + '" stroke-width="2.4" stroke-linecap="round"/>';
      s += '<path d="M-5,-7 q5,-3 10,0" fill="none" stroke="' + face + '" stroke-width="2.2" stroke-linecap="round"/>';
    } else if (mood === 'wow') {
      s += '<path d="M-10,-14 q4,-6 8,0 M2,-14 q4,-6 8,0" fill="none" stroke="' + face + '" stroke-width="2.4" stroke-linecap="round"/>';
      s += '<path d="M-6,-10 q6,7 12,0 Z" fill="' + face + '"/>';
    } else {
      s += '<ellipse cx="-6" cy="-15" rx="3" ry="4" fill="' + face + '"/><ellipse cx="6" cy="-15" rx="3" ry="4" fill="' + face + '"/>';
      s += '<path d="M-5,-9 q5,4 10,0" fill="none" stroke="' + face + '" stroke-width="2.2" stroke-linecap="round"/>';
    }
    s += '<circle cx="-16" cy="-8" r="3" fill="#FF8FB1" opacity=".8"/><circle cx="16" cy="-8" r="3" fill="#FF8FB1" opacity=".8"/>';
    if (!hatFirst) s += TOPS[top]();
    return s;
  }
  function robotSvg(opts, vb) {
    return '<svg viewBox="' + (vb || '-40 -62 80 104') + '" aria-hidden="true">' + robot(opts) + '</svg>';
  }

  /* ---------- scenery ---------- */
  function tree() {
    return rect(-5, 4, 10, 18, 3, '#B7794A') + circ(0, -6, 19, '#4FB35A') + '<circle cx="-7" cy="-12" r="5" fill="#7DD27F"/>';
  }
  function bush() {
    return path('M-20,10 a10,10 0 0 1 4,-16 a11,11 0 0 1 20,-4 a10,10 0 0 1 16,10 a8,8 0 0 1 0,10 Z', '#4FB35A') +
      circ(-4, -6, 3, '#FF6B5B', { 'stroke-width': 2 }) + circ(8, 0, 3, '#FF6B5B', { 'stroke-width': 2 });
  }
  function pond() {
    return ell(0, 2, 26, 20, '#6EC6F0') + '<path d="M-12,-2 q6,-4 12,0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
  }
  function flowers(color) {
    var s = '';
    for (var i = 0; i < 5; i++) {
      var ang = i * 72 * Math.PI / 180;
      s += circ((Math.cos(ang) * 7).toFixed(1), (Math.sin(ang) * 7).toFixed(1), 5.5, color || '#FFC93C', { 'stroke-width': 2.5 });
    }
    return s + circ(0, 0, 4.5, '#fff', { 'stroke-width': 2.5 });
  }

  /* ---------- the three area buildings (drawn on one tile, rising above it) ---------- */
  var GREY = { wall: '#E4E0EA', roof: '#A9A3B6', accent: '#C4BFCF', door: '#8E879C', fill2: '#D2CDDA' };
  function bakery(fixed) {
    var wall = fixed ? '#FFE6C7' : GREY.wall, roof = fixed ? '#FF6B5B' : GREY.roof;
    var s = '';
    if (fixed) s += '<path d="M14,-46 q-4,-6 2,-10 q6,-4 2,-10" fill="none" stroke="#C9C3D6" stroke-width="4" stroke-linecap="round"/>';
    s += rect(8, -44, 10, 16, 2, fixed ? '#C9563F' : GREY.accent, { 'stroke-width': 3 });
    s += rect(-28, -6, 56, 38, 6, wall);
    s += path('M-34,-2 L-24,-28 H24 L34,-2 Z', roof);
    for (var i = 0; i < 4; i++) {
      var c = i % 2 ? '#fff' : (fixed ? '#FF6B5B' : GREY.accent);
      s += path('M' + (-26 + i * 13) + ',10 h13 v8 a6.5,6.5 0 0 1 -13,0 Z', c, { 'stroke-width': 2.5 });
    }
    s += '<rect x="-26" y="6" width="52" height="5" fill="' + O + '"/>';
    s += path('M-8,32 v-10 a8,8 0 0 1 16,0 v10 Z', fixed ? '#8A5A3B' : GREY.door, { 'stroke-width': 3 });
    // sign: straight and bright when fixed, crooked and grey when broken
    var sign = circ(0, -12, 9, '#fff', { 'stroke-width': 2.5 }) + path('M-6,-9 C-7,-19 7,-19 6,-9 Z', fixed ? '#E9A54B' : GREY.accent, { 'stroke-width': 2 });
    s += g(sign, fixed ? '' : 'rotate(24 0 -12)');
    return s;
  }
  function firehouse(fixed) {
    var wall = fixed ? '#E5534B' : GREY.roof, trim = fixed ? '#FFE6C7' : GREY.wall;
    var s = '';
    s += rect(-30, -24, 60, 56, 6, wall);
    s += rect(-34, -30, 68, 10, 4, trim);
    s += rect(-22, 2, 44, 30, 4, trim);
    for (var i = 0; i < 3; i++) s += '<line x1="-22" x2="22" y1="' + (10 + i * 8) + '" y2="' + (10 + i * 8) + '" stroke="' + O + '" stroke-width="2.5"/>';
    // bell
    s += g(path('M-7,4 a7,8 0 0 1 14,0 l2,3 h-18 Z', fixed ? '#FFC93C' : GREY.accent, { 'stroke-width': 2.5 }) + circ(0, 9, 2.5, O, { stroke: 'none' }), fixed ? 'translate(0,-16)' : 'translate(0,-14) rotate(30)');
    if (fixed) s += '<path d="M-14,-22 l-6,-4 M14,-22 l6,-4" stroke="#FFC93C" stroke-width="3" stroke-linecap="round"/>';
    return s;
  }
  function parkGate(fixed) {
    var post = fixed ? '#B7794A' : GREY.door, top = fixed ? '#4FB35A' : GREY.roof;
    var s = '';
    s += rect(-30, -18, 10, 50, 4, post) + rect(20, -18, 10, 50, 4, post);
    s += path('M-34,-14 Q0,-44 34,-14 L34,-6 Q0,-34 -34,-6 Z', top);
    // swing hanging in the arch
    var swing = '<line x1="-8" y1="-24" x2="-8" y2="12" stroke="' + O + '" stroke-width="3"/><line x1="8" y1="-24" x2="8" y2="12" stroke="' + O + '" stroke-width="3"/>' +
      rect(-13, 10, 26, 7, 3, fixed ? '#FFC93C' : GREY.accent, { 'stroke-width': 3 });
    s += fixed ? swing : g(swing, 'rotate(16 0 -24)');
    if (fixed) s += g(flowers('#FF8FB1'), 'translate(-25,-20) scale(.6)') + g(flowers('#FFC93C'), 'translate(25,-20) scale(.6)');
    return s;
  }
  var BUILDINGS = { bakery: bakery, fire: firehouse, park: parkGate };

  /* ---------- pickups ---------- */
  var PICKUPS = {
    flour: function () {
      return path('M-12,14 q-4,-16 2,-22 h20 q6,6 2,22 Z', '#FFF7EA') + path('M-9,-8 q9,-6 18,0', null, { 'stroke-width': 3 }) +
        '<path d="M-5,2 q5,-5 10,0" fill="none" stroke="#E9A54B" stroke-width="3" stroke-linecap="round"/>';
    },
    hose: function () {
      return path('M-13,14 h26 l-3,-20 h-20 Z', '#6EC6F0') + rect(-14, -10, 28, 6, 3, '#4D9DE0', { 'stroke-width': 3 }) +
        path('M10,-6 q10,-8 4,-16', null, { 'stroke-width': 3 }) + '<path d="M-6,3 q6,4 12,0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>';
    },
    ball: function () {
      return circ(0, 2, 13, '#FF6B5B') + '<path d="M-13,2 h26 M0,-11 q-7,13 0,26" stroke="' + O + '" stroke-width="2.5" fill="none"/>' +
        '<circle cx="-5" cy="-4" r="2.5" fill="#fff" opacity=".8"/>';
    }
  };

  /* ---------- the puzzle board ---------- */
  var T = 64, GAP = 6;
  function tileXY(x, y) { return { x: x * (T + GAP), y: y * (T + GAP) }; }
  function boardTiles(level, opts) {
    opts = opts || {};
    var s = '';
    var ROADLIKE = { '=': 1, S: 1, G: 1, I: 1 };
    for (var y = 0; y < 5; y++) for (var x = 0; x < 5; x++) {
      var c = level.map[y].charAt(x), p = tileXY(x, y);
      var road = !!ROADLIKE[c];
      s += '<rect x="' + p.x + '" y="' + p.y + '" width="' + T + '" height="' + T + '" rx="14" fill="' + (road ? '#F6DDA8' : '#A6DB6E') + '"' +
        (road ? ' stroke="' + O + '" stroke-width="3.5"' : '') + ' data-cell="' + x + ',' + y + '"/>';
      if (!road) s += '<circle cx="' + (p.x + 18) + '" cy="' + (p.y + 20) + '" r="2.5" fill="#8CCB55"/><circle cx="' + (p.x + 44) + '" cy="' + (p.y + 42) + '" r="2.5" fill="#8CCB55"/>';
    }
    return s;
  }
  function boardDeco(level, opts) {
    opts = opts || {};
    var s = '', bld = '';
    var flowerColors = ['#FFC93C', '#FF8FB1', '#B98CF2'];
    var fi = 0;
    for (var y = 0; y < 5; y++) for (var x = 0; x < 5; x++) {
      var c = level.map[y].charAt(x), p = tileXY(x, y), cx = p.x + T / 2, cy = p.y + T / 2;
      if (c === 'T') s += g(tree(), 'translate(' + cx + ',' + (cy - 2) + ')');
      else if (c === 'B') s += g(bush(), 'translate(' + cx + ',' + (cy + 4) + ')');
      else if (c === 'W') s += g(pond(), 'translate(' + cx + ',' + cy + ')');
      else if (c === 'F') s += g(flowers(flowerColors[(fi++) % 3]), 'translate(' + cx + ',' + (cy + 2) + ')');
      else if (c === 'H') bld = g(BUILDINGS[opts.area || 'bakery'](!!opts.fixed), 'translate(' + cx + ',' + (cy - 2) + ') scale(.95)');
    }
    return s + bld;
  }
  function goalMark(level) {
    var gpos = null;
    for (var y = 0; y < 5; y++) { var i = level.map[y].indexOf('G'); if (i >= 0) gpos = tileXY(i, y); }
    var cx = gpos.x + T / 2, cy = gpos.y + T / 2;
    return '<g class="fib-goal">' + circ(cx, cy, 22, '#FFF3B0', { stroke: '#FFC93C', 'stroke-width': 4, 'stroke-dasharray': '6 6' }) + star(cx, cy, 12, '#FFC93C') + '</g>';
  }
  function pickupMarks(level, kind) {
    var s = '', n = 0;
    for (var y = 0; y < 5; y++) for (var x = 0; x < 5; x++) {
      if (level.map[y].charAt(x) === 'I') {
        var p = tileXY(x, y);
        s += '<g transform="translate(' + (p.x + T / 2) + ',' + (p.y + T / 2) + ')"><g class="fib-pickup" data-item="' + (n++) + '">' + PICKUPS[kind || 'flour']() + '</g></g>';
      }
    }
    return s;
  }

  /* ---------- Studio props ---------- */
  var PROPS = {
    prop_bread: function () { return path('M-16,8 C-20,-14 20,-14 16,8 Z', '#E9A54B') + '<path d="M-6,-4 l3,6 M2,-6 l3,6" stroke="' + O + '" stroke-width="2.5" stroke-linecap="round"/>'; },
    prop_drum: function () { return rect(-15, -6, 30, 20, 4, '#E5534B') + ell(0, -6, 15, 5, '#FFF7EA') + '<path d="M-15,-2 l10,14 l10,-14 l10,14" stroke="#FFC93C" stroke-width="2.5" fill="none"/>' + '<line x1="6" y1="-12" x2="18" y2="-22" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>'; },
    prop_cake: function () { return rect(-15, -2, 30, 16, 4, '#FF9EC3') + rect(-15, -2, 30, 6, 3, '#fff', { 'stroke-width': 3 }) + '<line x1="0" y1="-2" x2="0" y2="-12" stroke="' + O + '" stroke-width="3"/>' + path('M0,-14 q-4,-5 0,-9 q4,4 0,9', '#FFC93C', { 'stroke-width': 2 }); },
    prop_cone: function () { return path('M-14,14 L-4,-16 H4 L14,14 Z', '#FF8A3D') + '<path d="M-9,0 h18 M-11,7 h22" stroke="#fff" stroke-width="3.5"/>' + rect(-17, 12, 34, 5, 2.5, '#FF8A3D', { 'stroke-width': 3 }); },
    prop_puppy: function () { return ell(0, 4, 13, 11, '#E9C9A0') + ell(-11, -6, 5, 9, '#B7794A', { 'stroke-width': 3 }) + ell(11, -6, 5, 9, '#B7794A', { 'stroke-width': 3 }) + '<circle cx="-4" cy="1" r="2" fill="' + O + '"/><circle cx="4" cy="1" r="2" fill="' + O + '"/>' + ell(0, 7, 3, 2, O, { 'stroke-width': 1 }); },
    prop_bell: function () { return path('M-13,8 C-13,-14 13,-14 13,8 l3,4 h-32 Z', '#FFC93C') + circ(0, 14, 3.5, '#E9A54B', { 'stroke-width': 2.5 }) + rect(-3, -16, 6, 5, 2, '#E9A54B', { 'stroke-width': 2.5 }); },
    prop_ball: function () { return PICKUPS.ball(); },
    prop_flower: function () { return '<line x1="0" y1="2" x2="0" y2="18" stroke="' + O + '" stroke-width="3.5"/>' + path('M0,12 q8,-8 12,-2 q-6,6 -12,2', '#4FB35A', { 'stroke-width': 2.5 }) + g(flowers('#FF8FB1'), 'translate(0,-6)'); },
    prop_duck: function () { return ell(0, 6, 15, 10, '#FFD93D') + circ(-8, -7, 8, '#FFD93D') + path('M-16,-7 l-7,2 l7,3 Z', '#FF8A3D', { 'stroke-width': 2.5 }) + '<circle cx="-9" cy="-9" r="1.8" fill="' + O + '"/>' + path('M2,4 q6,-4 10,2', null, { 'stroke-width': 2.5 }); },
    prop_balloon: function () { return ell(0, -6, 12, 15, '#9C6ADE') + path('M-3,9 h6 l-3,4 Z', '#9C6ADE', { 'stroke-width': 2.5 }) + '<path d="M0,13 q-5,5 0,9" stroke="' + O + '" stroke-width="2" fill="none"/>' + '<ellipse cx="-4" cy="-11" rx="2.5" ry="4" fill="#fff" opacity=".6"/>'; },
    prop_star: function () { return star(0, 0, 17, '#FFC93C', 3); },
    prop_kite: function () { return path('M0,-18 L13,0 L0,14 L-13,0 Z', '#4D9DE0') + '<path d="M0,-18 V14 M-13,0 H13" stroke="' + O + '" stroke-width="2"/>' + '<path d="M0,14 q4,4 -2,8 q-5,3 0,6" stroke="#FF6B5B" stroke-width="2.5" fill="none" stroke-linecap="round"/>'; },
    prop_cat: function () { return path('M-12,-4 L-10,-16 L-3,-9 H3 L10,-16 L12,-4 a12,11 0 1 1 -24,0 Z', '#F59342') + '<circle cx="-4" cy="-2" r="2" fill="' + O + '"/><circle cx="4" cy="-2" r="2" fill="' + O + '"/>' + '<path d="M-2,3 l2,2 l2,-2" stroke="' + O + '" stroke-width="2" fill="none"/>'; }
  };
  function propSvg(id) { return '<svg viewBox="-24 -26 48 52" aria-hidden="true">' + (PROPS[id] ? PROPS[id]() : '') + '</svg>'; }

  /* ---------- Studio backgrounds (fill a 344 x 344 stage) ---------- */
  var BGS = {
    bg_meadow: function () {
      return '<rect width="344" height="344" rx="20" fill="#BFE9FF"/>' + '<rect y="150" width="344" height="194" fill="#A6DB6E"/>' +
        circ(290, 52, 24, '#FFE07A', { 'stroke-width': 0 }) + g(path('M-30,10 a14,14 0 0 1 14,-18 a18,18 0 0 1 32,2 a12,12 0 0 1 14,16 Z', '#fff', { 'stroke-width': 3 }), 'translate(80,60)');
    },
    bg_bakery: function () {
      var s = '<rect width="344" height="344" rx="20" fill="#FFE6C7"/>';
      for (var i = 0; i < 6; i++) for (var j = 0; j < 3; j++) s += '<rect x="' + (i * 58 + 4) + '" y="' + (j * 30 + 8) + '" width="54" height="26" rx="5" fill="#FFD7A8"/>';
      s += '<rect y="200" width="344" height="144" fill="#F6DDA8"/>';
      s += rect(230, 110, 90, 90, 10, '#C9C3D6') + rect(244, 130, 62, 44, 8, '#FF8A3D') + '<rect x="250" y="136" width="50" height="10" rx="5" fill="#FFC93C"/>';
      return s;
    },
    bg_firehouse: function () {
      var s = '<rect width="344" height="344" rx="20" fill="#FFD9D6"/>';
      for (var i = 0; i < 7; i++) for (var j = 0; j < 6; j++) s += '<rect x="' + (i * 50 + (j % 2 ? 25 : 0) - 10) + '" y="' + (j * 22 + 6) + '" width="44" height="16" rx="3" fill="#F3B5AF"/>';
      s += '<rect y="150" width="344" height="194" fill="#D8D3E2"/>' + '<path d="M0,200 H344 M0,260 H344" stroke="#C4BFCF" stroke-width="4"/>';
      return s;
    },
    bg_park: function () {
      var s = '<rect width="344" height="344" rx="20" fill="#CDEBFF"/>' + '<path d="M0,150 Q90,110 172,140 T344,130 V344 H0 Z" fill="#8CCB55"/>' + '<rect y="190" width="344" height="154" fill="#A6DB6E"/>';
      s += g(tree(), 'translate(40,148) scale(1.2)') + g(tree(), 'translate(300,140) scale(1.3)') + g(tree(), 'translate(250,165)');
      return s;
    }
  };

  /* ---------- the town map on the home screen ---------- */
  function sparkle(x, y, r) { return star(x, y, r, '#FFF3B0', 2); }
  function stormCloud(x, y) {
    return g(path('M-26,8 a12,12 0 0 1 10,-16 a16,16 0 0 1 30,0 a11,11 0 0 1 12,16 Z', '#A9A3B6', { 'stroke-width': 3 }) +
      path('M-4,10 l-5,10 h7 l-4,9', null, { stroke: '#FFC93C', 'stroke-width': 3 }), 'translate(' + x + ',' + y + ')');
  }
  function lockBadge(x, y) {
    return g(circ(0, 0, 16, '#fff') + rect(-8, -3, 16, 12, 3, '#A9A3B6', { 'stroke-width': 3 }) + path('M-5,-3 v-4 a5,5 0 0 1 10,0 v4', null, { 'stroke-width': 3 }), 'translate(' + x + ',' + y + ')');
  }
  function townMap(state) {
    // state: { bakery:{fixed,open}, fire:{...}, park:{...}, robot:{...}, at:'bakery' }
    var s = '<svg viewBox="0 0 360 400" class="fib-town" role="img" aria-label="Town map">';
    s += '<rect x="4" y="4" width="352" height="392" rx="30" fill="#A6DB6E" stroke="' + O + '" stroke-width="4"/>';
    // roads
    s += '<path d="M180,392 V300 Q180,270 140,262 L92,250 M180,300 Q180,260 220,250 L268,238 M180,300 V150 Q180,120 180,108" fill="none" stroke="' + O + '" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M180,392 V300 Q180,270 140,262 L92,250 M180,300 Q180,260 220,250 L268,238 M180,300 V150 Q180,120 180,108" fill="none" stroke="#F6DDA8" stroke-width="27" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M180,380 V320 M180,280 V170" stroke="#fff" stroke-width="3" stroke-dasharray="8 10" stroke-linecap="round"/>';
    // scenery
    s += g(tree(), 'translate(42,62)') + g(tree(), 'translate(320,334)') + g(tree(), 'translate(44,350) scale(.9)') + g(bush(), 'translate(96,108)') + g(pond(), 'translate(300,96) scale(1.1)');
    s += g(flowers('#FF8FB1'), 'translate(250,370) scale(.8)') + g(flowers('#FFC93C'), 'translate(112,372) scale(.8)') + g(flowers('#B98CF2'), 'translate(330,200) scale(.7)');
    var spots = { bakery: [84, 212], fire: [276, 200], park: [180, 70] };
    ['bakery', 'fire', 'park'].forEach(function (id) {
      var st8 = state[id] || {}, xy = spots[id];
      var inner = g(BUILDINGS[id](!!st8.fixed), 'scale(1.25)');
      if (st8.fixed) inner += sparkle(-36, -40, 8) + sparkle(40, -30, 6) + sparkle(30, 34, 7);
      else if (st8.open) inner += stormCloud(0, -66);
      if (!st8.open) inner += lockBadge(30, 30);
      s += '<g class="fib-area' + (st8.open ? ' is-open' : ' is-locked') + '" data-area="' + id + '" transform="translate(' + xy[0] + ',' + xy[1] + ')" role="button" tabindex="0">' +
        '<circle r="62" fill="transparent" stroke="none"/>' + inner + '</g>';
    });
    // the robot stands at the current area
    var stand = { bakery: [140, 262], fire: [222, 252], park: [180, 158] };
    var rp = stand[state.at] || [180, 340];
    s += g(robot(state.robot || {}), 'translate(' + rp[0] + ',' + rp[1] + ') scale(.72)', 'fib-town-robot');
    s += '</svg>';
    return s;
  }

  /* ---------- small icons ---------- */
  var ICONS = {
    back: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M29,12 L16,24 L29,36" fill="none" stroke="' + O + '" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    speaker: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10,19 h7 l9,-8 v26 l-9,-8 h-7 Z" fill="#fff" stroke="' + O + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M31,17 q6,7 0,14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
    go: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22,14 L50,32 L22,50 Z" fill="#fff" stroke="' + O + '" stroke-width="4.5" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14,20 a12,12 0 1 1 2,14" fill="none" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/><path d="M8,13 L14,21 L22,15" fill="none" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gear: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="11" fill="#fff" stroke="' + O + '" stroke-width="3.5"/><circle cx="24" cy="24" r="4" fill="' + O + '"/>' +
      [0, 60, 120, 180, 240, 300].map(function (d) { return '<rect x="21" y="5" width="6" height="8" rx="2" fill="#fff" stroke="' + O + '" stroke-width="3" transform="rotate(' + d + ' 24 24)"/>'; }).join('') + '</svg>',
    replay: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M36,24 a12,12 0 1 1 -4,-9" fill="none" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/><path d="M34,8 V16 H26" fill="none" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12,24 H34 M24,13 L35,24 L24,35" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    home: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8,24 L24,10 L40,24 M13,20 V38 H35 V20" fill="#fff" stroke="' + O + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="20" y="27" width="8" height="11" fill="#FFC93C" stroke="' + O + '" stroke-width="3"/></svg>',
    studio: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="14" width="52" height="40" rx="8" fill="#9C6ADE" stroke="' + O + '" stroke-width="4"/><path d="M6,24 Q20,30 32,24 T58,24" fill="none" stroke="#FFC93C" stroke-width="4"/><path d="M26,34 L40,42 L26,50 Z" fill="#fff" stroke="' + O + '" stroke-width="3.5" stroke-linejoin="round"/><circle cx="14" cy="10" r="4" fill="#FFC93C" stroke="' + O + '" stroke-width="3"/><circle cx="50" cy="10" r="4" fill="#FF6B5B" stroke="' + O + '" stroke-width="3"/></svg>',
    trash: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12,15 H36 L33,40 H15 Z" fill="#fff" stroke="' + O + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M9,15 H39 M19,15 V9 H29 V15" fill="none" stroke="' + O + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    save: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24,8 V30 M14,21 L24,31 L34,21" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10,34 V40 H38 V34" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="21" width="24" height="18" rx="4" fill="#C4BFCF" stroke="' + O + '" stroke-width="3.5"/><path d="M17,21 v-5 a7,7 0 0 1 14,0 v5" fill="none" stroke="' + O + '" stroke-width="3.5"/></svg>',
    eraser: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10,30 L26,12 L38,22 L24,38 H16 Z" fill="#FF9EC3" stroke="' + O + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M18,22 L30,32" stroke="' + O + '" stroke-width="3.5"/></svg>'
  };
  function starIcon(filled) { return '<svg viewBox="-16 -16 32 32" aria-hidden="true">' + star(0, 0, 13, filled ? '#FFC93C' : '#E7E0D2', 3) + '</svg>'; }

  function itemThumb(id) {
    var it = root.FIB.Content.ITEMS[id];
    if (!it) return '';
    if (it.kind === 'prop') return propSvg(id);
    if (it.kind === 'paint') return robotSvg({ paint: it });
    if (it.kind === 'hat' || it.kind === 'part') {
      return it.slot === 'arms' ? robotSvg({ arms: id }) : robotSvg({ top: id });
    }
    if (it.kind === 'bg') return '<svg viewBox="0 0 344 344" aria-hidden="true">' + BGS[id]() + '</svg>';
    return '';
  }

  // Shared gradient used for rainbow paint (placed once in the page).
  var DEFS = '<svg width="0" height="0" class="fib-defs" aria-hidden="true"><defs>' +
    '<linearGradient id="fib-rainbow" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#FF6B5B"/><stop offset=".25" stop-color="#FFC93C"/><stop offset=".5" stop-color="#52C46B"/><stop offset=".75" stop-color="#4D9DE0"/><stop offset="1" stop-color="#9C6ADE"/>' +
    '</linearGradient></defs></svg>';

  root.FIB = root.FIB || {};
  root.FIB.Art = {
    O: O, T: T, GAP: GAP, tileXY: tileXY,
    arrowBlock: arrowBlock, arrowGlyph: arrowGlyph, robot: robot, robotSvg: robotSvg,
    boardTiles: boardTiles, boardDeco: boardDeco, goalMark: goalMark, pickupMarks: pickupMarks,
    PICKUPS: PICKUPS, PROPS: PROPS, propSvg: propSvg, BGS: BGS, BUILDINGS: BUILDINGS,
    townMap: townMap, ICONS: ICONS, starIcon: starIcon, star: star, itemThumb: itemThumb, DEFS: DEFS,
    sparkle: sparkle, tree: tree, flowers: flowers
  };
})(typeof window !== 'undefined' ? window : globalThis);
