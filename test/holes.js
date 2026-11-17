// Every floor opening (P.holes) belongs to a stair, and pStairEmit (src/72d_plan.js) gives each one a trimmer on all four sides and a guard on its open sides (balustrade or hatch). Counts them.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/holes.js)"      prints "holes PASS n" or "holes FAIL"
let holes = 0, stairs = 0, cellar = 0, upper = 0; const bad = [];
for (const id in World.houses) { const P = World.houses[id].ctx && World.houses[id].ctx.plan; if (!P) continue; holes += P.holes.length; stairs += P.stairs.length;
  for (const h of P.holes) { if (!h.stair || !P.stairs.includes(h.stair)) bad.push(id + ': an opening with no stair'); }
  for (const st of P.stairs) { if (P.lv[st.k0].y < P.lv[0].y - 0.5) cellar++; else upper++; if (!st.hole) bad.push(id + ': stair without an opening'); } }
console.log(bad.length || holes !== stairs ? 'holes FAIL ' + bad.length : 'holes PASS ' + holes + ' (' + cellar + ' cellar, ' + upper + ' upper)');
return { holes, stairs, cellar, upper, bad };
