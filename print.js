/* Fix-It Bot — printables: maze worksheets (with answer key), arrow cards, and the progress note. */
(function (root) {
  'use strict';
  var E = root.FIB.Engine, C = root.FIB.Content, A = root.FIB.Art, S = root.FIB.Store, App = root.FIB.App;
  var h = App.h, btn = App.btn;
  var ALL = ['U', 'L', 'R', 'D'];

  function rng(seed) {
    var a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // Four solvable mazes for a sheet, the same every time for the same seed.
  function mazes(seed) {
    var r = rng(seed), out = [], tries = 0;
    var blockers = ['T', 'B', 'T', 'W'];
    while (out.length < 4 && tries++ < 4000) {
      var cells = [];
      for (var y = 0; y < 5; y++) { cells.push([]); for (var x = 0; x < 5; x++) cells[y].push(r() < 0.12 ? 'F' : '.'); }
      var sx = Math.floor(r() * 5), sy = Math.floor(r() * 5), gx = Math.floor(r() * 5), gy = Math.floor(r() * 5);
      var man = Math.abs(sx - gx) + Math.abs(sy - gy);
      if (man < 3 || man > 5) continue;
      cells[sy][sx] = 'S'; cells[gy][gx] = 'G';
      var nObs = 3 + Math.floor(r() * 3);
      for (var k = 0; k < nObs; k++) {
        var ox = Math.floor(r() * 5), oy = Math.floor(r() * 5);
        if (cells[oy][ox] === 'S' || cells[oy][ox] === 'G') continue;
        cells[oy][ox] = blockers[Math.floor(r() * blockers.length)];
      }
      var lvl = { id: 'm', map: cells.map(function (row) { return row.join(''); }), arrows: ALL };
      var sol = E.solve(lvl);
      if (!sol || sol.dist < 3 || sol.dist > 6) continue;
      if (out.some(function (m) { return m.level.map.join() === lvl.map.join(); })) continue;
      out.push({ level: lvl, solution: sol.path });
    }
    return out;
  }
  function mazeSvg(m, ch) {
    var g = E.parse(m.level), p = A.tileXY(g.start.x, g.start.y);
    return '<svg viewBox="-9 -9 362 362">' + '<rect x="-9" y="-9" width="362" height="362" rx="26" fill="#7FBF4A" stroke="' + A.O + '" stroke-width="4"/>' +
      A.boardTiles(m.level) + A.boardDeco(m.level) + A.goalMark(m.level) +
      '<g transform="translate(' + (p.x + A.T / 2) + ',' + (p.y + A.T / 2 - 4) + ') scale(.95)">' + A.robot(App.robotOpts(ch)) + '</g></svg>';
  }

  function view(pages, backTo) {
    var bar = h('div', { cls: 'print-bar' }, [
      btn('round', A.ICONS.back, 'Back', backTo),
      h('button', { cls: 'pbtn primary', text: 'Print', attrs: { type: 'button' }, on: { click: function () { window.print(); } } })
    ]);
    var wrap = h('div', { cls: 'print-pages' }, pages);
    App.show(h('div', { cls: 'print-view' }, [bar, wrap]), 'is-print');
  }

  function headerRow(title, ch, sheetId) {
    return h('div', { cls: 'pp-head' }, [
      h('div', { cls: 'pp-logo' }, [h('span', { cls: 'logo-fix', text: 'Fix-It' }), h('span', { cls: 'logo-bot', text: 'Bot' })]),
      h('div', { cls: 'pp-title', text: title }),
      sheetId ? h('div', { cls: 'pp-id', text: sheetId }) : null
    ]);
  }

  function mazeSheet(sheet, ch, backTo) {
    var ms = mazes(sheet.seed);
    var page = h('div', { cls: 'pp' }, [
      headerRow('Maze sheet', ch, sheet.id),
      h('div', { cls: 'pp-lines' }, [h('span', { text: 'Name: ' + ch.name }), h('span', { text: 'Date: ______________' })]),
      h('p', { cls: 'pp-instr', text: 'Draw an arrow in each box to get the robot to the star. Go around the trees, bushes and ponds.' }),
      h('div', { cls: 'pp-mazes' }, ms.map(function (m, i) {
        var boxes = h('div', { cls: 'pp-boxes' });
        for (var b = 0; b < 6; b++) boxes.appendChild(h('span', { cls: 'pp-box' }));
        return h('div', { cls: 'pp-maze' }, [h('div', { cls: 'pp-num', text: String(i + 1) }), h('div', { cls: 'pp-board', art: mazeSvg(m, ch) }), boxes]);
      })),
      h('p', { cls: 'pp-foot', text: 'Grown-up: mark this sheet in Fix-It Bot (Grown-ups, then Worksheets). 3 or 4 mazes right earns a prize. Any arrows that reach the star count, even a longer way.' })
    ]);
    var key = h('div', { cls: 'pp' }, [
      headerRow('Answer key (grown-ups)', ch, sheet.id),
      h('p', { cls: 'pp-instr', text: 'One shortest way for each maze. Other routes count too, as long as every step stays on the board, misses the trees, bushes and ponds, and ends on the star.' }),
      h('div', { cls: 'pp-keys' }, ms.map(function (m, i) {
        return h('div', { cls: 'pp-key' }, [h('div', { cls: 'pp-num', text: String(i + 1) }), h('div', { cls: 'pp-board small', art: mazeSvg(m, ch) }),
          h('div', { cls: 'pp-key-arrows', art: m.solution.map(function (a) { return '<span class="pk">' + A.arrowBlock(a) + '</span>'; }).join('') })]);
      }))
    ]);
    view([page, key], backTo);
  }

  function arrowCards(ch, backTo) {
    var grid = h('div', { cls: 'pp-cards' });
    ['U', 'U', 'U', 'R', 'R', 'R', 'L', 'L', 'L', 'D', 'D', 'D'].forEach(function (d) { grid.appendChild(h('div', { cls: 'pp-card', art: A.arrowBlock(d) })); });
    var page = h('div', { cls: 'pp' }, [
      headerRow('Arrow cards', ch),
      h('p', { cls: 'pp-instr', text: 'Cut along the dashed lines.' }),
      grid
    ]);
    var game = h('div', { cls: 'pp' }, [
      headerRow('Be the robot', ch),
      h('ol', { cls: 'pp-steps' }, [
        h('li', { text: 'Put a toy somewhere in the room. That is the star.' }),
        h('li', { text: 'You are the robot. Stand still and face the same way the whole game.' }),
        h('li', { text: 'Your child lays the arrow cards in a line, left to right, to get you to the toy.' }),
        h('li', { text: 'Take one step for each card: up means step forward, down means step back, left and right mean step sideways.' }),
        h('li', { text: 'Bump into something or miss the toy? Say "Bonk!" and let them fix one card, then try again.' }),
        h('li', { text: 'Swap roles: you lay the cards, and they are the robot.' })
      ]),
      h('p', { cls: 'pp-foot', text: 'This matches the app: steps in order (Grade 1 coding) and finding a wrong step to fix it.' })
    ]);
    view([page, game], backTo);
  }

  function progressNote(ch, backTo) {
    var rows = C.AREAS.map(function (a) {
      var done = a.levels.filter(function (l) { return S.levelDone(ch, l.id); }).length;
      var stars = a.levels.reduce(function (n, l) { return n + ((ch.levels[l.id] && ch.levels[l.id].stars) || 0); }, 0);
      var status = ch.areasFixed[a.id] ? 'Got it' : (done ? 'Practising' : 'Not started yet');
      return h('tr', {}, [h('td', { text: { bakery: 'Bakery', fire: 'Fire station', park: 'Park' }[a.id] }), h('td', { text: a.skill }), h('td', { text: done + ' of 8' }), h('td', { text: stars + ' of 24' }), h('td', { text: status })]);
    });
    var marked = ch.sheets.filter(function (s) { return s.marked; });
    var right = marked.reduce(function (n, s) { return n + s.marked.correct; }, 0);
    var next = !ch.areasFixed.bakery ? 'Lining up arrows in order. Try the arrow cards game together.' :
      !ch.areasFixed.fire ? 'Spotting the one wrong arrow. Ask: "Where did the robot go wrong?"' :
      !ch.areasFixed.park ? 'Longer routes. Ask them to say the plan out loud before pressing Go.' :
      'The whole town is fixed. Next up: two things moving at once (Grade 2).';
    var page = h('div', { cls: 'pp' }, [
      headerRow('Progress note', ch),
      h('div', { cls: 'pp-lines' }, [h('span', { text: ch.name + ' and ' + ch.robotName }), h('span', { text: new Date().toLocaleDateString() })]),
      h('table', { cls: 'pp-table' }, [h('thead', {}, [h('tr', {}, ['Place', 'Skill', 'Puzzles', 'Stars', 'Status'].map(function (t) { return h('th', { text: t }); }))]), h('tbody', {}, rows)]),
      h('p', { text: 'Worksheets marked: ' + marked.length + (marked.length ? ' (' + right + ' of ' + marked.length * 4 + ' mazes right)' : '') }),
      h('p', { text: 'Ontario link: Grade 1 math, coding (strand C3): writing code with steps in order, and reading and changing code to see what happens.' }),
      h('p', { cls: 'pp-next', text: 'What to try next: ' + next })
    ]);
    view([page], backTo);
  }

  root.FIB = root.FIB || {};
  root.FIB.Print = { mazes: mazes, mazeSheet: mazeSheet, arrowCards: arrowCards, progressNote: progressNote };
})(window);
