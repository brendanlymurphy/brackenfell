// ───────────────────────── the pack: what you wear and carry, eating, and trading with the smith ─────────────────────────
// Item facts live in ITEMS (80_game.js): [name, description, { slot, dmg, armor, heal, sta, value, cost, blade }].
// small ink icons, drawn by code (24 x 24, stroked in the current colour)
const INV_ICONS = {
  sword: '<path d="M18 3l3 3-9 9-3-3zM9 12l-4 4M6 13l5 5M5 16l-2 3 2 2 3-2"/>', knife: '<path d="M17 4l3 3-7 8-4-1-1-4zM8 15l-3 4"/>', hammer: '<path d="M4 9l7-5 4 4-3 3zM10 11l8 9M16 18l3-3"/>',
  bread: '<path d="M4 14c0-5 4-8 8-8s8 3 8 8v3H4zM8 11l1 2M12 10l1 2M16 11l1 2"/>', apple: '<path d="M12 7c-5-3-8 1-7 6s4 7 7 6c3 1 6-1 7-6s-2-9-7-6zM12 7c0-2 1-3 3-4"/>',
  ale: '<path d="M6 7h9v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM15 9h3a2 2 0 0 1 0 6h-3M6 7c0-2 2-3 4-2 1-2 4-1 5 2"/>', tonic: '<path d="M10 3h4M11 3v5l-4 8a3 3 0 0 0 3 5h4a3 3 0 0 0 3-5l-4-8V3M8 15h8"/>',
  malt: '<path d="M8 4h8l-1 3c3 2 4 6 3 10-1 3-3 4-6 4s-5-1-6-4c-1-4 0-8 3-10zM8 4l1 3h6"/>', frostcap: '<path d="M12 21v-9M12 14c-4 0-5-4-5-7 3 0 5 2 5 5 0-3 2-5 5-5 0 3-1 7-5 7zM9 21h6"/>',
  rope: '<path d="M4 14c0-4 4-7 8-7s8 3 8 7-4 6-8 6-8-2-8-6zM7 14c0-2 2-4 5-4s5 2 5 4-2 3-5 3-5-1-5-3zM12 7V4"/>', shield: '<path d="M12 3l7 3v6c0 4.500-3 7.500-7 9-4-1.500-7-4.500-7-9V6zM12 7v11"/>',
  armor: '<path d="M8 4l4 2 4-2 5 4-3 4-2-1v9H8v-9l-2 1-3-4zM10 4c0 2 4 2 4 0"/>', tools: '<path d="M5 20L14 8M6 18l-2 2M13 7a3 3 0 0 1 5-3l-2 2 2 2 2-2a3 3 0 0 1-4 5zM19 20l-6-6"/>',
  pouch: '<path d="M8 6h8l-2 3c4 2 5 5 4 8-1 3-3 4-6 4s-5-1-6-4c-1-3 0-6 4-8zM8 6l-1-2h10l-1 2"/>'
};
function invIcon(id) { const m = RPG.meta(id); let k = id === 'hammer' ? 'hammer' : id === 'knife' ? 'knife' : id === 'tools' ? 'tools' : m.slot === 'weapon' ? 'sword' : m.slot === 'shield' ? 'shield' : m.slot === 'armor' ? 'armor' : INV_ICONS[id] ? id : (id === 'potion' ? 'tonic' : 'pouch'); return '<span class="ic"><svg viewBox="0 0 24 24">' + INV_ICONS[k] + '</svg></span>'; }
const Inv = {
  SLOTS: [['weapon', 'Blade'], ['shield', 'Shield'], ['armor', 'Armour']],
  stock: { brandt: ['ironsword', 'buckler', 'leather'] },
  // one line saying what a thing is good for
  facts(id) {
    const m = RPG.meta(id), f = [];
    if (m.dmg) f.push(m.dmg + ' damage' + (m.speed > 1 ? ', quick' : ''));
    if (m.slot === 'shield') f.push('blocks nine parts in ten');
    if (m.armor) f.push('turns ' + Math.round(m.armor * 100) + '% of a blow');
    if (m.heal) f.push('restores ' + m.heal + ' health' + (m.sta ? ' and your wind' : ''));
    return f.join(' · ');
  },
  equip(id) {
    const r = RPG.st(), m = RPG.meta(id); if (!m.slot || !has(id)) return;
    r.eq[m.slot] = r.eq[m.slot] === id ? (m.slot === 'weapon' ? id : null) : id;
    Combat.refresh(); Audio2.pickup(); save(); Inv.render();
  },
  use(id) {
    const r = RPG.st(), m = RPG.meta(id); if (!m.heal || !has(id)) return;
    if (r.hp >= RPG.MAXHP - 0.5 && !(m.sta && r.sta < RPG.MAXST - 1)) { toast('You are not hurt.'); return; }
    give(id, -1); RPG.heal(m.heal * (RPG.perk && RPG.perk('forager') ? 1.5 : 1)); if (m.sta) r.sta = Math.min(RPG.MAXST, r.sta + m.sta);
    if (id === 'ale' || id === 'potion' || id === 'tonic') Audio2.drink(); else Audio2.eat();
    toast(ITEMS[id][0] + ': +' + m.heal + ' health'); save(); Inv.render();
  },
  // the best thing to eat right now (quick-use key and the touch button)
  quick() { const r = RPG.st(); let best = null, bs = 1e9; for (const id in S.items) { const m = RPG.meta(id); if (!m.heal) continue; const waste = Math.abs(RPG.MAXHP - r.hp - m.heal); if (waste < bs) { bs = waste; best = id; } } if (best) Inv.use(best); else toast('Nothing to eat or drink.'); },
  render() {
    const box = $('tab-pack'), r = RPG.st(); if (!box) return;
    let h = '<div class="vit"><span>Health <b>' + Math.round(r.hp) + ' / ' + RPG.MAXHP + '</b></span><span>Stamina <b>' + Math.round(r.sta) + ' / ' + RPG.MAXST + '</b></span><span><b>' + S.gold + '</b> gold</span></div><div class="gear">';
    for (const [slot, label] of Inv.SLOTS) { const id = r.eq[slot]; h += '<div><small>' + label + '</small><b>' + (id && has(id) ? ITEMS[id][0] : 'None') + '</b><span>' + (id && has(id) ? Inv.facts(id) : slot === 'weapon' ? 'Bare hands will not serve you.' : '') + '</span></div>'; }
    h += '</div>' + (typeof econPerkHtml === 'function' ? econPerkHtml() : '') + '<div class="items">';
    const ids = Object.keys(S.items).sort((a, b) => (RPG.meta(b).slot ? 1 : 0) - (RPG.meta(a).slot ? 1 : 0) || (RPG.meta(b).heal ? 1 : 0) - (RPG.meta(a).heal ? 1 : 0));
    for (const id of ids) {
      const m = RPG.meta(id), on = m.slot && r.eq[m.slot] === id, f = Inv.facts(id);
      h += '<div' + (on ? ' class="worn"' : '') + '>' + invIcon(id) + '<b>' + ITEMS[id][0] + (S.items[id] > 1 ? ' × ' + S.items[id] : '') + '</b><span>' + ITEMS[id][1] + (f ? ' <i>' + f + '</i>' : '') + '</span>';
      if (m.slot) h += '<button type="button" class="btn small" data-equip="' + id + '">' + (on ? (m.slot === 'weapon' ? 'In hand' : 'Take off') : m.slot === 'weapon' ? 'Wield' : 'Wear') + '</button>';
      else if (id === 'lantern') h += '<button type="button" class="btn small" data-lamp="1">' + (S.flags.lampOff === 1 ? 'Light' : 'Douse') + '</button>';       // [q1] a phone has no L key
      else if (m.heal) h += '<button type="button" class="btn small" data-use="' + id + '">' + (id === 'ale' || id === 'potion' || id === 'tonic' ? 'Drink' : 'Eat') + '</button>';
      h += '</div>';
    }
    if (!ids.length) h += '<p class="empty">Your pack is empty.</p>';
    box.innerHTML = h + '</div>';
    if (!Inv.bound) { Inv.bound = true; box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.perk) { if (typeof econChoose === 'function' && econChoose(b.dataset.perk)) Inv.render(); } else if (b.dataset.lamp) { if (typeof mineLamp === 'function') mineLamp(); Inv.render(); } else if (b.dataset.equip) Inv.equip(b.dataset.equip); else if (b.dataset.use) Inv.use(b.dataset.use); }); }
  },
  // ── trade, as dialogue ──
  shop(who) {
    const opts = Inv.stock[who].map(id => { const m = RPG.meta(id); return [ITEMS[id][0] + ' (' + m.cost + ' gold): ' + Inv.facts(id), () => {
      if (S.gold < m.cost) return node('That’s ' + m.cost + ' gold, and you’ve ' + S.gold + '. Hale pays a bounty on outlaws, if you’ve the stomach for it.', [['Something else.', () => Inv.shop(who)], bye]);
      gold(-m.cost); give(id); toast('Bought: ' + ITEMS[id][0]); const r = RPG.st(); if (m.slot && (m.slot !== 'weapon' || (RPG.meta(r.eq.weapon).dmg || 0) < m.dmg)) { r.eq[m.slot] = id; Combat.refresh(); } save();
      return node('Sound work, that. Look after it and it will look after you.', [['Something else.', () => Inv.shop(who)], bye]); }]; });
    return node('Iron from the Greyspine, every piece. I don’t haggle.', opts.concat([bye]));
  },
  sell(who) {
    const r = RPG.st(), opts = [];
    for (const id in S.items) { const m = RPG.meta(id); if (!m.value || (m.slot && r.eq[m.slot] === id && S.items[id] < 2)) continue; opts.push([ITEMS[id][0] + (S.items[id] > 1 ? ' × ' + S.items[id] : '') + ' (' + m.value + ' gold)', () => { give(id, -1); gold(m.value); save(); return Inv.sell(who); }]); }
    return node(opts.length ? 'Let’s see it, then.' : 'You’ve nothing I’d give coin for. Outlaws carry better than they deserve, mind.', opts.slice(0, 7).concat([bye]));
  },
};
