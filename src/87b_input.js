// ───────────────────────── controls: keyboard and mouse, and a touch layer tuned for thumbs ─────────────────────────
// Replaces inputInit of 78_player.js (which stays as the plain reference); 99_main.js calls inputInit2. Same Input fields, so playerUpdate is unchanged.
//   Touch:  a floating stick appears where the thumb lands on the move half of the screen (the left half, the right half when left-handed);
//           the other half looks. A radial dead zone, rescaled so full push is still 1 (full push runs). Look has a mild acceleration curve.
//           Each finger is tracked by id and cleaned up on cancel, blur and "all fingers up", so the look finger is never lost to a stray event
//           and a lost "up" never leaves the stick stuck.
//   Mouse:  click the view to capture the pointer; Esc releases it, which pauses (onPointerUnlock in 85_ui.js).
Object.assign(Input, { lefty: false, holdUse: false, accel: 0.55, dead: 0.14, stickR: 54, moveId: null, lookId: null });
const lookGain = (dx, dy, dt) => { const v = Math.hypot(dx, dy) / Math.max(4, dt); return 1 + Input.accel * smooth(0.3, 2.4, v); };      // v: pixels per millisecond
function inputInit2(canvas, layer) {
  const I = Input, stick = $('stick'), knob = $('knob');
  const busy = () => !game.playing || Player.locked;
  addEventListener('keydown', e => {
    if (e.repeat) { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault(); return; }
    I.keys[e.code] = true; if (typeof onKey === 'function') onKey(e);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => { I.keys[e.code] = false; });
  const dropAll = () => { I.keys = {}; endStick(); endLook(); I.drag = null; };
  addEventListener('blur', dropAll); addEventListener('pagehide', dropAll);
  document.addEventListener('pointerlockchange', () => { I.plock = document.pointerLockElement === canvas; if (!I.plock && typeof onPointerUnlock === 'function') onPointerUnlock(); });
  addEventListener('mousemove', e => { if (I.plock && !Player.locked) { I.lookX += e.movementX * 0.0022 * I.sens; I.lookY += e.movementY * 0.0022 * I.sens; } });
  const moveSide = x => I.lefty ? x >= innerWidth * 0.5 : x < innerWidth * 0.5;
  function endStick() { if (I.joyT) { I.joyT = null; } I.joy = null; stick.style.display = 'none'; }
  function endLook() { I.look = null; }
  const down = e => {
    if (e.pointerType === 'mouse') {
      if (e.button !== 0 && e.button !== undefined) return;
      if (!I.plock && game.playing && !Player.locked) { I.drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; if (canvas.requestPointerLock) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (err) { } } }
      return;
    }
    I.touch = true; e.preventDefault();
    if (busy()) return;
    if (moveSide(e.clientX) && !I.joyT) {
      const r = 58, x = clamp(e.clientX, r, innerWidth - r), y = clamp(e.clientY, r, innerHeight - r);
      I.joyT = { id: e.pointerId, x, y }; I.joy = { x: 0, y: 0 }; stick.style.display = 'block'; stick.style.left = x + 'px'; stick.style.top = y + 'px'; knob.style.transform = 'translate(-50%,-50%)';
    } else if (!I.look) I.look = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp };
  };
  const move = e => {
    if (I.joyT && e.pointerId === I.joyT.id) {
      const R0 = I.stickR; let dx = (e.clientX - I.joyT.x) / R0, dy = (e.clientY - I.joyT.y) / R0; const l = Math.hypot(dx, dy);
      let m = Math.min(1, l); if (l > 1) { dx /= l; dy /= l; }
      m = m < I.dead ? 0 : (m - I.dead) / (1 - I.dead);                                        // dead zone, then back up to 1 at full push
      const k = l > 1e-6 ? m / Math.min(1, l) : 0; I.joy = { x: dx * k, y: dy * k };
      knob.style.transform = `translate(calc(-50% + ${dx * R0}px), calc(-50% + ${dy * R0}px))`;
      knob.style.background = m > 0.93 ? 'rgba(216,181,99,0.6)' : '';
    } else if (I.look && e.pointerId === I.look.id) {
      const dx = e.clientX - I.look.x, dy = e.clientY - I.look.y, g = lookGain(dx, dy, e.timeStamp - I.look.t) * 0.0052 * I.sens;
      I.lookX += dx * g; I.lookY += dy * g; I.look.x = e.clientX; I.look.y = e.clientY; I.look.t = e.timeStamp;
    } else if (I.drag && e.pointerId === I.drag.id && !I.plock) {
      I.lookX += (e.clientX - I.drag.x) * 0.004 * I.sens; I.lookY += (e.clientY - I.drag.y) * 0.004 * I.sens; I.drag.x = e.clientX; I.drag.y = e.clientY;
    }
  };
  const up = e => {
    if (I.joyT && e.pointerId === I.joyT.id) endStick();
    if (I.look && e.pointerId === I.look.id) endLook();
    if (I.drag && e.pointerId === I.drag.id) I.drag = null;
  };
  layer.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  layer.addEventListener('contextmenu', e => e.preventDefault());
  // every finger gone: nothing can still be held (covers an "up" the browser never delivered)
  const lifted = e => { if (!e.touches || e.touches.length === 0) { endStick(); endLook(); } };
  addEventListener('touchend', lifted, { passive: true }); addEventListener('touchcancel', lifted, { passive: true });
  // no page scroll or pinch zoom behind the game; the journal, dialogue and settings keep their own scrolling
  const scrolls = t => t && t.closest && t.closest('.tab, #dialog, #reader .sheet, #pause, select, input[type=range]');
  document.addEventListener('touchmove', e => { if (!scrolls(e.target)) e.preventDefault(); }, { passive: false });
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, e => e.preventDefault());
  document.addEventListener('selectstart', e => { if (!(e.target && e.target.closest && e.target.closest('input, select, textarea'))) e.preventDefault(); });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dragstart', e => e.preventDefault());
  addEventListener('wheel', e => { if (!scrolls(e.target) && !(e.target && e.target.closest && e.target.closest('#mapWrap'))) e.preventDefault(); }, { passive: false });
}
