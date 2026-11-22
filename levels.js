/* Fix-It Bot — town content: areas, 24 puzzles, rewards.
   Map key: . grass  = road  F flowers (walkable)  S start  G star  I thing to pick up
            T tree  B bush  W pond  H the area's building (all four block the robot)
   Build puzzles: she lines up arrows herself. Fix puzzles: the code is given with one wrong arrow. */
(function (root) {
  'use strict';
  var ALL = ['U', 'L', 'R', 'D'];

  var AREAS = [
    {
      id: 'bakery', skill: 'Puts steps in order',
      partReward: 'arms_mitts', pickup: 'flour',
      levels: [
        { id: 'b1', type: 'build', arrows: ['R'], slots: 4, reward: 'prop_bread', intro: 'intro_first',
          map: ['T..T.', '..H..', 'S=G.B', '.....', 'F..T.'] },
        { id: 'b2', type: 'build', arrows: ['R'], slots: 6, reward: 'paint_pink', intro: 'intro_build',
          map: ['..T..', 'F...H', 'S===G', '.T...', '...BF'] },
        { id: 'b3', type: 'build', arrows: ['U', 'R'], slots: 5, reward: 'hat_chef', intro: 'new_up',
          map: ['TH..T', '.G...', '.=.B.', '.=...', 'TS.F.'] },
        { id: 'b4', type: 'build', arrows: ['U', 'R'], slots: 6, reward: 'bg_bakery', intro: 'intro_build',
          map: ['T...F', '...H.', '.B.G.', '...=T', 'FS==.'] },
        { id: 'b5', type: 'build', arrows: ['U', 'R'], slots: 6, reward: 'prop_drum', intro: 'intro_order',
          map: ['F.T..', '..H.T', '==G..', '=B..F', 'ST...'] },
        { id: 'b6', type: 'build', arrows: ALL, slots: 8, reward: 'paint_orange', intro: 'new_left_down',
          map: ['.===S', 'T=.B.', '.=.T.', '.G..F', '.H...'] },
        { id: 'b7', type: 'build', arrows: ALL, slots: 8, reward: 'prop_cake', intro: 'intro_pickup',
          map: ['T...F', '.I.H.', '.==G.', 'S=.B.', '..T..'] },
        { id: 'b8', type: 'build', arrows: ALL, slots: 10, reward: 'hat_bow', intro: 'intro_pickup',
          map: ['..=I=', 'T.=B=', 'S==.G', '.W..H', '.W.F.'] }
      ]
    },
    {
      id: 'fire', skill: 'Finds and fixes a wrong step',
      partReward: 'top_siren', pickup: 'hose',
      levels: [
        { id: 'f1', type: 'fix', arrows: ALL, program: ['R', 'R', 'U'], reward: 'prop_cone', intro: 'intro_fix_first',
          map: ['F....', '..TH.', 'S==G.', '.B...', '...T.'] },
        { id: 'f2', type: 'fix', arrows: ALL, program: ['U', 'U', 'L'], reward: 'hat_helmet', intro: 'intro_fix',
          map: ['T...F', '..H..', '.=G.T', '.=.B.', '.S...'] },
        { id: 'f3', type: 'fix', arrows: ALL, program: ['D', 'R', 'R', 'R'], reward: 'paint_red', intro: 'intro_fix',
          map: ['...T.', 'B..H.', '===G.', 'S.T..', '....F'] },
        { id: 'f4', type: 'fix', arrows: ALL, program: ['R', 'R', 'D', 'L', 'D'], reward: 'bg_firehouse', intro: 'intro_fix',
          map: ['S==.T', '.B=..', 'T.=.F', '..G..', '..H..'] },
        { id: 'f5', type: 'fix', arrows: ALL, program: ['U', 'U', 'L', 'L', 'D'], reward: 'prop_puppy', intro: 'intro_fix_pickup',
          map: ['F....', '.H..T', '.G==I', 'B.T.=', '....S'] },
        { id: 'f6', type: 'fix', arrows: ALL, program: ['U', 'R', 'R', 'U', 'U', 'U'], reward: 'prop_bell', intro: 'intro_fix',
          map: ['T.F.H', '.B..G', '....=', '.T..=', '.S==='] },
        { id: 'f7', type: 'fix', arrows: ALL, program: ['D', 'D', 'D', 'R', 'U', 'R'], reward: 'paint_purple', intro: 'intro_fix_pickup',
          map: ['S.T.F', '=.B..', '=...T', 'I==G.', 'F..H.'] },
        { id: 'f8', type: 'fix', arrows: ALL, program: ['U', 'U', 'U', 'L', 'L', 'D', 'L'], reward: 'hat_cap', intro: 'intro_fix',
          map: ['HF..T', 'G====', '.TW.=', 'B...=', '..F.S'] }
      ]
    },
    {
      id: 'park', skill: 'Plans longer routes and fixes longer code',
      partReward: 'top_propeller', pickup: 'ball',
      levels: [
        { id: 'p1', type: 'build', arrows: ALL, slots: 10, reward: 'prop_ball', intro: 'intro_pickup',
          map: ['T.F..', '..I==', 'S==.I', '.T..=', 'F.THG'] },
        { id: 'p2', type: 'fix', arrows: ALL, program: ['R', 'R', 'R', 'U', 'U', 'R'], reward: 'prop_flower', intro: 'intro_fix',
          map: ['F..H.', 'B.=G.', '..=.T', '.W=T.', 'S==.F'] },
        { id: 'p3', type: 'build', arrows: ALL, slots: 9, reward: 'paint_yellow', intro: 'intro_pickup',
          map: ['S=I..', '.TT=.', '...=.', '.W.=B', '.W.GH'] },
        { id: 'p4', type: 'fix', arrows: ALL, program: ['L', 'L', 'D', 'D', 'L', 'D', 'D'], reward: 'bg_park', intro: 'intro_fix_pickup',
          map: ['F.==S', 'B.=.T', '=.I..', 'GT..F', 'H..W.'] },
        { id: 'p5', type: 'build', arrows: ALL, slots: 10, reward: 'prop_duck', intro: 'intro_pickup',
          map: ['F.TB.', 'I=I==', '=..WG', '=T..H', 'S..F.'] },
        { id: 'p6', type: 'fix', arrows: ALL, program: ['D', 'D', 'R', 'R', 'U', 'D', 'D'], reward: 'hat_crown', intro: 'intro_fix_pickup',
          map: ['S.F..', '=.T.B', '==I=.', '.W.=.', '..FGH'] },
        { id: 'p7', type: 'build', arrows: ALL, slots: 11, reward: 'prop_balloon', intro: 'intro_pickup',
          map: ['S=.TH', 'T=T=G', '.===.', '.B.I.', 'F....'] },
        { id: 'p8', type: 'fix', arrows: ALL, program: ['U', 'U', 'U', 'U', 'L', 'L', 'L', 'U', 'L'], reward: 'paint_rainbow', intro: 'intro_fix_pickup',
          map: ['H.I==', 'G=TB=', '.W..=', 'F...=', '..T.S'] }
      ]
    }
  ];

  /* Everything she can earn. kind: prop (Studio thing that bounces and makes a sound),
     hat, paint (robot colour), bg (Studio background), part (robot part from fixing an area). */
  var ITEMS = {
    bg_meadow: { kind: 'bg', starter: true },
    paint_teal: { kind: 'paint', color: '#3BB8B0', light: '#5CCFC6', starter: true },
    prop_bread: { kind: 'prop', sound: 'boop' },
    paint_pink: { kind: 'paint', color: '#F27BA8', light: '#FF9EC3' },
    hat_chef: { kind: 'hat' },
    bg_bakery: { kind: 'bg' },
    prop_drum: { kind: 'prop', sound: 'drum' },
    paint_orange: { kind: 'paint', color: '#F59342', light: '#FFB36B' },
    prop_cake: { kind: 'prop', sound: 'sparkle' },
    hat_bow: { kind: 'hat' },
    prop_cone: { kind: 'prop', sound: 'boop' },
    hat_helmet: { kind: 'hat' },
    paint_red: { kind: 'paint', color: '#E5534B', light: '#FF7B72' },
    bg_firehouse: { kind: 'bg' },
    prop_puppy: { kind: 'prop', sound: 'bark' },
    prop_bell: { kind: 'prop', sound: 'bell' },
    paint_purple: { kind: 'paint', color: '#9C6ADE', light: '#B98CF2' },
    hat_cap: { kind: 'hat' },
    prop_ball: { kind: 'prop', sound: 'bounce' },
    prop_flower: { kind: 'prop', sound: 'sparkle' },
    paint_yellow: { kind: 'paint', color: '#F2C230', light: '#FFDB5C' },
    bg_park: { kind: 'bg' },
    prop_duck: { kind: 'prop', sound: 'quack' },
    hat_crown: { kind: 'hat' },
    prop_balloon: { kind: 'prop', sound: 'pop' },
    paint_rainbow: { kind: 'paint', color: 'rainbow', light: '#FFFFFF' },
    // Bonus pool for marked worksheets, handed out in this order.
    prop_star: { kind: 'prop', sound: 'sparkle', bonus: true },
    prop_kite: { kind: 'prop', sound: 'whoosh', bonus: true },
    hat_party: { kind: 'hat', bonus: true },
    prop_cat: { kind: 'prop', sound: 'meow', bonus: true },
    paint_blue: { kind: 'paint', color: '#4D9DE0', light: '#7BB9EE', bonus: true },
    paint_green: { kind: 'paint', color: '#52B35E', light: '#7DD27F', bonus: true },
    // Robot parts from fixing a whole area.
    arms_mitts: { kind: 'part', slot: 'arms' },
    top_siren: { kind: 'part', slot: 'top' },
    top_propeller: { kind: 'part', slot: 'top' }
  };

  var BONUS_ORDER = ['prop_star', 'prop_kite', 'hat_party', 'prop_cat', 'paint_blue', 'paint_green'];

  function allLevels() {
    var out = [];
    AREAS.forEach(function (a) { a.levels.forEach(function (l) { l.area = a.id; out.push(l); }); });
    return out;
  }
  function levelById(id) {
    var all = allLevels();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  function areaById(id) {
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i].id === id) return AREAS[i];
    return null;
  }

  root.FIB = root.FIB || {};
  root.FIB.Content = {
    AREAS: AREAS, ITEMS: ITEMS, BONUS_ORDER: BONUS_ORDER,
    allLevels: allLevels, levelById: levelById, areaById: areaById
  };
})(typeof window !== 'undefined' ? window : globalThis);
