// [cast] every line shown in the dialogue is noted against the person speaking (82a_memory.js): the one place all talk passes through
{ const _show = showNode; showNode = function (n) { if (n && n.t && UI.talk && UI.talk.id && typeof Memory !== 'undefined') { try { for (const part of String(n.t).split('\n\n')) Memory.hear(UI.talk.id, part); Memory.hear(UI.talk.id, n.t); } catch (e) { } } return _show.apply(this, arguments); }; }
// [cast] A notice is read, not spoken (AUDIT: the board's six texts and the slab's went through the dialogue as though a silent person were talking; A23: the
// Hollow's slab is wordless on purpose, its text is carved). A talk whose "speaker" is a thing is shown as a written card with its choices under it (style.css, body.notice).
const NOTICE_IDS = { board: 1, hollow: 1 };
{ const _st = startTalk, _et = endTalk; startTalk = function (npc) { document.body.classList.toggle('notice', !!(npc && NOTICE_IDS[npc.id])); return _st.apply(this, arguments); }; endTalk = function () { const r = _et.apply(this, arguments); document.body.classList.remove('notice'); return r; }; }
// [cast] CAST81 10: a sleeper answered in his day voice (Godwin, in bed from ten to two, gave his greeting lying down with his eyes shut). Nobody in bed is
// talked to, by any road into a conversation; the prompt says so.
{ const _st = startTalk; startTalk = function (npc) { if (npc && npc.anim === 'lie' && !(npc.id in NOTICE_IDS)) { toast(npc.name + ' is asleep.'); return; } return _st.apply(this, arguments); }; }
{ const _lb = interactLabel; interactLabel = function (it) { if (it && it.npc && it.npc.anim === 'lie') { const w = it.npc.name.split(' '), nm = ['Old', 'Brother', 'Elder', 'Warden', 'Guardsman'].includes(w[0]) ? w[1] : w[0]; return nm + ' is asleep'; } return _lb.apply(this, arguments); }; }
