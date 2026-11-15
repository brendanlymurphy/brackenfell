// ───────────────────────── regulars of the Honeyed Hart: evening guests who fill the common room (inn.s6..s12) ─────────────────────────
// By day they idle in the square or at a porch; from the evening bell they are at their table; they sleep in the infill cottages.
(function () {
  const L = [
    ['pat1', 'Wat Cooper', 'tan', 'brown', [0.45, 0.36, 0.26], 'inn.s6', 'in.02.bed', 'square.bench'],
    ['pat2', 'Edda Fenn', 'rosy', 'auburn', [0.5, 0.3, 0.3], 'inn.s7', 'in.04.bed', 'square.bench2'],
    ['pat3', 'Hob the Carter', 'brown', 'black', [0.34, 0.4, 0.3], 'inn.s8', 'in.07.bed', 'square.well'],
    ['pat4', 'Sorrel Vane', 'fair', 'blond', [0.42, 0.32, 0.5], 'inn.s9', 'in.13.bed', 'elder.porch'],
    ['pat5', 'Piers Lowe', 'tan', 'grey', [0.4, 0.38, 0.34], 'inn.s10', 'in.21.bed', 'square.bench'],
    ['pat6', 'Nell Marsh', 'rosy', 'brown', [0.3, 0.42, 0.46], 'inn.s11', 'in.23.bed', 'square.bench2'],
    ['pat7', 'Jory Thatcher', 'brown', 'brown', [0.5, 0.42, 0.22], 'inn.s12', 'in.02.bed', 'square.well'],
  ];
  for (const [id, name, skin, hair, top, seat, bed, day] of L) NPC_DEFS.push({ id, name, skin, hair, top, legs: [0.3, 0.26, 0.22], dress: skin === 'rosy', sched: [[7.5, day, 'idle'], [18.5, seat, 'sit'], [23.5, bed, 'lie']] });
})();
