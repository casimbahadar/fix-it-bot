/* Fix-It Bot — puzzle engine.
   Pure logic, no DOM: parses levels, runs programs, solves puzzles, picks hints, scores stars.
   Loaded in the browser as a plain script and in Node tests through vm. */
(function (root) {
  'use strict';

  var SIZE = 5;
  var DIRS = {
    U: { dx: 0, dy: -1 },
    D: { dx: 0, dy: 1 },
    L: { dx: -1, dy: 0 },
    R: { dx: 1, dy: 0 }
  };
  var ARROWS = ['U', 'L', 'R', 'D'];
  // Tiles the robot cannot enter.
  var BLOCKING = { T: 1, B: 1, W: 1, H: 1 };

  // Turn a level's 5 map rows into a grid with start, goal and item positions.
  function parse(level) {
    var tiles = [];
    var start = null, goal = null, items = [];
    for (var y = 0; y < SIZE; y++) {
      var row = level.map[y];
      if (!row || row.length !== SIZE) throw new Error('Bad map row ' + y + ' in ' + level.id);
      tiles.push([]);
      for (var x = 0; x < SIZE; x++) {
        var c = row.charAt(x);
        if (c === 'S') start = { x: x, y: y };
        else if (c === 'G') goal = { x: x, y: y };
        else if (c === 'I') items.push({ x: x, y: y });
        tiles[y].push(c);
      }
    }
    if (!start || !goal) throw new Error('Level ' + level.id + ' needs S and G');
    return { tiles: tiles, start: start, goal: goal, items: items };
  }

  function blocked(grid, x, y) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return true;
    return !!BLOCKING[grid.tiles[y][x]];
  }

  function itemIndex(grid, x, y) {
    for (var i = 0; i < grid.items.length; i++) {
      if (grid.items[i].x === x && grid.items[i].y === y) return i;
    }
    return -1;
  }

  function fullMask(grid) { return (1 << grid.items.length) - 1; }

  /* Run a program. Returns every step so the screen can animate it.
     result: 'win' | 'bump' | 'missed' (at the star without everything) | 'short' (not at the star) */
  function run(level, program, gridIn) {
    var grid = gridIn || parse(level);
    var x = grid.start.x, y = grid.start.y, mask = 0;
    var steps = [];
    for (var i = 0; i < program.length; i++) {
      var d = DIRS[program[i]];
      if (!d) throw new Error('Unknown block ' + program[i]);
      var nx = x + d.dx, ny = y + d.dy;
      if (blocked(grid, nx, ny)) {
        steps.push({ i: i, x: x, y: y, bump: true, toward: { x: nx, y: ny }, mask: mask });
        return { result: 'bump', at: i, steps: steps, x: x, y: y, mask: mask };
      }
      x = nx; y = ny;
      var got = -1;
      var k = itemIndex(grid, x, y);
      if (k >= 0 && !(mask & (1 << k))) { mask |= (1 << k); got = k; }
      steps.push({ i: i, x: x, y: y, got: got, mask: mask });
    }
    var atGoal = x === grid.goal.x && y === grid.goal.y;
    var all = mask === fullMask(grid);
    var result = atGoal && all ? 'win' : (atGoal ? 'missed' : 'short');
    return { result: result, at: program.length, steps: steps, x: x, y: y, mask: mask };
  }

  function key(x, y, m) { return x + ',' + y + ',' + m; }

  /* Fewest moves from a state to a finished puzzle, using only the allowed arrows.
     Returns { dist, path } or null when it cannot be finished. */
  function solveFrom(level, grid, sx, sy, smask, arrows) {
    var target = fullMask(grid);
    var allowed = arrows || level.arrows || ARROWS;
    var q = [{ x: sx, y: sy, m: smask }];
    var prev = {};
    var seen = {};
    seen[key(sx, sy, smask)] = true;
    var head = 0;
    while (head < q.length) {
      var s = q[head++];
      if (s.x === grid.goal.x && s.y === grid.goal.y && s.m === target) {
        var path = [];
        var k = key(s.x, s.y, s.m);
        while (prev[k]) { path.unshift(prev[k].a); k = prev[k].from; }
        return { dist: path.length, path: path };
      }
      for (var j = 0; j < allowed.length; j++) {
        var a = allowed[j], d = DIRS[a];
        var nx = s.x + d.dx, ny = s.y + d.dy;
        if (blocked(grid, nx, ny)) continue;
        var nm = s.m;
        var it = itemIndex(grid, nx, ny);
        if (it >= 0) nm |= (1 << it);
        var nk = key(nx, ny, nm);
        if (seen[nk]) continue;
        seen[nk] = true;
        prev[nk] = { from: key(s.x, s.y, s.m), a: a };
        q.push({ x: nx, y: ny, m: nm });
      }
    }
    return null;
  }

  function solve(level) {
    var grid = parse(level);
    return solveFrom(level, grid, grid.start.x, grid.start.y, 0, level.arrows);
  }

  // Every single-arrow change to a program that makes it win.
  function singleFixes(level, program) {
    var grid = parse(level);
    var out = [];
    for (var i = 0; i < program.length; i++) {
      for (var j = 0; j < ARROWS.length; j++) {
        var a = ARROWS[j];
        if (a === program[i]) continue;
        var p = program.slice();
        p[i] = a;
        if (run(level, p, grid).result === 'win') out.push({ index: i, arrow: a });
      }
    }
    return out;
  }

  /* Pick the block to point at after three failed runs.
     { index, arrow } — index may equal program.length, meaning "add this arrow next". */
  function hint(level, program) {
    var grid = parse(level);
    if (level.type === 'fix') {
      var fixes = singleFixes(level, program);
      if (fixes.length) return fixes[0];
    }
    var x = grid.start.x, y = grid.start.y, m = 0;
    var arrows = level.type === 'fix' ? ARROWS : level.arrows;
    var best = solveFrom(level, grid, x, y, m, arrows);
    if (!best) return null;
    for (var i = 0; i < program.length; i++) {
      var want = best.path[0];
      var d = DIRS[program[i]];
      var nx = x + d.dx, ny = y + d.dy;
      if (blocked(grid, nx, ny)) return { index: i, arrow: want };
      var nm = m;
      var it = itemIndex(grid, nx, ny);
      if (it >= 0) nm |= (1 << it);
      var after = solveFrom(level, grid, nx, ny, nm, arrows);
      if (!after || after.dist !== best.dist - 1) return { index: i, arrow: want };
      x = nx; y = ny; m = nm; best = after;
      if (best.dist === 0 && i < program.length - 1) return { index: i + 1, arrow: null, remove: true };
    }
    if (best.dist > 0) return { index: program.length, arrow: best.path[0] };
    return null;
  }

  /* Stars (decision J1):
     3 = solved on the first run (and, for build puzzles, with the fewest blocks)
     2 = solved within 3 runs
     1 = solved after that. Rewards need 2 or more. */
  function stars(level, runs, blocksUsed, optimal) {
    if (runs <= 1 && (level.type === 'fix' || blocksUsed <= optimal)) return 3;
    if (runs <= 3) return 2;
    return 1;
  }

  var api = {
    SIZE: SIZE, DIRS: DIRS, ARROWS: ARROWS, BLOCKING: BLOCKING,
    parse: parse, run: run, solve: solve, solveFrom: solveFrom,
    singleFixes: singleFixes, hint: hint, stars: stars, blocked: blocked
  };
  root.FIB = root.FIB || {};
  root.FIB.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
