// [audit] places the "Discovered" banner can name: any without a name (the banner then reads "undefined")
const s = (o) => { try { return JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toFixed(1) : (v && typeof v === 'object' && !Array.isArray(v) && k) ? '[obj]' : v).slice(0, 260); } catch (e) { return String(e); } };
return World.places.filter(p => !p.name || p.name === 'undefined').map(s).join('\n') + '\nof ' + World.places.length;
