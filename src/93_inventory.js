// ───────────────────────── the pack: what you wear and carry, eating, and trading with the smith ─────────────────────────
// Item facts live in ITEMS (80_game.js): [name, description, { slot, dmg, armor, heal, sta, value, cost, blade }].
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
    give(id, -1); RPG.heal(m.heal); if (m.sta) r.sta = Math.min(RPG.MAXST, r.sta + m.sta);
    if (id === 'ale' || id === 'potion' || id === 'tonic') Audio2.drink(); else Audio2.eat();
    toast(ITEMS[id][0] + ': +' + m.heal + ' health'); save(); Inv.render();
  },
  // the best thing to eat right now (quick-use key and the touch button)
  quick() { const r = RPG.st(); let best = null, bs = 1e9; for (const id in S.items) { const m = RPG.meta(id); if (!m.heal) continue; const waste = Math.abs(RPG.MAXHP - r.hp - m.heal); if (waste < bs) { bs = waste; best = id; } } if (best) Inv.use(best); else toast('Nothing to eat or drink.'); },
  render() {
    const box = $('tab-pack'), r = RPG.st(); if (!box) return;
    let h = '<div class="vit"><span>Health <b>' + Math.round(r.hp) + ' / ' + RPG.MAXHP + '</b></span><span>Stamina <b>' + Math.round(r.sta) + ' / ' + RPG.MAXST + '</b></span><span><b>' + S.gold + '</b> gold</span></div><div class="gear">';
    for (const [slot, label] of Inv.SLOTS) { const id = r.eq[slot]; h += '<div><small>' + label + '</small><b>' + (id && has(id) ? ITEMS[id][0] : 'None') + '</b><span>' + (id && has(id) ? Inv.facts(id) : slot === 'weapon' ? 'Bare hands will not serve you.' : '') + '</span></div>'; }
    h += '</div><div class="items">';
    const ids = Object.keys(S.items).sort((a, b) => (RPG.meta(b).slot ? 1 : 0) - (RPG.meta(a).slot ? 1 : 0) || (RPG.meta(b).heal ? 1 : 0) - (RPG.meta(a).heal ? 1 : 0));
    for (const id of ids) {
      const m = RPG.meta(id), on = m.slot && r.eq[m.slot] === id, f = Inv.facts(id);
      h += '<div' + (on ? ' class="worn"' : '') + '><b>' + ITEMS[id][0] + (S.items[id] > 1 ? ' × ' + S.items[id] : '') + '</b><span>' + ITEMS[id][1] + (f ? ' <i>' + f + '</i>' : '') + '</span>';
      if (m.slot) h += '<button type="button" class="btn small" data-equip="' + id + '">' + (on ? (m.slot === 'weapon' ? 'In hand' : 'Take off') : m.slot === 'weapon' ? 'Wield' : 'Wear') + '</button>';
      else if (m.heal) h += '<button type="button" class="btn small" data-use="' + id + '">' + (id === 'ale' || id === 'potion' || id === 'tonic' ? 'Drink' : 'Eat') + '</button>';
      h += '</div>';
    }
    if (!ids.length) h += '<p class="empty">Your pack is empty.</p>';
    box.innerHTML = h + '</div>';
    if (!Inv.bound) { Inv.bound = true; box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.equip) Inv.equip(b.dataset.equip); else if (b.dataset.use) Inv.use(b.dataset.use); }); }
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
