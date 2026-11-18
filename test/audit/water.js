// [audit] water depth on a 1 m grid (-1 = dry) for the edge test. usage: node test/audit/run.mjs --json shots/audit/water.json test/audit/water.js
const g=[]; for (let z=-130; z<=130; z+=1) { const row=[]; for (let x=-130; x<=130; x+=1) { const w=World.waterAt(x,z); row.push(w>-900 ? +(w-World.groundAt(x,z,w+2)).toFixed(2) : -1); } g.push(row); } return { depth: g };
